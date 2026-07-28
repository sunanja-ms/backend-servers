import { z } from 'zod';
import type { PaginationParams } from '../types/index.js';

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  includeDeleted: z.coerce.boolean().default(false),
  categoryId: z.coerce.number().int().positive().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const result = paginationSchema.safeParse(query);
  if (!result.success) {
    return { page: 1, limit: 10, sortOrder: 'desc' };
  }
  return result.data;
}
