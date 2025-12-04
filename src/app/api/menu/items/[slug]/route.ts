import { NextRequest } from "next/server";
import { getItemById } from "@/server/services/menuService";
import {
  successResponse,
  jsonResponse,
  handleApiError,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { isOdooConfigured } from "@/server/utils/odooClient";

/**
 * GET /api/menu/items/[slug]
 * Get a specific menu item by slug (using local data)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!isOdooConfigured()) {
      return jsonResponse(
        errorResponse("Odoo is not configured"),
        503,
      );
    }

    const menuItem = await getItemById(slug);

    if (!menuItem) {
      return jsonResponse(
        { success: false, error: "Menu item not found" },
        404,
      );
    }

    return jsonResponse(successResponse(menuItem));
  } catch (error) {
    return handleApiError(error);
  }
}
