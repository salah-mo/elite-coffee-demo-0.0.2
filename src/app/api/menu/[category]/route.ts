import { NextRequest } from "next/server";
import { menuData } from "@/lib/menuData";
import {
  successResponse,
  jsonResponse,
  handleApiError,
} from "@/server/utils/apiHelpers";

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
    const category = menuData.find((cat) => cat.id === categoryId);

    if (!category) {
      return jsonResponse({ success: false, error: "Category not found" }, 404);
    }

    return jsonResponse(successResponse(category));
  } catch (error) {
    return handleApiError(error);
  }
}
