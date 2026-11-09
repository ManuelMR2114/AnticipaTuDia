import { JWTPayload } from 'jose';

export interface SupabaseUser extends JWTPayload {
  sub: string;
  email?: string;
  user_role?: string;
}