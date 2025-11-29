export type UserRole = 'client' | 'retailer' | 'wholesaler' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  passwordResetExpires: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasSubscription?: boolean;
  bannerImage?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}
