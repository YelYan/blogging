export interface User {
  id: string;
  username: string;
  email: string;
  photo: string;
  role: string;
  readList?: string[];
  readListLength?: number;
}

export interface Story {
  _id: string;
  author: User;
  slug: string;
  title: string;
  content: string;
  image: string;
  readtime: number;
  likes: string[];
  likeCount: number;
  comments: Comment[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  story: string;
  content: string;
  author: User;
  likes: string[];
  likeCount: number;
  star: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}