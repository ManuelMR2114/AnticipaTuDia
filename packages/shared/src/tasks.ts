import type { ISODateString } from './common.js';

export type TaskOrigin = 'assigned' | 'personal';

export type TaskStatus = 'pending' | 'started' | 'completed';

export interface Subtask {
  id: string;
  position: number;
  title: string;
  status: TaskStatus;
}

export interface Task {
  id: string;
  studentId: string;
  title: string;
  description: string | null;
  dueAt: ISODateString | null;
  origin: TaskOrigin;
  status: TaskStatus;
  startedAt: ISODateString | null;
  completedAt: ISODateString | null;
  subtasks: Subtask[];
}