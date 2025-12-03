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
  type MenuItem,
} from "@/types";
import { createOrderSchema } from "@/server/validators/orderSchemas";
import { BadRequestError } from "@/server/utils/errors";

const INTERNET_CARD_UNIT_SIZE_GB = 1.5;
const INTERNET_CARD_UNIT_PRICE = 10;
const INTERNET_CARD_MENU_ID = "internet-card-1_5gb";
const INTERNET_CARD_MENU_ITEM: MenuItem = {
  id: INTERNET_CARD_MENU_ID,
  name: "Internet Card (1.5 GB)",
  description: "Add 1.5 GB of internet connectivity to your order.",
  price: INTERNET_CARD_UNIT_PRICE,
  category: "add-ons",
  subCategory: "connectivity",
  images: [],
  featured: false,
  available: true,
  allergens: [],
  sizes: [],
  flavors: [],
  toppings: [],
};

function describeOdooError(error: unknown, context: string): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (!raw) return `${context}: unexpected error`;

  if (raw.includes("pos.order.create_from_ui")) {
    return `${context}: the connected Odoo instance does not expose the create_from_ui POS API. Ensure the POS module is installed or disable POS sync.`;
  }
  if (raw.includes("No open POS session")) {
    return `${context}: no open POS session was found. Start a POS session in Odoo before sending kitchen tickets.`;
  }
  if (raw.includes("No POS configuration")) {
    return `${context}: no POS configuration is available in Odoo. Configure a POS or disable POS sync.`;
  }
  if (raw.includes("does not match format") && raw.includes("time data")) {
    return `${context}: Odoo rejected the order timestamp. Check the server timezone configuration.`;
  }

  const concise = raw.split("\n")[0]?.split("::")[0]?.trim() || raw.trim();
  return `${context}: ${concise}`;
}

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
    const internetCardQty = body.internetCard?.quantity ?? 0;
    const internetCardTotal = internetCardQty * INTERNET_CARD_UNIT_PRICE;

    if (!cartItems || cartItems.length === 0) {
      if (internetCardQty > 0) {
        throw new BadRequestError(
          "Internet cards must be ordered with at least one drink",
        );
      }
      throw new BadRequestError("Cart is empty");
    }

    // Calculate totals
    const drinksSubtotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const itemsSubtotal = drinksSubtotal + internetCardTotal;
    const deliveryFee = body.orderType === "DELIVERY" ? 15 : 0;
    const total = itemsSubtotal + deliveryFee;

    const orderItems = cartItems.map((item) => ({
      id: `order-item-${Date.now()}-${Math.random()}`,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      size: item.size,
      flavor: item.flavor,
      toppings: item.toppings || [],
      unitPrice: item.price / item.quantity,
      totalPrice: item.price,
      menuItem: item.menuItem,
    }));

    if (internetCardQty > 0) {
      orderItems.push({
        id: `order-item-${Date.now()}-internet-card`,
        menuItemId: INTERNET_CARD_MENU_ID,
        quantity: internetCardQty,
        size: undefined,
        flavor: undefined,
        toppings: [],
        unitPrice: INTERNET_CARD_UNIT_PRICE,
        totalPrice: internetCardTotal,
        menuItem: INTERNET_CARD_MENU_ITEM,
      });
    }

    // Create order locally first
    const order = orderDB.create({
      id: `order-${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      userId,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: body.paymentMethod,
      orderType: body.orderType,
      subtotal: itemsSubtotal,
      deliveryFee,
      discount: 0,
      total,
      notes: body.notes,
      internetCard:
        internetCardQty > 0
          ? {
              quantity: internetCardQty,
              unitSizeGb: INTERNET_CARD_UNIT_SIZE_GB,
              unitPrice: INTERNET_CARD_UNIT_PRICE,
              totalPrice: internetCardTotal,
            }
          : undefined,
      integrations: {},
      items: orderItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Attempt to sync to Odoo (best-effort). If Odoo not configured, skip.
    let saleId: number | undefined;
    let posOrderId: number | undefined;
    let saleSyncStatus: "SUCCESS" | "FAILED" | undefined;
    let posSyncStatus: "SUCCESS" | "FAILED" | undefined;
    const odooWarnings: string[] = [];

    let integrationMeta: NonNullable<Order["integrations"]>["odoo"] | undefined;
    let nextStatus: OrderStatus | undefined;
    let nextNotes: string | undefined;
    let saleAutoConfirmed = false;

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

          if (enableSale) {
            try {
              saleId = await odoo.createSaleOrderFromWebsiteOrder(order, partner);
              saleSyncStatus = "SUCCESS";
              if (body.odoo?.sale?.autoConfirm) {
                try {
                  await odoo.confirmSaleOrder(saleId);
                  saleAutoConfirmed = true;
                } catch (confirmErr) {
                  const warning = describeOdooError(
                    confirmErr,
                    "Odoo sale auto-confirm",
                  );
                  odooWarnings.push(warning);
                  console.warn("Odoo sale auto-confirm warning:", confirmErr);
                }
              }
            } catch (saleErr) {
              saleSyncStatus = "FAILED";
              const warning = describeOdooError(saleErr, "Odoo sales sync");
              odooWarnings.push(warning);
              console.warn("Odoo sale sync failed:", saleErr);
            }
          }

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
              posSyncStatus = "SUCCESS";
            } catch (posErr) {
              posSyncStatus = "FAILED";
              const warning = describeOdooError(posErr, "Odoo POS sync");
              odooWarnings.push(warning);
              console.warn("Odoo POS sync failed:", posErr);
            }
          }

          const host = (process.env.ODOO_HOST || "").replace(/\/$/, "");
          const url =
            saleId && host
              ? `${host}/web#model=sale.order&id=${saleId}&view_type=form`
              : undefined;

          const statusTimestamp = new Date().toISOString();
          const saleSucceeded = Boolean(saleId);

          integrationMeta = {
            saleOrderId: saleId,
            posOrderId,
            url,
            saleSyncStatus,
            posSyncStatus,
            warnings: odooWarnings.length ? odooWarnings : undefined,
          } satisfies NonNullable<Order["integrations"]>["odoo"];

          if (saleAutoConfirmed) {
            integrationMeta.lastStatus = OrderStatus.CONFIRMED;
            integrationMeta.lastStatusSync = statusTimestamp;
          }

          nextStatus = saleAutoConfirmed ? OrderStatus.CONFIRMED : undefined;
          nextNotes = saleSucceeded
            ? `${order.notes ? `${order.notes} | ` : ""}Odoo saleId: ${saleId}`
            : order.notes;
        }
      } catch (e) {
        // Log succinctly but don't block client order creation
        const friendly = describeOdooError(e, "Odoo sync");
        odooWarnings.push(friendly);
        console.warn("Odoo sync skipped or failed:", e);
      }
    }

    if (
      integrationMeta ||
      saleId ||
      posOrderId ||
      saleSyncStatus ||
      posSyncStatus ||
      odooWarnings.length
    ) {
      const fallbackIntegration: NonNullable<Order["integrations"]>["odoo"] = {
        ...(saleId ? { saleOrderId: saleId } : {}),
        ...(posOrderId ? { posOrderId } : {}),
        ...(saleSyncStatus ? { saleSyncStatus } : {}),
        ...(posSyncStatus ? { posSyncStatus } : {}),
        ...(odooWarnings.length ? { warnings: odooWarnings } : {}),
      };

      const updates: Partial<Order> & { integrations?: Order["integrations"] } = {
        integrations: {
          ...order.integrations,
          odoo: {
            ...(order.integrations?.odoo || {}),
            ...(integrationMeta || fallbackIntegration),
          },
        },
        userId,
      };

      if (typeof nextNotes !== "undefined") {
        updates.notes = nextNotes;
      }
      if (nextStatus) {
        updates.status = nextStatus;
      }

      orderDB.update(order.id, updates);
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
