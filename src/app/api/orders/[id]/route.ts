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
    const order = orderDB.getById(id);

    if (!order) {
      return jsonResponse({ success: false, error: "Order not found" }, 404);
    }

    // Verify order belongs to user
    if (order.userId !== userId) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 403);
    }

    return jsonResponse(successResponse(order));
  } catch (error) {
    return handleApiError(error);
  }
}
