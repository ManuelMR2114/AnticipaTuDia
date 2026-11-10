export type UserRole =
  | 'student'
  | 'tutor'
  | 'teacher'
  | 'specialist'
  | 'family'
  | 'admin';

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    fullName: string;
    role: UserRole;
  };
}

export interface Pictogram {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
}

//GET /classrooms 
export interface Classroom {
  id: string;
  name: string;
  groupName: string | null;
}

//GET /classrooms/:id/students 
export interface ClassroomStudent {
  id: string;
  fullName: string;
  loginMethod?: StudentLoginMethod | null;
} // no es necesaria, si ya tenemos una clase classroom 


export type StudentLoginMethod =
  | 'password'
  | 'pin'
  | 'pattern'
  | 'pictogram';

export type TaskOrigin = 'assigned' | 'personal';

export type TaskStatus = 'pending' | 'started' | 'completed';

export type LinkRelation =
  | 'tutor'
  | 'teacher'
  | 'specialist'
  | 'family';

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
  dueAt: string | null;
  origin: TaskOrigin;
  status: TaskStatus;
  startedAt: string | null;
  completedAt: string | null;
  subtasks: Subtask[];
}

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

