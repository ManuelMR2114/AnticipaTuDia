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

// Modificar = reasignar la asociación a otro usuario (misma relación)
export function modificarAsociacion(
  token: string,
  id: string,
  linkedUserId: string,
): Promise<Response> {
  return apiFetch(`/student-links/${id}`, { method: 'PATCH', token, body: { linkedUserId } });
}

export function eliminarAsociacion(
  token: string,
  studentId: string,
  linkedUserId: string,
): Promise<Response> {
  return apiFetch(`/student-links/${studentId}/${linkedUserId}`, { method: 'DELETE', token });
}

export function listarMisAlumnos(token: string): Promise<Response> {
  return apiFetch('/student-links/my-students', { token });
}