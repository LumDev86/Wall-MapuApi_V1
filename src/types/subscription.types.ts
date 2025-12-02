export type SubscriptionPlan = 'retailer' | 'wholesaler';

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'failed';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  amount: number;
  autoRenew: boolean;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  shopId: string;
  initPoint?: string; // URL de pago de Mercado Pago
  failedPaymentAttempts: number;
  canRetryPayment: boolean;
  attemptsRemaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequest {
  plan: SubscriptionPlan;
  shopId: string;
  autoRenew?: boolean;
}

export interface PaymentStatusResponse {
  subscription: Subscription;
  status: SubscriptionStatus;
  canRetryPayment: boolean;
  attemptsRemaining: number;
  message: string;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  pending: number;
  failed: number;
  expired: number;
  cancelled: number;
}
