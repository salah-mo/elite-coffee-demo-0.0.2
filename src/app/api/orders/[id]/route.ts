import { NextRequest } from "next/server";
import { orderDB } from "@/server/utils/jsonDatabase";
import {
  successResponse,
  jsonResponse,
  handleApiError,
} from "@/server/utils/apiHelpers";

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

    return jsonResponse(successResponse(order));
  } catch (error) {
    return handleApiError(error);
  }
}
