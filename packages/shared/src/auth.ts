export type UserRole =
  | 'student'
  | 'tutor'
  | 'teacher'
  | 'specialist'
  | 'family'
  | 'admin';

/** Roles de personal: todos menos alumno y administrador. */
export type StaffRole = Exclude<UserRole, 'student' | 'admin'>;

export const STUDENT_LOGIN_METHODS = [
  'password',
  'pin',
  'pattern',
  'pictogram',
] as const;

export type StudentLoginMethod = (typeof STUDENT_LOGIN_METHODS)[number];

/** Credencial de acceso de un alumno, según su método de login. */
export type StudentAccess =
  | { method: 'pin'; pin: string }
  | { method: 'pattern'; pattern: string }
  | { method: 'password'; password: string }
  // `pictograms` contiene los ids de los pictogramas elegidos, en orden
  | { method: 'pictogram'; pictograms: string[] };

export interface SessionUser {
  id: string;
  fullName: string;
  role: UserRole;
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}