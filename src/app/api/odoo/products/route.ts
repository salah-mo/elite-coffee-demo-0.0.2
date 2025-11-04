import { NextRequest } from 'next/server';
import { createOdooClient, isOdooConfigured } from '@/server/utils/odooClient';
import { jsonResponse, successResponse, errorResponse } from '@/server/utils/apiHelpers';

// GET /api/odoo/products?limit=20&random=true
export async function GET(request: NextRequest) {
  try {
    if (!isOdooConfigured()) {
      return jsonResponse(errorResponse('Odoo is not configured'), 500);
    }

    const url = new URL(request.url);
  // Query params
  const limitParam = url.searchParams.get('limit') ?? url.searchParams.get('sample') ?? undefined;
  const parsedLimit = limitParam ? Number(limitParam) : undefined;
  const limit = Number.isFinite(parsedLimit as number) && (parsedLimit as number)! > 0 ? (parsedLimit as number) : undefined;
    const random = (url.searchParams.get('random') ?? 'false').toLowerCase() === 'true';
    const includeInactive = (url.searchParams.get('includeInactive') ?? 'false').toLowerCase() === 'true';
    const fieldsParam = url.searchParams.get('fields'); // e.g. id,name,default_code,list_price OR 'all'
    const fields = fieldsParam && fieldsParam.toLowerCase() !== 'all'
      ? fieldsParam.split(',').map(s => s.trim()).filter(Boolean)
      : undefined; // undefined => fetch all readable fields

    const client = createOdooClient();
    if (!client) return jsonResponse(errorResponse('Failed to init Odoo client'), 500);

    // Ensure product model exists
    const hasProduct = await client.modelExists('product.product').catch(() => false);
    if (!hasProduct) {
      return jsonResponse(errorResponse("Odoo 'product.product' model isn't available. Install Inventory/Sales modules."), 400);
    }

    // Build domain
    const domain: any[] = [['sale_ok', '=', true]];
    if (!includeInactive) domain.push(['active', '=', true]);

    // If random, require a limit to sample deterministically
    let products: any[] = [];
    if (random) {
      if (!limit) {
        return jsonResponse(errorResponse('When random=true, you must provide a limit or sample parameter.'), 400);
      }
      const total = await client.searchCount('product.product', domain);
      if (total === 0) return jsonResponse(successResponse<any[]>([], 'No saleable products found'));
      const safeLimit = Math.max(1, Math.min(limit, total));
      const offset = total > safeLimit ? Math.floor(Math.random() * (total - safeLimit)) : 0;
      products = await client.searchRead<any>('product.product', domain, fields ?? ['id', 'name', 'default_code', 'list_price', 'type', 'active'], { limit: safeLimit, offset });
    } else {
      const kwargs = limit ? { limit, offset: 0 } : {};
      products = await client.searchRead<any>('product.product', domain, fields ?? ['id', 'name', 'default_code', 'list_price', 'type', 'active'], kwargs as any);
    }

    return jsonResponse(successResponse(products, `Fetched ${products.length} products`));
  } catch (err: any) {
    return jsonResponse(errorResponse(err?.message || 'Failed to fetch products'), 500);
  }
}
