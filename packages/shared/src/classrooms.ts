import type { StudentLoginMethod } from './auth.js';
import type { UserSummary } from './users.js';

// GET /classrooms
export interface Classroom {
  id: string;
  name: string;
  groupName: string | null;
}

// GET /classrooms/:id/students
export type ClassroomStudent = Pick<UserSummary, 'id' | 'fullName'> & {
  loginMethod?: StudentLoginMethod | null;
};