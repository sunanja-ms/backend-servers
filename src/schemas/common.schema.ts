import { z } from 'zod';

export const toggleStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive is required' }),
});

export type ToggleStatusInput = z.infer<typeof toggleStatusSchema>;
