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
} // no es necesaria, si ya tenemos una clase classroom 