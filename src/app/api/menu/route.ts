import { NextRequest } from "next/server";
import { getMenuCategories } from "@/server/services/menuService";
import {
  successResponse,
  jsonResponse,
  handleApiError,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { isOdooConfigured } from "@/server/utils/odooClient";

/**
 * GET /api/menu
 * Get all menu categories (using local data)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isOdooConfigured()) {
      return jsonResponse(
        errorResponse("Odoo is not configured"),
        503,
      );
    }

    const categories = await getMenuCategories();
    return jsonResponse(successResponse(categories));
  } catch (error) {
    return handleApiError(error);
  }
}
