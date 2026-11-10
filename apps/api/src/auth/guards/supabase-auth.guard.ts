
import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';

import { SupabaseService } from '../../supabase/supabase.service.js';

interface AuthenticatedRequest {
  headers: {
    authorization?: string;
  };
  user?: {
    sub: string;
    role: string;
    user_role: string;
    email?: string;
  };
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 1. Obtener token Bearer
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        'Token no proporcionado',
      );
    }

    const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());

    if (!match) {
      throw new UnauthorizedException(
        'Formato de autorización incorrecto',
      );
    }

    const token = match[1];

    try {
      // 2. Verificar el JWT contra Supabase Auth
      const {
        data: { user },
        error: authError,
      } = await this.supabase.admin.auth.getUser(token);

      if (authError || !user) {
        throw new UnauthorizedException(
          'Token inválido o expirado',
        );
      }

      // 3. Consultar el perfil actualizado
      const {
        data: perfil,
        error: profileError,
      } = await this.supabase.admin
        .from('profiles')
        .select('role, deactivated_at')
        .eq('id', user.id)
        .maybeSingle<{
          role: string;
          deactivated_at: string | null;
        }>();

      if (profileError) {
        throw new ServiceUnavailableException(
          'No se pudo comprobar el perfil',
        );
      }

      // 4. Rechazar usuarios inexistentes o dados de baja
      if (
        !perfil ||
        perfil.deactivated_at !== null
      ) {
        throw new UnauthorizedException(
          'Cuenta desactivada o inexistente',
        );
      }

      // 5. Incorporar el rol actualizado a la petición
      request.user = {
        sub: user.id,
        role: perfil.role,
        user_role: perfil.role,
        email: user.email,
      };

      return true;

    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'No se pudo verificar la sesión',
      );
    }
  }
}
