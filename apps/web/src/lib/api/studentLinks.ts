import { apiFetch } from './client';

export function listarAsociaciones(token: string, studentId: string): Promise<Response> {
  return apiFetch(`/student-links/student/${encodeURIComponent(studentId)}`, { token });
}

export function crearAsociacion(
  token: string,
  cuerpo: { studentId: string; linkedUserId: string },
): Promise<Response> {
  return apiFetch('/student-links', { method: 'POST', token, body: cuerpo });
}

export function eliminarAsociacion(
  token: string,
  studentId: string,
  linkedUserId: string,
): Promise<Response> {
  return apiFetch(`/student-links/${studentId}/${linkedUserId}`, { method: 'DELETE', token });
}