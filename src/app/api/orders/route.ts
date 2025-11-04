import { NextRequest } from 'next/server';
import { cartDB, orderDB } from '@/server/utils/jsonDatabase';
import { createOdooClient, isOdooConfigured } from '@/server/utils/odooClient';
import {
  successResponse,
  jsonResponse,
  handleApiError,
  parseRequestBody,
  getQueryParams
} from '@/server/utils/apiHelpers';
import { PaymentMethod, OrderStatus, PaymentStatus } from '@/types';
import { createOrderSchema } from '@/server/validators/orderSchemas';
import { BadRequestError } from '@/server/utils/errors';

/**
 * GET /api/orders
 * Get user's orders (JSON database storage)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const { limit = '20', offset = '0' } = getQueryParams(request);

    const allOrders = orderDB.getByUserId(userId);
    const total = allOrders.length;
    const orders = allOrders.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    return jsonResponse(successResponse({ orders, total }));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/orders
 * Create a new order (JSON database storage)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const raw = await parseRequestBody(request);
    const body = createOrderSchema.parse(raw);

    const cartItems = cartDB.get(userId);

    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestError('Cart is empty');
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const tax = subtotal * 0.14;
    const deliveryFee = body.addressId ? 30 : 0;
    const total = subtotal + tax + deliveryFee;

    // Create order locally first
    const order = orderDB.create({
      id: `order-${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      userId,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: body.paymentMethod,
      subtotal,
      tax,
      deliveryFee,
      discount: 0,
      total,
      notes: body.notes,
      items: cartItems.map(item => ({
        id: `order-item-${Date.now()}-${Math.random()}`,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        size: item.size,
        flavor: item.flavor,
        toppings: item.toppings || [],
        unitPrice: item.price / item.quantity,
        totalPrice: item.price,
        menuItem: item.menuItem,
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Attempt to sync to Odoo in-line (best-effort). If Odoo not configured, skip.
    if (isOdooConfigured()) {
      try {
        const odoo = createOdooClient();
        if (odoo) {
          const saleId = await odoo.createSaleOrderFromWebsiteOrder(order, {
            name: 'Website Customer',
          });
          // Optionally: update local order status to CONFIRMED when Odoo order is created
          orderDB.update(order.id, {
            status: OrderStatus.CONFIRMED,
            notes: `${order.notes ? order.notes + ' | ' : ''}Odoo saleId: ${saleId}`,
          });
        }
      } catch (e) {
        // Log but don't block client order creation
        console.error('Failed to sync order to Odoo:', e);
      }
    }

    // Clear cart after order
    cartDB.clear(userId);

    return jsonResponse(successResponse(order, 'Order created successfully'), 201);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      return handleApiError(new BadRequestError('Invalid request body'));
    }
    return handleApiError(error);
  }
}
