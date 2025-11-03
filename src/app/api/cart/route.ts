import { NextRequest } from 'next/server';
import { menuData } from '@/lib/menuData';
import { cartDB } from '@/server/utils/jsonDatabase';
import { 
  successResponse, 
  jsonResponse, 
  handleApiError,
  parseRequestBody 
} from '@/server/utils/apiHelpers';
import type { CartItem } from '@/types';

/**
 * GET /api/cart
 * Get user's cart (JSON database storage)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    const items = cartDB.get(userId);
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const tax = subtotal * 0.14;
    
    return jsonResponse(successResponse({ 
      cart: { items },
      totals: {
        subtotal,
        tax,
        total: subtotal + tax,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      }
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/cart
 * Add item to cart (JSON database storage)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const body = await parseRequestBody<{
      menuItemId: string;
      quantity: number;
      size?: string;
      flavor?: string;
      toppings?: string[];
    }>(request);

    const { menuItemId, quantity, size, flavor, toppings } = body;

    // Find menu item
    let menuItem = null;
    for (const category of menuData) {
      for (const subCategory of category.subCategories) {
        const item = subCategory.items.find(item => item.id === menuItemId);
        if (item) {
          menuItem = item;
          break;
        }
      }
      if (menuItem) break;
    }

    if (!menuItem) {
      return jsonResponse(
        { success: false, error: 'Menu item not found' },
        404
      );
    }

    // Calculate price
    let price = menuItem.price;
    
    if (size) {
      const sizeOption = menuItem.sizes.find(s => s.name === size);
      if (sizeOption) price += sizeOption.priceModifier;
    }
    
    if (flavor) {
      const flavorOption = menuItem.flavors.find(f => f.name === flavor);
      if (flavorOption) price += flavorOption.price;
    }
    
    if (toppings) {
      for (const toppingName of toppings) {
        const topping = menuItem.toppings.find(t => t.name === toppingName);
        if (topping) price += topping.price;
      }
    }

    const cartItem: CartItem = {
      id: `cart-item-${Date.now()}`,
      menuItemId,
      quantity,
      size,
      flavor,
      toppings: toppings || [],
      price: price * quantity,
      menuItem,
    };

    cartDB.addItem(userId, cartItem);

    return jsonResponse(successResponse(cartItem, 'Item added to cart'), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/cart
 * Clear cart (JSON database storage)
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    
    cartDB.clear(userId);

    return jsonResponse(successResponse(null, 'Cart cleared'));
  } catch (error) {
    return handleApiError(error);
  }
}
