import type { AssignTaskRequest } from '@agenda/shared';
import { apiFetch } from './client';

export function asignarTarea(token: string, cuerpo: AssignTaskRequest): Promise<Response> {
  return apiFetch('/tasks/assign', { method: 'POST', token, body: cuerpo });
}