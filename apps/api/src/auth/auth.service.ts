import {
    Injectable,
    Logger,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { SessionResponse, StudentLoginMethod, UserRole } from '@agenda/shared';
import { derivarPassword } from '../users/credentials.js';

const MENSAJE_CREDENCIALES = 'Credenciales incorrectas';

interface ProfileRow {
    id: string;
    full_name: string;
    role: UserRole;
    deactivated_at: string | null;
}

interface StudentProfileRow extends ProfileRow {
    login_method: StudentLoginMethod | null;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly supabase: SupabaseService,
        private readonly config: ConfigService,
    ) { }

    /** Login de personal, familia y admin: correo + contraseña. */
    async loginStaff(email: string, password: string): Promise<SessionResponse> {
        const { data, error } = await this.supabase
            .createAnonClient()
            .auth.signInWithPassword({ email, password });

        if (error || !data.session) {
            // Credenciales malas (4xx) -> 401. Fallo del servicio -> 503.
            if (error?.status !== undefined && error.status < 500) {
                throw new UnauthorizedException(MENSAJE_CREDENCIALES);
            }
            this.logger.error(`Fallo de Supabase Auth en login: ${error?.message}`);
            throw new ServiceUnavailableException('Servicio no disponible');
        }

        const { session } = data;

        const { data: profile, error: profileError } = await this.supabase.admin
            .from('profiles')
            .select('id, full_name, role, deactivated_at')
            .eq('id', data.user.id)
            .maybeSingle<ProfileRow>();

        if (profileError) {
            this.logger.error(`Error leyendo perfil: ${profileError.message}`);
            await this.revocarSesion(session.access_token);
            throw new ServiceUnavailableException('Servicio no disponible');
        }

        // Sin perfil, de baja o alumno (entra por su flujo): misma respuesta
        // que una credencial incorrecta, para no filtrar información.
        if (!profile || profile.deactivated_at !== null || profile.role === 'student') {
            await this.revocarSesion(session.access_token);
            throw new UnauthorizedException(MENSAJE_CREDENCIALES);
        }

        return {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            user: { id: profile.id, fullName: profile.full_name, role: profile.role },
        };
    }

    /**
     * Login de estudiante: id del usuario + la contraseña que compone el frontend
     * (para pictogramas: los ids unidos con '|' en el orden elegido).
     * El método se lee del perfil, nunca de lo que envíe el cliente.
     */
    async loginStudent(id: string, password: string): Promise<SessionResponse> {
        const { data: profile, error: profileError } = await this.supabase.admin
            .from('profiles')
            .select('id, full_name, role, deactivated_at, login_method')
            .eq('id', id)
            .maybeSingle<StudentProfileRow>();

        if (profileError) {
            this.logger.error(`Error leyendo perfil: ${profileError.message}`);
            throw new ServiceUnavailableException('Servicio no disponible');
        }

        // Sin perfil, de baja o que no es alumno: misma respuesta que una
        // credencial incorrecta, para no filtrar información.
        if (!profile || profile.deactivated_at !== null || profile.role !== 'student') {
            throw new UnauthorizedException(MENSAJE_CREDENCIALES);
        }

        // El correo no está en profiles: vive en Auth.
        const { data: usuario, error: errorUsuario } =
            await this.supabase.admin.auth.admin.getUserById(id);

        if (errorUsuario && (errorUsuario.status === undefined || errorUsuario.status >= 500)) {
            this.logger.error(`Fallo al leer el usuario de Auth: ${errorUsuario.message}`);
            throw new ServiceUnavailableException('Servicio no disponible');
        }
        const email = usuario?.user?.email;
        if (!email) {
            throw new UnauthorizedException(MENSAJE_CREDENCIALES);
        }

        // Con contraseña normal se usa tal cual; con PIN, patrón o pictogramas se
        // "amplía" igual que en el alta (users.service.ts).
        const metodo = profile.login_method ?? 'password';
        const secreto = metodo === 'password'
            ? password
            : derivarPassword(
                this.config.getOrThrow<string>('PASSWORD_PEPPER'),
                profile.id,
                metodo,
                password,
            );

        const { data, error } = await this.supabase
            .createAnonClient()
            .auth.signInWithPassword({ email, password: secreto });

        if (error || !data.session) {
            // Credenciales malas (4xx) -> 401. Fallo del servicio -> 503.
            if (error?.status !== undefined && error.status < 500) {
                throw new UnauthorizedException(MENSAJE_CREDENCIALES);
            }
            this.logger.error(`Fallo de Supabase Auth en login de estudiante: ${error?.message}`);
            throw new ServiceUnavailableException('Servicio no disponible');
        }

        const { session } = data;

        return {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            user: { id: profile.id, fullName: profile.full_name, role: profile.role },
        };
    }

    /** La contraseña era correcta pero no se debe dar sesión: se revoca. */
    private async revocarSesion(accessToken: string): Promise<void> {
        try {
            await this.supabase.admin.auth.admin.signOut(accessToken);
        } catch (err) {
            this.logger.warn(`No se pudo revocar la sesión: ${String(err)}`);
        }
    }

    /** Cierre de sesión. */
    async logout(accessToken: string): Promise<void> {

        try {
            const { error } =
                await this.supabase.admin.auth.admin.signOut(
                    accessToken,
                    'local',
                );

            if (error) {
                this.logger.error(
                    `Error cerrando sesión: ${error.message}`,
                );

                throw new ServiceUnavailableException(
                    'No se pudo cerrar la sesión',
                );
            }

        } catch (error) {

            if (error instanceof ServiceUnavailableException) {
                throw error;
            }

            this.logger.error(
                `Error cerrando sesión: ${String(error)}`,
            );

            throw new ServiceUnavailableException(
                'No se pudo cerrar la sesión',
            );
        }
    }
}