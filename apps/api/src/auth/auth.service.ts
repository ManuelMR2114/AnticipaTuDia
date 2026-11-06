import {
    Injectable,
    Logger,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import type { SessionResponse, UserRole } from '@agenda/shared';

const MENSAJE_CREDENCIALES = 'Credenciales incorrectas';

interface ProfileRow {
    id: string;
    full_name: string;
    role: UserRole;
    deactivated_at: string | null;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(private readonly supabase: SupabaseService) { }

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

    /** La contraseña era correcta pero no se debe dar sesión: se revoca. */
    private async revocarSesion(accessToken: string): Promise<void> {
        try {
            await this.supabase.admin.auth.admin.signOut(accessToken);
        } catch (err) {
            this.logger.warn(`No se pudo revocar la sesión: ${String(err)}`);
        }
    }
}