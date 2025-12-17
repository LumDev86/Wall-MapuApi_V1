import axios from 'axios';
import { env } from '../utils/env';
import { secureStorage } from '../utils/secureStorage';
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
import {
  uploadImage,
  uploadMultipleImages,
  generateTempId,
} from './supabase';

const API_URL = env.API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las peticiones
api.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getToken();
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
      await secureStorage.saveToken(response.data.token);
      await secureStorage.saveUser(response.data.user);
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
      await secureStorage.saveToken(response.data.token);
      await secureStorage.saveUser(response.data.user);
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
    await secureStorage.saveUser(response.data);
    return response.data;
  },

  /**
   * Actualizar ubicación del usuario
   * PATCH /api/auth/location
   */
  updateLocation: async (data: UpdateLocationRequest): Promise<User> => {
    const response = await api.patch<User>('/auth/location', data);
    // Actualizar usuario en AsyncStorage
    await secureStorage.saveUser(response.data);
    return response.data;
  },

  /**
   * Cerrar sesión (local)
   */
  logout: async (): Promise<void> => {
    await secureStorage.deleteToken();
    await secureStorage.deleteUser();
  },

  /**
   * Obtener token almacenado
   */
  getStoredToken: async (): Promise<string | null> => {
    return await secureStorage.getToken();
  },

  /**
   * Obtener usuario almacenado
   */
  getStoredUser: async (): Promise<string | null> => {
    const user = await secureStorage.getUser(); return user ? JSON.stringify(user) : null;
  },

  /**
   * Limpiar todo el AsyncStorage (debugging)
   */
  clearStorage: async (): Promise<void> => {
    await secureStorage.clearAll();
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
   *
   * Las imágenes se suben primero a Supabase Storage y luego se envían las URLs al backend
   */
  create: async (shopId: string, data: CreateProductRequest): Promise<Product> => {
    console.log('🚀 Creando producto en tienda:', shopId);

    // Prepare request body WITHOUT images (backend doesn't accept them in create)
    const requestBody: Record<string, any> = {
      name: data.name,
      priceRetail: data.priceRetail,
      stock: data.stock,
      categoryId: data.categoryId,
    };

    // Optional fields
    if (data.description) requestBody.description = data.description;
    if (data.priceWholesale) requestBody.priceWholesale = data.priceWholesale;
    if (data.sku) requestBody.sku = data.sku;
    if (data.barcode) requestBody.barcode = data.barcode;
    if (data.brand) requestBody.brand = data.brand;

    console.log('📦 Datos del producto:', {
      name: data.name,
      priceRetail: data.priceRetail,
      stock: data.stock,
      categoryId: data.categoryId,
      hasImages: data.images && data.images.length > 0,
    });

    // Create product first without images
    const response = await api.post<any>(`/products/shop/${shopId}`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Extract product from response (backend returns { message, product })
    const product = response.data.product || response.data;
    console.log('✅ Producto creado:', product);
    console.log('📋 ID del producto:', product.id);

    // If there are images, upload them and update the product
    if (data.images && data.images.length > 0 && product.id) {
      try {
        console.log(`📸 Subiendo ${data.images.length} imágenes a Supabase...`);
        const imageUrls = await uploadMultipleImages(
          data.images,
          'product',
          { shopId, productId: product.id }
        );
        console.log('✅ Imágenes subidas a Supabase:', imageUrls);

        // Update product with images (backend expects 'imagesBase64' field)
        console.log('🔄 Actualizando producto con imágenes...');
        const updatedResponse = await api.patch<any>(
          `/products/${product.id}`,
          { imagesBase64: imageUrls },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const updatedProduct = updatedResponse.data.product || updatedResponse.data;
        console.log('✅ Producto actualizado con imágenes');
        return updatedProduct;
      } catch (imageError: any) {
        console.error('❌❌❌ ERROR AL SUBIR IMÁGENES ❌❌❌');
        console.error('Error completo:', JSON.stringify(imageError, null, 2));
        console.error('Error message:', imageError.message);
        console.error('Error response:', imageError.response?.data);
        console.error('Error status:', imageError.response?.status);
        console.error('Stack trace:', imageError.stack);

        // Show alert to user
        console.error('⚠️ El producto fue creado pero las imágenes no se pudieron subir');

        // Return the product even if image upload fails
        return product;
      }
    }

    return product;
  },

  /**
   * Actualizar producto (solo dueño del shop)
   * PATCH /api/products/:id
   *
   * Las imágenes nuevas se suben a Supabase Storage y se envían las URLs al backend
   */
  update: async (id: string, data: UpdateProductRequest, shopId?: string): Promise<Product> => {
    // Upload new images to Supabase Storage if provided
    let imageUrls: string[] = [];

    try {
      if (data.images && data.images.length > 0) {
        console.log(`📸 Uploading ${data.images.length} new images to Supabase...`);
        imageUrls = await uploadMultipleImages(
          data.images,
          'product',
          { shopId: shopId || 'unknown', productId: id }
        );
        console.log('✅ Images uploaded:', imageUrls);
      }
    } catch (uploadError) {
      console.error('Error uploading images to Supabase:', uploadError);
      throw new Error('Error al subir las imágenes. Por favor intenta nuevamente.');
    }

    // Prepare request body with only modified fields
    const requestBody: Record<string, any> = {};

    if (data.name) requestBody.name = data.name;
    if (data.description) requestBody.description = data.description;
    if (data.priceRetail) requestBody.priceRetail = data.priceRetail;
    if (data.priceWholesale) requestBody.priceWholesale = data.priceWholesale;
    if (data.stock !== undefined) requestBody.stock = data.stock;
    if (data.sku) requestBody.sku = data.sku;
    if (data.barcode) requestBody.barcode = data.barcode;
    if (data.brand) requestBody.brand = data.brand;
    if (data.categoryId) requestBody.categoryId = data.categoryId;

    // Image URLs from Supabase (backend expects 'imagesBase64' field)
    if (imageUrls.length > 0) {
      requestBody.imagesBase64 = imageUrls;
    }

    const response = await api.patch<Product>(`/products/${id}`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
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
    const response = await api.get<{ shop: Shop; products: any[]; pagination: any }>(`/shops/${id}`, { params });
    // El backend devuelve { shop: {...}, products: [...], pagination: {...} }
    return response.data.shop;
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
   *
   * Las imágenes se suben primero a Supabase Storage y luego se envían las URLs al backend
   */
  create: async (data: CreateShopRequest): Promise<Shop> => {
    // Generate a temporary ID for organizing images before shop creation
    const tempShopId = generateTempId();

    console.log('Creating shop with temp ID for images:', tempShopId);

    // Upload images to Supabase Storage first
    let logoUrl: string | undefined;
    let bannerUrl: string | undefined;

    try {
      if (data.logo) {
        console.log('Uploading shop logo to Supabase...');
        logoUrl = await uploadImage(data.logo.uri, 'shop-logo', { shopId: tempShopId });
        console.log('Logo uploaded:', logoUrl);
      }

      if (data.banner) {
        console.log('Uploading shop banner to Supabase...');
        bannerUrl = await uploadImage(data.banner.uri, 'shop-banner', { shopId: tempShopId });
        console.log('Banner uploaded:', bannerUrl);
      }
    } catch (uploadError) {
      console.error('Error uploading images to Supabase:', uploadError);
      throw new Error('Error al subir las imágenes. Por favor intenta nuevamente.');
    }

    // Prepare request body with image URLs
    // Note: Backend only accepts specific fields - category, ivaPosition, convenioMultilateral are NOT accepted
    const requestBody: Record<string, any> = {
      name: data.name,
      address: data.address,
      province: data.province,
      city: data.city,
      type: data.type,
    };

    // Coordinates - required by backend
    if (data.latitude !== undefined) requestBody.latitude = data.latitude;
    if (data.longitude !== undefined) requestBody.longitude = data.longitude;

    // Optional fields accepted by backend
    if (data.description) requestBody.description = data.description;
    if (data.phone) requestBody.phone = data.phone;
    if (data.email) requestBody.email = data.email;
    if (data.website) requestBody.website = data.website;
    if (data.schedule) requestBody.schedule = data.schedule;

    // Image URLs from Supabase
    if (logoUrl) requestBody.logo = logoUrl;
    if (bannerUrl) requestBody.banner = bannerUrl;

    console.log('Sending shop data to backend:', {
      ...requestBody,
      logo: logoUrl ? 'URL present' : 'absent',
      banner: bannerUrl ? 'URL present' : 'absent',
    });

    const response = await api.post<Shop>('/shops', requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  },

  /**
   * Actualizar un local (solo dueño)
   * PATCH /api/shops/:id
   *
   * Las imágenes nuevas se suben a Supabase Storage y se envían las URLs al backend
   */
  update: async (id: string, data: UpdateShopRequest): Promise<Shop> => {
    // Upload new images to Supabase Storage if provided
    let logoUrl: string | undefined;
    let bannerUrl: string | undefined;

    try {
      if (data.logo) {
        console.log('Uploading new shop logo to Supabase...');
        logoUrl = await uploadImage(data.logo.uri, 'shop-logo', { shopId: id });
        console.log('Logo uploaded:', logoUrl);
      }

      if (data.banner) {
        console.log('Uploading new shop banner to Supabase...');
        bannerUrl = await uploadImage(data.banner.uri, 'shop-banner', { shopId: id });
        console.log('Banner uploaded:', bannerUrl);
      }
    } catch (uploadError) {
      console.error('Error uploading images to Supabase:', uploadError);
      throw new Error('Error al subir las imágenes. Por favor intenta nuevamente.');
    }

    // Prepare request body with only modified fields
    const requestBody: Record<string, any> = {};

    if (data.name) requestBody.name = data.name;
    if (data.description) requestBody.description = data.description;
    if (data.address) requestBody.address = data.address;
    if (data.province) requestBody.province = data.province;
    if (data.city) requestBody.city = data.city;
    if (data.type) requestBody.type = data.type;
    if (data.phone) requestBody.phone = data.phone;
    if (data.email) requestBody.email = data.email;
    if (data.website) requestBody.website = data.website;
    if (data.latitude) requestBody.latitude = data.latitude;
    if (data.longitude) requestBody.longitude = data.longitude;
    if (data.schedule) requestBody.schedule = data.schedule;

    // Image URLs from Supabase
    if (logoUrl) requestBody.logo = logoUrl;
    if (bannerUrl) requestBody.banner = bannerUrl;

    const response = await api.patch<Shop>(`/shops/${id}`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
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
   * Crear suscripción para el usuario autenticado
   * POST /api/subscriptions
   * El backend asocia la suscripción al shop del usuario basándose en el token
   */
  create: async (data: CreateSubscriptionRequest): Promise<Subscription> => {
    // El backend no acepta shopId - usa el token para identificar al usuario/shop
    const requestBody: Record<string, any> = {
      plan: data.plan,
    };
    if (data.autoRenew !== undefined) {
      requestBody.autoRenew = data.autoRenew;
    }

    console.log('Creating subscription with data:', requestBody);
    const response = await api.post<Subscription>('/subscriptions', requestBody);
    return response.data;
  },

  /**
   * Reintentar pago de una suscripción fallida
   * POST /api/subscriptions/:id/retry-payment
   * NOTE: Este endpoint puede no estar implementado en el backend
   */
  retryPayment: async (id: string): Promise<{ message: string; subscription: Subscription }> => {
    try {
      const response = await api.post(`/subscriptions/${id}/retry-payment`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Esta función no está disponible. Contacta al soporte.');
      }
      throw error;
    }
  },

  /**
   * Obtener estado del pago de una suscripción
   * GET /api/subscriptions/:id/payment-status
   * NOTE: Este endpoint puede no estar implementado - usar getMySubscription en su lugar
   */
  getPaymentStatus: async (id: string): Promise<PaymentStatusResponse> => {
    try {
      const response = await api.get<PaymentStatusResponse>(`/subscriptions/${id}/payment-status`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Fallback: obtener la suscripción y devolver su estado
        const subscription = await subscriptionService.getMySubscription();
        if (subscription) {
          return {
            canRetryPayment: subscription.canRetryPayment,
            attemptsRemaining: subscription.attemptsRemaining,
            status: subscription.status,
            message: `Estado actual: ${subscription.status}`,
            subscription,
          };
        }
        throw new Error('No se encontró la suscripción');
      }
      throw error;
    }
  },

  /**
   * Obtener mi suscripción (del usuario autenticado)
   * GET /api/subscriptions/me
   */
  getMySubscription: async (): Promise<Subscription | null> => {
    try {
      const response = await api.get<Subscription>('/subscriptions/me');
      return response.data;
    } catch (error: any) {
      // Si no hay suscripción, retornar null en lugar de lanzar error
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Obtener suscripción de un shop (deprecated - usar getMySubscription)
   * @deprecated Use getMySubscription instead
   */
  getByShop: async (_shopId: string): Promise<Subscription | null> => {
    // El backend usa /subscriptions/me basado en el token del usuario
    return subscriptionService.getMySubscription();
  },

  /**
   * Cancelar suscripción
   * DELETE /api/subscriptions/:id o DELETE /api/subscriptions/me
   */
  cancel: async (subscriptionId: string): Promise<{ message: string }> => {
    try {
      // Intentar primero con el ID específico
      const response = await api.delete(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Fallback: intentar con /me
        try {
          const response = await api.delete('/subscriptions/me');
          return response.data;
        } catch (fallbackError: any) {
          if (fallbackError.response?.status === 404) {
            throw new Error('No se puede cancelar la suscripción. Contacta al soporte.');
          }
          throw fallbackError;
        }
      }
      throw error;
    }
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


// =============================================================================
// PROMOTIONAL BANNER SERVICES
// =============================================================================

export const promotionalBannerService = {
  /**
   * Actualizar banner promocional de una tienda (solo plan wholesaler)
   * PATCH /api/shops/:shopId/promotional-banner
   */
  update: async (
    shopId: string,
    data: {
      title: string;
      subtitle: string;
      imageUrl: string;
      isActive?: boolean;
    }
  ): Promise<{ message: string; shop: Shop }> => {
    const response = await api.patch(`/shops/${shopId}/promotional-banner`, data);
    return response.data;
  },

  /**
   * Eliminar banner promocional de una tienda
   * DELETE /api/shops/:shopId/promotional-banner (mediante PATCH con null)
   */
  remove: async (shopId: string): Promise<{ message: string; shop: Shop }> => {
    const response = await api.patch(`/shops/${shopId}/promotional-banner`, {
      title: '',
      subtitle: '',
      imageUrl: '',
      isActive: false,
    });
    return response.data;
  },
};

export default api;
