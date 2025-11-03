import { NextRequest } from 'next/server';
import { cartDB } from '@/server/utils/jsonDatabase';
import { 
  successResponse, 
  jsonResponse, 
  handleApiError,
  parseRequestBody 
} from '@/server/utils/apiHelpers';

/**
 * DELETE /api/cart/[itemId]
 * Remove specific item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const { itemId } = await params;
    
    cartDB.removeItem(userId, itemId);

    return jsonResponse(successResponse(null, 'Item removed from cart'));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/cart/[itemId]
 * Update cart item quantity
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id') || 'demo-user';
    const { itemId } = await params;
    const body = await parseRequestBody<{ quantity: number }>(request);

    const { quantity } = body;

    if (quantity < 1) {
      return jsonResponse(
        { success: false, error: 'Quantity must be at least 1' },
        400
      );
    }

    cartDB.updateQuantity(userId, itemId, quantity);

    return jsonResponse(successResponse(null, 'Cart item updated'));
  } catch (error) {
    return handleApiError(error);
  }
}
