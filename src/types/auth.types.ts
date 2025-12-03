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

// Tipos para mascotas del cliente
export interface Pet {
  id: string;
  type: 'dog' | 'cat' | 'other';
  name: string;
  breed: string;
  age: string;
}

export type Gender = 'female' | 'male' | 'other';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  // Campos para tiendas
  province?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  // Campos opcionales para clientes
  birthDate?: string;
  gender?: Gender;
  barrio?: string;
  hasDogs?: boolean;
  hasCats?: boolean;
  hasOtherPets?: boolean;
  pets?: Pet[];
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
