import { NextRequest } from "next/server";
import { orderDB } from "@/server/utils/jsonDatabase";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import { updateOrderStatusSchema } from "@/server/validators/orderSchemas";
import {
  successResponse,
  jsonResponse,
  handleApiError,
  parseRequestBody,
} from "@/server/utils/apiHelpers";
import { BadRequestError } from "@/server/utils/errors";
import { OrderStatus, type Order } from "@/types";

const STATUS_SEQUENCE: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

const STATUS_INDEX = new Map<OrderStatus, number>(
  STATUS_SEQUENCE.map((status, index) => [status, index]),
);

function mapOdooSaleStateToOrderStatus(state: string | null | undefined): OrderStatus | null {
  switch (state) {
    case "sale":
      return OrderStatus.CONFIRMED;
    case "done":
      return OrderStatus.DELIVERED;
    case "cancel":
      return OrderStatus.CANCELLED;
    default:
      return null;
  }
}

function shouldAdvanceStatus(current: OrderStatus, next: OrderStatus): boolean {
  if (next === OrderStatus.CANCELLED) {
    return current !== OrderStatus.CANCELLED;
  }
  if (current === OrderStatus.CANCELLED) {
    return false;
  }
  const currentRank = STATUS_INDEX.get(current) ?? -1;
  const nextRank = STATUS_INDEX.get(next);
  if (typeof nextRank !== "number") {
    return false;
  }
  return nextRank > currentRank;
}

/**
 * GET /api/orders/[id]
 * Get order by ID (JSON database storage)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id") || "demo-user";
    
    // Get user's orders and find the specific one (serverless-compatible)
    const userOrders = orderDB.getByUserId(userId);
    const order = userOrders.find((o) => o.id === id);

    if (!order) {
      return jsonResponse({ success: false, error: "Order not found" }, 404);
    }

    let latestOrder = order;

    if (
      isOdooConfigured() &&
      order.integrations?.odoo?.saleOrderId
    ) {
      try {
        const odoo = createOdooClient();
        if (odoo) {
          const saleState = await odoo.getSaleOrderState(
            order.integrations.odoo.saleOrderId,
          );
          const mappedStatus = mapOdooSaleStateToOrderStatus(saleState?.state);
          if (mappedStatus) {
            const shouldUpdateLocalStatus = shouldAdvanceStatus(
              order.status,
              mappedStatus,
            );
            const currentOdooMeta = order.integrations?.odoo;
            const shouldUpdateMeta =
              currentOdooMeta?.lastStatus !== mappedStatus ||
              !currentOdooMeta?.lastStatusSync;

            if (shouldUpdateLocalStatus || shouldUpdateMeta) {
              const now = new Date();
              const updates: Partial<Order> & {
                integrations?: Order["integrations"];
              } = {
                userId,
                updatedAt: now,
                integrations: {
                  ...order.integrations,
                  odoo: {
                    ...currentOdooMeta,
                    lastStatus: mappedStatus,
                    lastStatusSync: now.toISOString(),
                  },
                },
              };

              if (shouldUpdateLocalStatus) {
                updates.status = mappedStatus;
              }

              const updated = orderDB.update(order.id, updates) || order;
              const refreshedOrders = orderDB.getByUserId(userId);
              latestOrder =
                refreshedOrders.find((o) => o.id === order.id) || updated;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to refresh order status from Odoo:", err);
      }
    }

    return jsonResponse(successResponse(latestOrder));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id") || "demo-user";
    const raw = await parseRequestBody(request);
    const body = updateOrderStatusSchema.parse(raw);
    const note = body.note?.trim();

    const userOrders = orderDB.getByUserId(userId);
    const existing = userOrders.find((o) => o.id === id);

    if (!existing) {
      return jsonResponse({ success: false, error: "Order not found" }, 404);
    }

    if (!note && existing.status === body.status) {
      return jsonResponse(
        successResponse(existing, "Order status already up to date"),
      );
    }

    const now = new Date();
    const integrationsClone = existing.integrations
      ? {
          ...existing.integrations,
          odoo: existing.integrations.odoo
            ? { ...existing.integrations.odoo }
            : undefined,
        }
      : undefined;

    if (
      isOdooConfigured() &&
      integrationsClone?.odoo &&
      (integrationsClone.odoo.saleOrderId || integrationsClone.odoo.posOrderId)
    ) {
      try {
        const odoo = createOdooClient();
        if (odoo) {
          if (integrationsClone.odoo.saleOrderId) {
            await odoo.syncSaleOrderStatus(
              integrationsClone.odoo.saleOrderId,
              body.status,
              note ? { note } : undefined,
            );
          }
          if (integrationsClone.odoo.posOrderId) {
            await odoo.syncPosOrderStatus(
              integrationsClone.odoo.posOrderId,
              body.status,
              note ? { note } : undefined,
            );
          }
          integrationsClone.odoo.lastStatus = body.status;
          integrationsClone.odoo.lastStatusSync = now.toISOString();
        }
      } catch (err) {
        console.warn("Odoo status sync failed:", err);
      }
    }

    const updates: Partial<Order> = {
      status: body.status,
      updatedAt: now,
      userId,
      ...(note
        ? {
            notes: existing.notes
              ? `${existing.notes}\n[${now.toISOString()}] ${note}`
              : `[${now.toISOString()}] ${note}`,
          }
        : {}),
      ...(integrationsClone ? { integrations: integrationsClone } : {}),
    };

    const updated = orderDB.update(existing.id, updates) || existing;
    const refreshedOrders = orderDB.getByUserId(userId);
    const finalOrder =
      refreshedOrders.find((o) => o.id === existing.id) || updated;

    return jsonResponse(
      successResponse(finalOrder, "Order status updated successfully"),
    );
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return handleApiError(new BadRequestError("Invalid request body"));
    }
    return handleApiError(error);
  }
}
