export type UserRole = 'student' | 'tutor' | 'admin';

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  hourlyRate?: number;
}

export interface ICourse {
  _id: string;
  title: string;
  description: string;
  tutor: IUser | string;
  thumbnailUrl: string;
  price: number;
  modules: IModule[];
}

export interface IModule {
  _id: string;
  title: string;
  lessons: ILesson[];
}

export interface ILesson {
  _id: string;
  title: string;
  type: 'video' | 'pdf' | 'quiz' | 'assignment';
  mediaUrl?: string;
  duration?: number;
}
