import { NextRequest } from "next/server";
import { createOdooClient, isOdooConfigured } from "@/server/utils/odooClient";
import {
  jsonResponse,
  successResponse,
  errorResponse,
} from "@/server/utils/apiHelpers";

// GET /api/odoo/pos
// Diagnostics for POS: configuration list, open sessions, and ping
export async function GET(_request: NextRequest) {
  try {
    const configured = isOdooConfigured();
    if (!configured) {
      return jsonResponse(
        successResponse({ configured, hasPos: false }, "Odoo not configured"),
      );
    }

    const client = createOdooClient();
    if (!client)
      return jsonResponse(errorResponse("Failed to init Odoo client"), 500);

    const ping = await client.ping().catch(() => null);
    const hasPos = await client.modelExists("pos.order").catch(() => false);

    if (!hasPos) {
      return jsonResponse(
        successResponse(
          { configured, hasPos, configs: [], ping },
          "POS module not available",
        ),
      );
    }

    const configs = await client.getPosConfigs();
    const withSession = await Promise.all(
      configs.map(async (c) => ({
        ...c,
        openSessionId: await client.getOpenPosSession(c.id),
      })),
    );

    return jsonResponse(
      successResponse(
        { configured, hasPos, ping, configs: withSession },
        `Found ${withSession.length} POS configs`,
      ),
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch POS diagnostics";
    return jsonResponse(errorResponse(message), 500);
  }
}
