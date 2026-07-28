import { z } from 'zod';

export const createOrderSchema = z.object({
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  phone: z.string().min(1, 'Phone is required'),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['unpaid', 'paid', 'verified']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
