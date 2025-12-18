export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  priceAtAddition: number;
  subtotal: number;
  stock: number;
  shopId: string;
  shopName: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartDto {
  productId: string;
  quantity?: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface CartActionResponse {
  message: string;
  cart: Cart;
}
