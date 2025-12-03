import { z } from "zod";
import { PaymentMethod, OrderType, OrderStatus } from "@/types";

export const createOrderSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  orderType: z.nativeEnum(OrderType),
  addressId: z.string().min(1).optional(),
  notes: z.string().max(500).optional(),
  internetCard: z
    .object({
      quantity: z.number().int().min(0).default(0),
    })
    .optional(),
  odoo: z
    .object({
      partner: z
        .object({
          name: z.string().min(1).optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          street: z.string().optional(),
          city: z.string().optional(),
          zip: z.string().optional(),
        })
        .optional(),
      sale: z
        .object({
          enable: z.boolean().optional(),
          autoConfirm: z.boolean().optional(),
        })
        .optional(),
      pos: z
        .object({
          enable: z.boolean().optional(),
          posConfigId: z.number().optional(),
          posConfigName: z.string().optional(),
          customerNotePerLine: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
