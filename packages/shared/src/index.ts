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
