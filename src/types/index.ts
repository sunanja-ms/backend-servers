import { FastifyRequest } from 'fastify';

export type UserRole = 'admin' | 'user' | 'moderator';

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthRequest extends FastifyRequest {
  user: JWTPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  isActive?: 'true' | 'false';
  includeDeleted?: boolean;
  categoryId?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ToggleStatusRequest {
  isActive: boolean;
}

export interface ApiKeyInfo {
  id: number;
  name: string;
  prefix: string;
  expiresAt: Date;
  lastUsedAt: Date | null;
  createdAt: Date;
}
