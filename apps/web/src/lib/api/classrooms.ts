import { apiFetch } from './client';

export function listarAulas(signal?: AbortSignal): Promise<Response> {
  return apiFetch('/classrooms', { signal });
}

export function listarAlumnosAula(aulaId: string, signal?: AbortSignal): Promise<Response> {
  return apiFetch(`/classrooms/${aulaId}/students`, { signal });
}
