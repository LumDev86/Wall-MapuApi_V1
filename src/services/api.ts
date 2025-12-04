import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateLocationRequest,
  User
} from '../types/auth.types';
import {
  Product,
  ProductsResponse,
  Category,
  CategoriesResponse,
  Shop,
  ShopsResponse,
  CreateProductRequest,
  UpdateProductRequest,
  SearchProductsResponse,
  CreateShopRequest,
  UpdateShopRequest,
} from '../types/product.types';
import {
  Subscription,
  CreateSubscriptionRequest,
  SubscriptionStats,
  PaymentStatusResponse,
} from '../types/subscription.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las peticiones
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

// =============================================================================
// AUTH SERVICES
// =============================================================================

export const authService = {
  /**
   * Registrar nuevo usuario
   * POST /api/auth/register
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Iniciar sesión
   * POST /api/auth/login
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Enviar email de recuperación de contraseña
   * POST /api/auth/forgot-password
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  /**
   * Restablecer contraseña mediante token
   * POST /api/auth/reset-password
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Obtener usuario autenticado
   * GET /api/auth/me
   */
  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    // Actualizar usuario en AsyncStorage
    await AsyncStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  /**
   * Actualizar ubicación del usuario
   * PATCH /api/auth/location
   */
  updateLocation: async (data: UpdateLocationRequest): Promise<User> => {
    const response = await api.patch<User>('/auth/location', data);
    // Actualizar usuario en AsyncStorage
    await AsyncStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  /**
   * Cerrar sesión (local)
   */
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  },

  /**
   * Obtener token almacenado
   */
  getStoredToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('authToken');
  },

  /**
   * Obtener usuario almacenado
   */
  getStoredUser: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('user');
  },

  /**
   * Limpiar todo el AsyncStorage (debugging)
   */
  clearStorage: async (): Promise<void> => {
    await AsyncStorage.clear();
  },
};

// =============================================================================
// CATEGORY SERVICES
// =============================================================================

export const categoryService = {
  /**
   * Listar todas las categorías
   * GET /api/categories
   */
  getAll: async (): Promise<CategoriesResponse> => {
    const response = await api.get<CategoriesResponse>('/categories');
    return response.data;
  },

  /**
   * Obtener detalle de una categoría
   * GET /api/categories/:id
   */
  getById: async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  /**
   * Obtener productos de una categoría (paginados)
   * GET /api/categories/:id/products
   */
  getProductsByCategory: async (
    id: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<ProductsResponse> => {
    const response = await api.get<ProductsResponse>(`/categories/${id}/products`, { params });
    return response.data;
  },
};

// =============================================================================
// PRODUCT SERVICES
// =============================================================================

export const productService = {
  /**
   * Listar todos los productos con filtros
   * GET /api/products
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brand?: string;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ProductsResponse> => {
    const response = await api.get<ProductsResponse>('/products', { params });
    return response.data;
  },

  /**
   * Búsqueda en tiempo real de productos
   * GET /api/products/search
   */
  search: async (params: {
    query: string;
    limit?: number;
    latitude?: number;
    longitude?: number;
  }): Promise<SearchProductsResponse> => {
    const response = await api.get<SearchProductsResponse>('/products/search', { params });
    return response.data;
  },

  /**
   * Obtener detalle de un producto
   * GET /api/products/:id
   */
  getById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  /**
   * Listar productos de un shop específico
   * GET /api/products/shop/:shopId
   */
  getByShop: async (
    shopId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: string;
      brand?: string;
      inStock?: boolean;
      minPrice?: number;
      maxPrice?: number;
    }
  ): Promise<ProductsResponse> => {
    const response = await api.get<ProductsResponse>(`/products/shop/${shopId}`, { params });
    return response.data;
  },

  /**
   * Crear producto con imágenes (solo dueño del shop)
   * POST /api/products/shop/:shopId
   */
  create: async (shopId: string, data: CreateProductRequest): Promise<Product> => {
    const formData = new FormData();

    // Campos básicos
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('priceRetail', data.priceRetail.toString());
    if (data.priceWholesale) formData.append('priceWholesale', data.priceWholesale.toString());
    formData.append('stock', data.stock.toString());
    if (data.sku) formData.append('sku', data.sku);
    if (data.barcode) formData.append('barcode', data.barcode);
    if (data.brand) formData.append('brand', data.brand);
    formData.append('categoryId', data.categoryId);

    // Imágenes
    if (data.images && data.images.length > 0) {
      data.images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `product_${index}.jpg`,
        } as any);
      });
    }

    console.log('🚀 Creando producto en tienda:', shopId);
    console.log('📦 Datos del producto:', {
      name: data.name,
      priceRetail: data.priceRetail,
      stock: data.stock,
      categoryId: data.categoryId,
      hasImages: data.images && data.images.length > 0
    });

    const response = await api.post<Product>(`/products/shop/${shopId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ Respuesta del backend al crear producto:', response.data);
    console.log('📋 ID del producto creado:', response.data.id);

    return response.data;
  },

  /**
   * Actualizar producto (solo dueño del shop)
   * PATCH /api/products/:id
   */
  update: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const formData = new FormData();

    // Solo agregar campos que fueron modificados
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.priceRetail) formData.append('priceRetail', data.priceRetail.toString());
    if (data.priceWholesale) formData.append('priceWholesale', data.priceWholesale.toString());
    if (data.stock !== undefined) formData.append('stock', data.stock.toString());
    if (data.sku) formData.append('sku', data.sku);
    if (data.barcode) formData.append('barcode', data.barcode);
    if (data.brand) formData.append('brand', data.brand);
    if (data.categoryId) formData.append('categoryId', data.categoryId);

    // Nuevas imágenes
    if (data.images && data.images.length > 0) {
      data.images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `product_${index}.jpg`,
        } as any);
      });
    }

    const response = await api.patch<Product>(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Eliminar producto (solo dueño del shop)
   * DELETE /api/products/:id
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// =============================================================================
// SHOP SERVICES
// =============================================================================

export const shopService = {
  /**
   * Listar locales en el mapa con filtros y paginación
   * GET /api/shops
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: 'retailer' | 'wholesaler';
    status?: 'pending_payment' | 'active' | 'expired' | 'suspended';
    latitude?: number;
    longitude?: number;
    radius?: number;
    openNow?: boolean;
    product?: string;
  }): Promise<ShopsResponse> => {
    const response = await api.get<ShopsResponse>('/shops', { params });
    return response.data;
  },

  /**
   * Obtener detalle de un local con productos paginados
   * GET /api/shops/:id
   */
  getById: async (
    id: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<Shop> => {
    const response = await api.get<Shop>(`/shops/${id}`, { params });
    return response.data;
  },

  /**
   * Obtener mi local (usuario autenticado)
   * GET /api/shops/me
   */
  getMyShop: async (): Promise<Shop> => {
    const response = await api.get<Shop>('/shops/me');
    return response.data;
  },

  /**
   * Registrar un nuevo local
   * POST /api/shops
   */
  create: async (data: CreateShopRequest): Promise<Shop> => {
    const formData = new FormData();

    // Campos básicos requeridos
    formData.append('name', data.name);
    formData.append('address', data.address);
    formData.append('province', data.province);
    formData.append('city', data.city);
    formData.append('type', data.type);

    // NOTA: El backend NO acepta latitude/longitude
    // El backend hace su propio geocoding basándose en address + city + province
    // Las coordenadas se obtienen automáticamente en el backend
    console.log('Backend will geocode from address:', data.address, data.city, data.province);

    // Campos opcionales básicos
    if (data.description) formData.append('description', data.description);
    if (data.phone) formData.append('phone', data.phone);
    if (data.email) formData.append('email', data.email);
    if (data.website) formData.append('website', data.website);

    // Horarios (JSON string)
    if (data.schedule) {
      formData.append('schedule', JSON.stringify(data.schedule));
    }

    // Imágenes
    if (data.logo) {
      formData.append('logo', {
        uri: data.logo.uri,
        type: data.logo.type || 'image/jpeg',
        name: data.logo.name || 'logo.jpg',
      } as any);
    }

    if (data.banner) {
      formData.append('banner', {
        uri: data.banner.uri,
        type: data.banner.type || 'image/jpeg',
        name: data.banner.name || 'banner.jpg',
      } as any);
    }

    console.log('FormData prepared for /shops endpoint');
    console.log('API URL:', API_URL);

    const response = await api.post<Shop>('/shops', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Actualizar un local (solo dueño)
   * PATCH /api/shops/:id
   */
  update: async (id: string, data: UpdateShopRequest): Promise<Shop> => {
    const formData = new FormData();

    // Solo agregar campos que fueron modificados
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.address) formData.append('address', data.address);
    if (data.province) formData.append('province', data.province);
    if (data.city) formData.append('city', data.city);
    if (data.type) formData.append('type', data.type);
    if (data.phone) formData.append('phone', data.phone);
    if (data.email) formData.append('email', data.email);
    if (data.website) formData.append('website', data.website);
    if (data.latitude) formData.append('latitude', data.latitude.toString());
    if (data.longitude) formData.append('longitude', data.longitude.toString());

    // Horarios
    if (data.schedule) {
      formData.append('schedule', JSON.stringify(data.schedule));
    }

    // Imágenes nuevas
    if (data.logo) {
      formData.append('logo', {
        uri: data.logo.uri,
        type: data.logo.type || 'image/jpeg',
        name: data.logo.name || 'logo.jpg',
      } as any);
    }

    if (data.banner) {
      formData.append('banner', {
        uri: data.banner.uri,
        type: data.banner.type || 'image/jpeg',
        name: data.banner.name || 'banner.jpg',
      } as any);
    }

    const response = await api.patch<Shop>(`/shops/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Eliminar un local (solo dueño)
   * DELETE /api/shops/:id
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/shops/${id}`);
    return response.data;
  },
};

// =============================================================================
// SUBSCRIPTION SERVICES
// =============================================================================

export const subscriptionService = {
  /**
   * Crear suscripción para un shop
   * POST /api/subscriptions
   */
  create: async (data: CreateSubscriptionRequest): Promise<Subscription> => {
    const response = await api.post<Subscription>('/subscriptions', data);
    return response.data;
  },

  /**
   * Reintentar pago de una suscripción fallida
   * POST /api/subscriptions/:id/retry-payment
   */
  retryPayment: async (id: string): Promise<{ message: string; subscription: Subscription }> => {
    const response = await api.post(`/subscriptions/${id}/retry-payment`);
    return response.data;
  },

  /**
   * Obtener estado del pago de una suscripción
   * GET /api/subscriptions/:id/payment-status
   */
  getPaymentStatus: async (id: string): Promise<PaymentStatusResponse> => {
    const response = await api.get<PaymentStatusResponse>(`/subscriptions/${id}/payment-status`);
    return response.data;
  },

  /**
   * Obtener suscripción de un shop
   * GET /api/subscriptions/shop/:shopId
   */
  getByShop: async (shopId: string): Promise<Subscription> => {
    const response = await api.get<Subscription>(`/subscriptions/shop/${shopId}`);
    return response.data;
  },

  /**
   * Cancelar suscripción
   * DELETE /api/subscriptions/:id
   */
  cancel: async (subscriptionId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  },

  /**
   * Estadísticas de suscripciones (solo admin)
   * GET /api/subscriptions/stats
   */
  getStats: async (): Promise<SubscriptionStats> => {
    const response = await api.get<SubscriptionStats>('/subscriptions/stats');
    return response.data;
  },
};

// =============================================================================
// USER SERVICES
// =============================================================================

export const userService = {
  /**
   * Actualizar perfil del usuario autenticado
   * PATCH /api/users/profile
   */
  updateProfile: async (data: {
    birthDate?: string;
    gender?: 'female' | 'male' | 'other';
    barrio?: string;
    hasDogs?: boolean;
    hasCats?: boolean;
    hasOtherPets?: boolean;
    pets?: Array<{
      id: string;
      type: 'dog' | 'cat' | 'other';
      name: string;
      breed?: string;
      age?: string;
    }>;
  }): Promise<{ message: string; user: any }> => {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },

  /**
   * Obtener perfil del usuario autenticado
   * GET /api/users/profile
   */
  getProfile: async (): Promise<any> => {
    const response = await api.get('/users/profile');
    return response.data;
  },
};

export default api;
