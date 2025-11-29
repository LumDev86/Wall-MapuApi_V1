import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth.types';
import {
  ProductsResponse,
  CategoriesResponse,
  ShopsResponse
} from '../types/product.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  getStoredToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('authToken');
  },

  getStoredUser: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('user');
  },

  clearStorage: async (): Promise<void> => {
    await AsyncStorage.clear();
  },
};

export const categoryService = {
  getAll: async (): Promise<CategoriesResponse> => {
    const response = await api.get<CategoriesResponse>('/categories');
    return response.data;
  },
};

export const productService = {
  getAll: async (params?: {
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }): Promise<ProductsResponse> => {
    const response = await api.get<ProductsResponse>('/products', { params });
    return response.data;
  },
};

export const shopService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: 'retailer' | 'wholesaler';
    status?: 'active' | 'pending_payment';
    radius?: number;
    openNow?: boolean;
  }): Promise<ShopsResponse> => {
    const response = await api.get<ShopsResponse>('/shops', { params });
    return response.data;
  },
};

export default api;
