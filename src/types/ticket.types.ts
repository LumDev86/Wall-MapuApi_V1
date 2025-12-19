import { User } from './auth.types';

export type TicketCategory = 'billing' | 'technical' | 'account' | 'general' | 'feature_request';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  user?: User;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isAdminReply: boolean;
  createdAt: string;
  sender?: User;
}

export interface CreateTicketRequest {
  subject: string;
  message: string;
  category: TicketCategory;
  priority?: TicketPriority;
}

export interface ReplyToTicketRequest {
  message: string;
}

export interface TicketsResponse {
  data: Ticket[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
