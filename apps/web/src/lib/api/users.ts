import type { CreateUserRequest, UserRole } from '@agenda/shared';
import { apiFetch } from './client';

export function listarUsuarios(token: string): Promise<Response> {
  return apiFetch('/users', { token });
}

export function crearUsuario(token: string, cuerpo: CreateUserRequest): Promise<Response> {
  return apiFetch('/users', { method: 'POST', token, body: cuerpo });
}

export function darDeBajaUsuario(token: string, id: string): Promise<Response> {
  return apiFetch(`/users/${id}/deactivated_at`, { method: 'PATCH', token });
}

export function cambiarRolUsuario(
  token: string,
  id: string,
  role: UserRole,
): Promise<Response> {
  return apiFetch(`/users/${id}/role`, { method: 'PATCH', token, body: { role } });
}
