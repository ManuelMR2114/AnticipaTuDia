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
     */
    createAnonClient(): SupabaseClient {
        return createClient(
            this.config.getOrThrow('SUPABASE_URL'),
            this.config.getOrThrow('SUPABASE_ANON_KEY'),
            AUTH_OPTIONS,
        );
    }
}