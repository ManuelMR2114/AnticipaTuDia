import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { EnvVars } from './env.validation.js';

const AUTH_OPTIONS = {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
} as const;

@Injectable()
export class SupabaseService {
    /** Cliente con service_role: salta RLS. Solo para uso interno del backend. */
    readonly admin: SupabaseClient;

    constructor(private readonly config: ConfigService<EnvVars, true>) {
        this.admin = createClient(
            this.config.getOrThrow('SUPABASE_URL'),
            this.config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
            AUTH_OPTIONS,
        );
    }

    /**
     * Cliente con anon key, nuevo en cada llamada. Sirve para operaciones de
     * Auth (p. ej. signInWithPassword) sin contaminar el cliente admin.
     * Es decir, este es el cliente que se usuará para los usuarios, el otro es el que se utilizará
     * para las operaciones de administrador totales, no tiene limitaciones.
     */
    createAnonClient(): SupabaseClient {
        return createClient(
            this.config.getOrThrow('SUPABASE_URL'),
            this.config.getOrThrow('SUPABASE_ANON_KEY'),
            AUTH_OPTIONS,
        );
    }

    /**
    * Cliente "en nombre del usuario": lleva SU access token, así que para la base de
    * datos quien actúa es él (auth.uid() = su id) y la RLS y las funciones SQL
    * comprueban sus permisos. Es el cliente que usan tareas y vínculos.
    * Se crea nuevo en cada petición: el token es de un solo usuario.
    * (El token ya lo validó SupabaseAuthGuard; PostgREST lo vuelve a validar.)
    */
    createUserClient(accessToken: string): SupabaseClient {
        return createClient(
            this.config.getOrThrow('SUPABASE_URL'),
            this.config.getOrThrow('SUPABASE_ANON_KEY'),
            {
                ...AUTH_OPTIONS,
                global: { headers: { Authorization: `Bearer ${accessToken}` } },
            },
        );
    }
}