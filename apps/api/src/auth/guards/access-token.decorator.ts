import {
    createParamDecorator,
    UnauthorizedException,
    type ExecutionContext,
} from '@nestjs/common';

/**
 * Devuelve el access token del usuario (cabecera Authorization: Bearer ...) para
 * poder reenviarlo a Supabase con SupabaseService.createUserClient().
 *
 * Úsalo SIEMPRE junto a SupabaseAuthGuard: es el guard quien valida la firma y la
 * caducidad. Este decorador solo extrae el texto del token, no lo comprueba.
 */
export const AccessToken = createParamDecorator(
    (_data: unknown, context: ExecutionContext): string => {
        const request = context
            .switchToHttp()
            .getRequest<{ headers: { authorization?: string } }>();
        const [tipo, token] = (request.headers.authorization ?? '').split(' ');
        if (tipo !== 'Bearer' || !token) {
            throw new UnauthorizedException('Missing authorization header');
        }
        return token;
    },
);
