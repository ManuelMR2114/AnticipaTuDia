import type { SupabaseUser } from './supabase-user.js';

/** Petición ya autenticada: SupabaseAuthGuard deja el payload del JWT en request.user. */
export interface AuthedRequest {
    user: SupabaseUser;
}
