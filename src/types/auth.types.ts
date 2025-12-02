export type UserRole = 'client' | 'retailer' | 'wholesaler' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  province: string | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
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
  province?: string;
  city?: string;
  address?: string;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateLocationRequest {
  province?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}
