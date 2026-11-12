import type { StaffRole } from './auth.js';

/** Relación entre un alumno y el adulto vinculado a él. */
export type LinkRelation = StaffRole;

export interface StudentLink {
  id: string;
  studentId: string;
  relation: LinkRelation;
  linkedUser: {
    id: string;
    fullName: string;
  };
}

export interface MyStudent {
  studentId: string;
  fullName: string;
  relation: LinkRelation;
  pending: number;
  started: number;
  completed: number;
}