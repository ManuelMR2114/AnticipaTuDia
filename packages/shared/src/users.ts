import type { ISODateString } from './common.js';
import type { StaffRole, StudentAccess, UserRole } from './auth.js';

export interface CreateStudentRequest {
  fullName: string;
  role: 'student';
  access: StudentAccess;
}

export interface CreateStaffRequest {
  fullName: string;
  role: StaffRole;
  email: string;
  password: string;
}

export type CreateUserRequest = CreateStudentRequest | CreateStaffRequest;

/** Respuesta al crear un usuario. */
export interface UserCreated {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
}

/** Elemento de la lista de usuarios del administrador. */
export interface UserSummary {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  deactivatedAt: ISODateString | null;
}