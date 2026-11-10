
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Logger,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';

interface RpcError {
    code?: string;
    message?: string;
    details?: string | null;
    hint?: string | null;
}

/**
 * Traduce los errores de PostgreSQL/Supabase a excepciones HTTP.
 *
 * Los detalles internos se registran en el servidor, pero no se
 * devuelven al cliente cuando se trata de errores desconocidos.
 */
export function dbFailure(
    error: RpcError,
    logger: Logger,
    operation: string,
): Error {
    const code = error.code ?? 'UNKNOWN';
    const message = error.message?.trim() || 'Error desconocido de base de datos';

    logger.error(`[${operation}] Error ${code}: ${message}`);

    switch (code) {
        // Error de autorización o regla de negocio de PostgreSQL.
        case 'P0001': {
            const normalized = message.toLocaleLowerCase('es');

            const forbidden =
                normalized.includes('solo puedes eliminar') ||
                normalized.includes('no tienes permiso') ||
                normalized.includes('no autorizado') ||
                normalized.includes('no tienes acceso') ||
                normalized.includes('permission denied') ||
                normalized.includes('forbidden');

            if (forbidden) {
                return new ForbiddenException(message);
            }

            return new BadRequestException(message);
        }

        // Permisos insuficientes en PostgreSQL.
        case '42501':
            return new ForbiddenException('No tienes permisos para realizar esta operación');

        // Registro inexistente.
        case 'P0002':
            return new NotFoundException('El recurso solicitado no existe');

        // Registro duplicado.
        case '23505':
            return new ConflictException('El registro ya existe');

        // Errores de datos o restricciones de la base de datos.
        case '23502':
        case '23503':
        case '23514':
        case '22P02':
        case '22023':
            return new BadRequestException('Los datos proporcionados no son válidos');

        // Cualquier otro error se considera un fallo del servicio.
        default:
            return new ServiceUnavailableException('Servicio no disponible');
    }
}
