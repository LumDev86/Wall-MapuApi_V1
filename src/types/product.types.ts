export interface Product {
  id: string;
  name: string;
  description: string;
  priceRetail: string;
  priceWholesale: string;
  stock: number;
  sku: string;
  barcode: string;
  brand: string;
  images: string[];
  isActive: boolean;
  shopId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  shop: Shop;
  category: Category;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  subcategories?: Category[];
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  address: string;
  province: string;
  city: string;
  latitude: string;
  longitude: string;
  type: 'retailer' | 'wholesaler';
  status: string;
  phone: string;
  email: string;
  website: string;
  schedule: Schedule;
  logo: string;
  banner: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: Owner;
  isOpenNow?: boolean;
  distance?: number; // Distance in km (returned by search API)
  rating?: number; // Shop rating (returned by search API)
  reviewCount?: number; // Number of reviews (returned by search API)
}

export interface Schedule {
  [key: string]: {
    open: string;
    close: string;
  };
}

export interface Owner {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  isEmailVerified: boolean;
  passwordResetExpires: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  data: Product[];
  pagination: Pagination;
}

export interface CategoriesResponse {
  total: number;
  categories: Category[];
}

export interface ShopsResponse {
  data: Shop[];
  pagination: Pagination;
  filters: {
    byRole: string | null;
    showingType: string;
  };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
