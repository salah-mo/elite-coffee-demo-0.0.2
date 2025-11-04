import { z } from 'zod';
import { PaymentMethod } from '@/types';

export const createOrderSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  addressId: z.string().min(1).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
