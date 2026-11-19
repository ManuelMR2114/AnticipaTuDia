export interface EnvVars {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    PASSWORD_PEPPER: string;
    PORT: number;
}

const REQUIRED = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'PASSWORD_PEPPER',
] as const;

/** El pepper alimenta el HMAC de las credenciales de los alumnos: debe ser largo. */
const PEPPER_MIN_LENGTH = 32;

export function validateEnv(config: Record<string, unknown>): EnvVars {
    const missing = REQUIRED.filter((key) => {
        const value = config[key];
        return typeof value !== 'string' || value.trim() === '';
    });
    if (missing.length > 0) {
        throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
    }

    const url = config.SUPABASE_URL as string;
    try {
        new URL(url);
    } catch {
        throw new Error('SUPABASE_URL no es una URL válida');
    }

    const pepper = config.PASSWORD_PEPPER as string;
    if (pepper.length < PEPPER_MIN_LENGTH) {
        throw new Error(`PASSWORD_PEPPER debe tener al menos ${PEPPER_MIN_LENGTH} caracteres`);
    }

    const port = config.PORT === undefined || config.PORT === '' ? 3000 : Number(config.PORT);
    if (!Number.isInteger(port) || port <= 0) {
        throw new Error('PORT debe ser un entero positivo');
    }

    return {
        SUPABASE_URL: url,
        SUPABASE_ANON_KEY: config.SUPABASE_ANON_KEY as string,
        SUPABASE_SERVICE_ROLE_KEY: config.SUPABASE_SERVICE_ROLE_KEY as string,
        PASSWORD_PEPPER: pepper,
        PORT: port,
    };
}