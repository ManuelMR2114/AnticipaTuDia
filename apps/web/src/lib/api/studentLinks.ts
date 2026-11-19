import { apiFetch } from './client';

// Relaciones que se pueden crear entre un estudiante y otro usuario
export type RelacionAsociacion = 'tutor' | 'family';

// Una asociación tal como la devuelve la API (el nombre viene resuelto para no pedir usuarios aparte)
export interface Asociacion {
  id: string;
  studentId: string;
  linkedUserId: string;
  linkedUserName: string;
  relation: RelacionAsociacion;
}

export function listarAsociaciones(token: string, studentId: string): Promise<Response> {
  return apiFetch(`/student-links?studentId=${encodeURIComponent(studentId)}`, { token });
}

export function crearAsociacion(
  token: string,
  cuerpo: { studentId: string; linkedUserId: string},
): Promise<Response> {
  return apiFetch('/student-links', { method: 'POST', token, body: cuerpo });
}

// Modificar = reasignar la asociación a otro usuario (misma relación)
export function modificarAsociacion(
  token: string,
  id: string,
  linkedUserId: string,
): Promise<Response> {
  return apiFetch(`/student-links/${id}`, { method: 'PATCH', token, body: { linkedUserId } });
}

export function eliminarAsociacion(token: string, id: string): Promise<Response> {
  return apiFetch(`/student-links/${id}`, { method: 'DELETE', token });
}