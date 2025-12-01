import { NextRequest } from "next/server";
import { menuData } from "@/lib/menuData";
import {
  successResponse,
  jsonResponse,
  handleApiError,
} from "@/server/utils/apiHelpers";

/**
 * GET /api/menu
 * Get all menu categories (using local data)
 */
export async function GET(request: NextRequest) {
  try {
    return jsonResponse(successResponse(menuData));
  } catch (error) {
    return handleApiError(error);
  }
}
