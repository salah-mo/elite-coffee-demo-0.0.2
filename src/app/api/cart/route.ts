import { NextRequest } from "next/server";
import { cartStore } from "@/server/services/cartStore";
import {
  successResponse,
  jsonResponse,
  handleApiError,
  parseRequestBody,
  getUserId,
} from "@/server/utils/apiHelpers";
import { addToCartSchema } from "@/server/validators/cartSchemas";
import { BadRequestError, NotFoundError } from "@/server/utils/errors";
import { CART_CONFIG, SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/lib/constants";
import type { CartItem } from "@/types";
import { getItemById } from "@/server/services/menuService";

/**
 * Calculates cart totals including subtotal, tax, and delivery fee
 *
 * @param items - Array of cart items
 * @returns Object containing calculated totals and item count
 */
function calculateTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * CART_CONFIG.TAX_RATE;
  const deliveryFee = 0; // Delivery fee determined at checkout based on address
  const total = subtotal + tax + deliveryFee;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    deliveryFee,
    total: Number(total.toFixed(2)),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/**
 * GET /api/cart
 * Retrieves the current user's cart with calculated totals
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);

    const items = cartStore.get(userId);
    const totals = calculateTotals(items);

    return jsonResponse(
      successResponse({
        cart: { items },
        totals,
      }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/cart
 * Adds an item to the user's cart with proper price calculation
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const raw = await parseRequestBody(request);
    const body = addToCartSchema.parse(raw);
    const { menuItemId, quantity, size, flavor, toppings } = body;

    // Validate quantity limits
    if (quantity > CART_CONFIG.MAX_QUANTITY) {
      throw new BadRequestError(
        `Maximum quantity is ${CART_CONFIG.MAX_QUANTITY}`,
      );
    }

    // Find menu item
    const menuItem = await getItemById(menuItemId);
    if (!menuItem) throw new NotFoundError(ERROR_MESSAGES.MENU_ITEM_NOT_FOUND);

    // Calculate price
    let price = menuItem.price;

    if (size) {
      const sizeOption = menuItem.sizes.find((s) => s.name === size);
      if (sizeOption) price += sizeOption.priceModifier;
    }

    if (flavor) {
      const flavorOption = menuItem.flavors.find((f) => f.name === flavor);
      if (flavorOption) price += flavorOption.price;
    }

    if (toppings) {
      for (const toppingName of toppings) {
        const topping = menuItem.toppings.find((t) => t.name === toppingName);
        if (topping) price += topping.price;
      }
    }

    const cartItem: CartItem = {
      id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      menuItemId,
      quantity,
      size,
      flavor,
      toppings: toppings || [],
      price: Number((price * quantity).toFixed(2)),
      menuItem,
    };

    cartStore.addItem(userId, cartItem);

    return jsonResponse(
      successResponse(cartItem, SUCCESS_MESSAGES.ITEM_ADDED),
      201,
    );
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      // zod error
      return handleApiError(new BadRequestError("Invalid request body"));
    }
    return handleApiError(error);
  }
}

/**
 * DELETE /api/cart
 * Clears all items from the user's cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request);

    cartStore.clear(userId);

    return jsonResponse(successResponse(null, SUCCESS_MESSAGES.CART_CLEARED));
  } catch (error) {
    return handleApiError(error);
  }
}
