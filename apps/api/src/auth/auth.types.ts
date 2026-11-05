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