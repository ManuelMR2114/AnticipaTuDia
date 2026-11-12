import { apiFetch } from './client';

export function loginPersonal(email: string, password: string): Promise<Response> {
  return apiFetch('/auth/login', { method: 'POST', body: { email, password } });
}

export function loginAlumno(studentId: string, password: string): Promise<Response> {
  return apiFetch('/auth/student/login', {
    method: 'POST',
    body: { studentId, password },
  });
}
