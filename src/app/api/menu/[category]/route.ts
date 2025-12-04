import { NextRequest } from "next/server";
import { getCategoryById } from "@/server/services/menuService";
import {
  successResponse,
  jsonResponse,
  handleApiError,
  errorResponse,
} from "@/server/utils/apiHelpers";
import { isOdooConfigured } from "@/server/utils/odooClient";

/**
 * GET /api/menu/[category]
 * Get a specific category by slug (using local data)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> },
) {
  try {
    const { category: categoryId } = await params;
    if (!isOdooConfigured()) {
      return jsonResponse(
        errorResponse("Odoo is not configured"),
        503,
      );
    }

    const category = await getCategoryById(categoryId);

    if (!category) {
      return jsonResponse(
        {
          success: false,
          error: "Category not found",
        },
        404,
      );
    }

    return jsonResponse(successResponse(category));
  } catch (error) {
    return handleApiError(error);
  }
}
