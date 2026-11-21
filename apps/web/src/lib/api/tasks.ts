import type { AssignTaskRequest } from '@agenda/shared';
import { apiFetch } from './client';

export function asignarTarea(token: string, cuerpo: AssignTaskRequest): Promise<Response> {
  return apiFetch('/tasks/assign', { method: 'POST', token, body: cuerpo });
}

export function listarAgenda(
  token: string,
  studentId: string,
  from?: string,
  to?: string,
): Promise<Response> {
  const params = new URLSearchParams({ studentId });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch(`/tasks?${params.toString()}`, { token });
}

export function eliminarTarea(token: string, id: string): Promise<Response> {
  return apiFetch(`/tasks/${id}`, { method: 'DELETE', token });
}