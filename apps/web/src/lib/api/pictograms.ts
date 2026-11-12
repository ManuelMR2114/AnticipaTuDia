import { apiFetch } from './client';

export function listarPictogramasAlumno(studentId: string): Promise<Response> {
  return apiFetch(`/pictograms/student/${studentId}`);
}
