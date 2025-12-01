import { NextRequest } from "next/server";
import { cartDB, orderDB } from "@/server/utils/jsonDatabase";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import {
  successResponse,
  jsonResponse,
  handleApiError,
  parseRequestBody,
  getQueryParams,
} from "@/server/utils/apiHelpers";
import {
  PaymentMethod,
  OrderStatus,
  PaymentStatus,
  OrderType,
  type Order,
} from "@/types";
import { createOrderSchema } from "@/server/validators/orderSchemas";
import { BadRequestError } from "@/server/utils/errors";

/**
 * GET /api/orders
 * Get user's orders (JSON database storage)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id") || "demo-user";
    const { limit = "20", offset = "0" } = getQueryParams(request);

    const allOrders = orderDB.getByUserId(userId);
    const total = allOrders.length;
    const orders = allOrders.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit),
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
    const userId = request.headers.get("x-user-id") || "demo-user";
    const raw = await parseRequestBody(request);
    const body = createOrderSchema.parse(raw);

    const cartItems = cartDB.get(userId);

    if (!cartItems || cartItems.length === 0) {
      throw new BadRequestError("Cart is empty");
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const deliveryFee = body.orderType === "DELIVERY" ? 15 : 0;
    const total = subtotal + deliveryFee;

    // Create order locally first
    const order = orderDB.create({
      id: `order-${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      userId,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: body.paymentMethod,
      orderType: body.orderType,
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      notes: body.notes,
      integrations: {},
      items: cartItems.map((item) => ({
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

    // Attempt to sync to Odoo (best-effort). If Odoo not configured, skip.
    if (isOdooConfigured()) {
      try {
        const odoo = createOdooClient();
        if (odoo) {
          const enableSale = body.odoo?.sale?.enable !== false; // default true
          const enablePos = body.odoo?.pos?.enable === true; // default false

          const partner = {
            name: body.odoo?.partner?.name || "Website Customer",
            email: body.odoo?.partner?.email,
            phone: body.odoo?.partner?.phone,
            street: body.odoo?.partner?.street,
            city: body.odoo?.partner?.city,
            zip: body.odoo?.partner?.zip,
          };

          let saleId: number | undefined;
          if (enableSale) {
            saleId = await odoo.createSaleOrderFromWebsiteOrder(order, partner);
            if (body.odoo?.sale?.autoConfirm) {
              try {
                await odoo.confirmSaleOrder(saleId);
              } catch {
                /* non-fatal */
              }
            }
          }

          let posOrderId: number | undefined;
          if (enablePos) {
            try {
              posOrderId = await odoo.createPosOrderFromWebsiteOrder(
                order,
                partner,
                {
                  posConfigId: body.odoo?.pos?.posConfigId,
                  posConfigName: body.odoo?.pos?.posConfigName,
                  customerNotePerLine: body.odoo?.pos?.customerNotePerLine,
                },
              );
            } catch (posErr) {
              console.warn("POS sync failed:", posErr);
            }
          }

          const host = (process.env.ODOO_HOST || "").replace(/\/$/, "");
          const url =
            saleId && host
              ? `${host}/web#model=sale.order&id=${saleId}&view_type=form`
              : undefined;

          const updates: Partial<Order> & {
            integrations?: Order["integrations"];
          } = {
            status: enableSale ? OrderStatus.CONFIRMED : order.status,
            notes:
              `${order.notes ? order.notes + " | " : ""}${saleId ? `Odoo saleId: ${saleId}` : ""}`.trim() ||
              order.notes,
            integrations: {
              ...order.integrations,
              odoo: {
                saleOrderId: saleId,
                posOrderId,
                url,
              },
            },
            userId, // Include userId for serverless compatibility
          };
          orderDB.update(order.id, updates);
        }
      } catch (e) {
        // Log succinctly but don't block client order creation
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("Odoo sync skipped or failed:", msg);
      }
    }

    // Clear cart after order
    cartDB.clear(userId);

    // Return the latest order state
    // In serverless, getById won't work, so find from user's orders
    const userOrders = orderDB.getByUserId(userId);
    const updated = userOrders.find((o) => o.id === order.id) || order;
    return jsonResponse(
      successResponse(updated, "Order created successfully"),
      201,
    );
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return handleApiError(new BadRequestError("Invalid request body"));
    }
    return handleApiError(error);
  }
}
