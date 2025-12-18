export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  shopId: string;
  shopName: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  paymentUrl: string | null;
  preferenceId: string | null;
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutResponse {
  message: string;
  order: Order;
}
