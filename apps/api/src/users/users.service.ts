import { randomBytes, randomUUID } from 'node:crypto';
import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SessionResponse, UserSummary, UserRole } from '@agenda/shared';
import { derivarPassword } from './credentials.js';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { CreateUserDto, StudentAccessDto } from './create-user.dto.js';

/** Correo opaco de los alumnos: nadie lo escribe. Probar que Supabase lo acepta. */
const DOMINIO_ALUMNOS = 'alumnos.anticipatudia.invalid';

/** Duración del bloqueo en Auth para una baja (≈100 años). */
const BAJA_INDEFINIDA = '876000h';

/**
 * Valor de cada método en el enum login_method de profiles.
 * Enum real: password | pin | pattern | pictogram (pattern, las formas, aún no está soportado).
 */

const LOGIN_METHOD_DB: Record<StudentAccessDto['method'], string> = {
    password: 'password',
    pin: 'pin',
    pattern: 'pattern',
    pictogram: 'pictogram',
};


type UsuarioBasico = SessionResponse['user'];

interface PerfilBasico {
    id: string;
    role: string;
    deactivated_at: string | null;
}
export interface PerfilLista {
    id: string;
    full_name: string;
    role: string;
    deactivated_at: string | null;
}

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private readonly supabase: SupabaseService,
        private readonly config: ConfigService,
    ) { }


    // Listar

    /** Todos los usuarios, incluidos los dados de baja, ordenados por nombre. */
    async findAll(): Promise<UserSummary[]> {
        const [perfiles, correos] = await Promise.all([
            this.supabase.admin
                .from('profiles')
                .select('id, full_name, role, deactivated_at')
                .order('full_name', { ascending: true }),
            this.leerCorreos(),
        ]);

        if (perfiles.error) {
            this.logger.error(`Error listando usuarios: ${perfiles.error.message}`);
            throw new ServiceUnavailableException('Servicio no disponible');
        }

        const filas = (perfiles.data ?? []) as unknown as PerfilLista[];
        return filas.map((p) => ({
            id: p.id,
            fullName: p.full_name,
            // El correo de los alumnos es opaco (est-<uuid>@...invalid): no se muestra.
            email: p.role === 'student' ? null : (correos.get(p.id) ?? null),
            role: p.role as UserRole,
            deactivatedAt: p.deactivated_at,
        }));
    }

    /** Mapa id → correo leído de Auth (paginado: listUsers devuelve como máximo 1000 por página). */
    private async leerCorreos(): Promise<Map<string, string>> {
        const correos = new Map<string, string>();
        const porPagina = 1000;

        for (let page = 1; ; page++) {
            const { data, error } = await this.supabase.admin.auth.admin.listUsers({
                page,
                perPage: porPagina,
            });

            if (error) {
                this.logger.error(`Error leyendo correos de Auth: ${error.message}`);
                throw new ServiceUnavailableException('Servicio no disponible');
            }

            for (const usuario of data.users) {
                if (usuario.email) correos.set(usuario.id, usuario.email);
            }
            if (data.users.length < porPagina) break;
        }

        return correos;
    }

    // Dar de alta

    async create(dto: CreateUserDto): Promise<UsuarioBasico> {
        return dto.role === 'student' ? this.createStudent(dto) : this.createStaff(dto);
    }

    private async createStaff(dto: CreateUserDto): Promise<UsuarioBasico> {
        const { data, error } = await this.supabase.admin.auth.admin.createUser({
            email: dto.email as string,
            password: dto.password as string,
            email_confirm: true,
        });

        if (error || !data.user) {
            if (error?.status === 422 || error?.code === 'email_exists') {
                throw new ConflictException('Ya existe un usuario con ese correo');
            }
            this.logger.error(`Fallo al crear usuario en Auth: ${error?.message}`);
            throw new ServiceUnavailableException('Servicio no disponible');
        }

        const userId = data.user.id;
        try {
            await this.guardarPerfil(userId, dto);
        } catch (err) {
            await this.eliminarUsuarioCreado(userId);
            throw err;
        }

        return { id: userId, fullName: dto.fullName, role: dto.role };
    }

    private async createStudent(dto: CreateUserDto): Promise<UsuarioBasico> {
        const acceso = dto.access as StudentAccessDto;

        if (acceso.method === 'pictogram') {
            await this.comprobarPictogramas(acceso.pictograms ?? []);
        }

        // Con contraseña normal se crea ya con la definitiva; con PIN o pictogramas,
        // con una aleatoria y se sustituye en cuanto se conoce el id del usuario.
        const { data, error } = await this.supabase.admin.auth.admin.createUser({
            email: `est-${randomUUID()}@${DOMINIO_ALUMNOS}`,
            password: acceso.method === 'password'
                ? (acceso.password as string)
                : randomBytes(32).toString('base64url'),
            email_confirm: true,
        });

        if (error || !data.user) {
            this.logger.error(`Fallo al crear estudiante en Auth: ${error?.message}`);
            throw new ServiceUnavailableException('Servicio no disponible');
        }

        const userId = data.user.id;

        try {
            if (acceso.method !== 'password') {
                const secreto = acceso.method === 'pin'
                    ? (acceso.pin as string)
                    : (acceso.pictograms as string[]).join('|');

                const { error: errorPassword } = await this.supabase.admin.auth.admin.updateUserById(userId, {
                    password: derivarPassword(
                        this.config.getOrThrow<string>('PASSWORD_PEPPER'),
                        userId,
                        acceso.method,
                        secreto,
                    ),
                });
                if (errorPassword) {
                    this.logger.error(`No se pudo fijar la contraseña: ${errorPassword.message}`);
                    throw new ServiceUnavailableException('Servicio no disponible');
                }
            }

            await this.guardarPerfil(userId, dto, LOGIN_METHOD_DB[acceso.method]);

            if (acceso.method === 'pictogram') {
                await this.guardarPictogramas(userId, acceso.pictograms as string[]);
            }
        } catch (err) {
            // No dejar un usuario a medias (Auth, perfil o pictogramas).
            await this.eliminarUsuarioCreado(userId);
            throw err;
        }

        return { id: userId, fullName: dto.fullName, role: dto.role };
    }

    // Dar de baja

    /**
     * Baja lógica: bloquea el usuario en Auth (no podrá entrar ni renovar la sesión)
     * y marca el perfil. No se borra nada, para conservar el histórico.
     * Es idempotente: repetirla no cambia la fecha de baja original.
     */
    async deactivate(id: string, actorId: string): Promise<void> {
        if (id === actorId) {
            throw new BadRequestException('No puedes darte de baja a ti mismo');
        }
        await this.leerPerfil(id); // 404 si no existe

        // Primero el bloqueo: si algo falla después, el fallo es hacia el lado seguro.
        const { error } = await this.supabase.admin.auth.admin.updateUserById(id, {
            ban_duration: BAJA_INDEFINIDA,
        });
        if (error) {
            this.logger.error(`No se pudo bloquear al usuario en Auth: ${error.message}`);
            throw new ServiceUnavailableException('Servicio no disponible');
        }

        const { error: errorPerfil } = await this.supabase.admin
            .from('profiles')
            .update({ deactivated_at: new Date().toISOString() })
            .eq('id', id)
            .is('deactivated_at', null);

        if (errorPerfil) {
            this.logger.error(`Error marcando la baja: ${errorPerfil.message}`);
            throw new InternalServerErrorException('No se pudo completar la baja');
        }
    }

    // Cambiar roles

    async setRole(id: string, role: string, actorId: string): Promise<{ id: string; role: string }> {
        if (id === actorId) {
            throw new BadRequestException('No puedes cambiar tu propio rol');
        }

        const perfil = await this.leerPerfil(id);

        // Alumno y resto de roles tienen credenciales distintas (correo opaco + pictogramas/PIN).
        if ((perfil.role === 'student') !== (role === 'student')) {
            throw new BadRequestException(
                'No se puede cambiar un estudiante a otro rol ni al revés: crea un usuario nuevo',
            );
        }

        const { error } = await this.supabase.admin
            .from('profiles')
            .update({ role })
            .eq('id', id);

        if (error) {
            this.logger.error(`Error cambiando el rol: ${error.message}`);
            throw new InternalServerErrorException('No se pudo cambiar el rol');
        }

        return { id, role };
    }

    // Funciones auxiliares

    /**
     * upsert y no insert: si existe un trigger sobre auth.users que ya crea el
     * perfil, esto lo completa; si no existe, lo crea.
     */
    private async guardarPerfil(
        id: string,
        dto: CreateUserDto,
        loginMethod?: string,
    ): Promise<void> {
        const { error } = await this.supabase.admin.from('profiles').upsert(
            {
                id,
                full_name: dto.fullName,
                role: dto.role,
                ...(loginMethod ? { login_method: loginMethod } : {}),
            },
            { onConflict: 'id' },
        );

        if (error) {
            this.logger.error(`Error guardando perfil: ${error.message}`);
            throw new InternalServerErrorException('No se pudo crear el usuario');
        }
    }

    /**
     * Guarda QUÉ pictogramas tiene el alumno (el conjunto), nunca el orden: el
     * orden es la contraseña. Se insertan ordenados por id para que el orden
     * físico de las filas tampoco coincida con el de la contraseña.
     */
    private async guardarPictogramas(userId: string, ids: string[]): Promise<void> {
        const filas = [...ids].sort().map((pictogram_id) => ({ user_id: userId, pictogram_id }));

        const { error } = await this.supabase.admin.from('pictogram_credentials').insert(filas);
        if (error) {
            this.logger.error(`Error guardando pictogramas del alumno: ${error.message}`);
            throw new InternalServerErrorException('No se pudo crear el usuario');
        }
    }

    /**
     * Deshace un alta a medias. Las FK impiden borrar el usuario de Auth mientras
     * existan su perfil o sus pictogramas, así que se borra en este orden.
     */
    private async eliminarUsuarioCreado(id: string): Promise<void> {
        try {
            await this.supabase.admin.from('pictogram_credentials').delete().eq('user_id', id);
            await this.supabase.admin.from('profiles').delete().eq('id', id);
            const { error } = await this.supabase.admin.auth.admin.deleteUser(id);
            if (error) {
                this.logger.error(`Usuario ${id} quedó a medias en Auth: ${error.message}`);
            }
        } catch (err) {
            this.logger.error(`No se pudo deshacer el alta de ${id}: ${String(err)}`);
        }
    }

    private async leerPerfil(id: string): Promise<PerfilBasico> {
        const { data, error } = await this.supabase.admin
            .from('profiles')
            .select('id, role, deactivated_at')
            .eq('id', id)
            .maybeSingle<PerfilBasico>();

        if (error) {
            this.logger.error(`Error leyendo perfil: ${error.message}`);
            throw new ServiceUnavailableException('Servicio no disponible');
        }
        if (!data) {
            throw new NotFoundException('Usuario no encontrado');
        }
        return data;
    }

    /** Evita contraseñas imposibles: todos los pictogramas deben existir y estar activos. */
    private async comprobarPictogramas(ids: string[]): Promise<void> {
        const { data, error } = await this.supabase.admin
            .from('pictograms')
            .select('id')
            .eq('active', true)
            .in('id', ids);

        if (error) {
            this.logger.error(`Error comprobando pictogramas: ${error.message}`);
            throw new ServiceUnavailableException('Servicio no disponible');
        }
        if ((data ?? []).length !== ids.length) {
            throw new BadRequestException('Algún pictograma no existe o no está activo');
        }
    }
}