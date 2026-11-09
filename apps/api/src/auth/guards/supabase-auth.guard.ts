import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { SupabaseUser } from './supabase-user.js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly supabaseUrl =
    process.env.SUPABASE_URL!;

  private readonly jwks = createRemoteJWKSet(
    new URL(
      `${this.supabaseUrl}/auth/v1/.well-known/jwks.json`,
    ),
  );

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const request =
      context.switchToHttp().getRequest();

    const authorization =
      request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException(
        'Missing authorization header',
      );
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Invalid authorization header',
      );
    }

    try {
      const { payload } = await jwtVerify(
        token,
        this.jwks,
        {
          issuer: `${this.supabaseUrl}/auth/v1`,
          audience: 'authenticated',
          algorithms: ['ES256'],
        },
      );

      request.user = payload as SupabaseUser;

      return true;
    } catch {
        throw new UnauthorizedException(
            'Invalid or expired token',
        );
    }
  }
}