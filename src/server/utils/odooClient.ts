import axios, { AxiosInstance } from 'axios';
import https from 'node:https';
import type { Order, OrderItem } from '@/types';

export interface OdooConfig {
  host: string; // e.g. https://odoo.example.com:8069
  db: string;
  username: string;
  password: string;
  timeoutMs?: number;
  insecureSSL?: boolean; // if true, do not reject unauthorized SSL certs (not recommended for production)
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: 'call';
  params: Record<string, unknown>;
  id?: number | string;
}

interface JsonRpcResponse<T = any> {
  jsonrpc: '2.0';
  id?: number | string | null;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

export function isOdooConfigured(): boolean {
  return Boolean(
    process.env.ODOO_HOST &&
    process.env.ODOO_DB &&
    process.env.ODOO_USERNAME &&
    process.env.ODOO_PASSWORD
  );
}

export function getOdooConfigFromEnv(): OdooConfig | null {
  if (!isOdooConfigured()) return null;
  return {
    host: String(process.env.ODOO_HOST),
    db: String(process.env.ODOO_DB),
    username: String(process.env.ODOO_USERNAME),
    password: String(process.env.ODOO_API_KEY || process.env.ODOO_PASSWORD),
    timeoutMs: process.env.ODOO_TIMEOUT_MS
      ? Number(process.env.ODOO_TIMEOUT_MS)
      : 20000,
    insecureSSL:
      (process.env.ODOO_INSECURE_SSL || '').toLowerCase() === 'true',
  };
}

export class OdooClient {
  private axios: AxiosInstance;
  private config: OdooConfig;
  private uid: number | null = null;

  constructor(config: OdooConfig) {
    this.config = config;
    this.axios = axios.create({
      baseURL: config.host.replace(/\/$/, ''),
      timeout: config.timeoutMs ?? 20000,
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: config.insecureSSL
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined,
    });
  }

  private async authenticate(): Promise<number> {
    // If we already authenticated, reuse uid
    if (this.uid) return this.uid;

    // Use JSON-RPC 'common' service authenticate (works with API keys)
    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'common',
        method: 'authenticate',
        args: [this.config.db, this.config.username, this.config.password, {}],
      },
      id: Date.now(),
    };

    const { data } = await this.axios.post<JsonRpcResponse<number | false>>(
      '/jsonrpc',
      payload
    );
    if (data?.error) {
      throw new Error(`Odoo auth failed: ${JSON.stringify(data.error)}`);
    }
    if (typeof data?.result === 'number' && data.result > 0) {
      this.uid = data.result;
      return this.uid;
    }
    throw new Error(`Odoo auth failed: ${JSON.stringify(data)}`);
  }

  private async rpc<T = any>(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, unknown> = {}
  ): Promise<T> {
    const uid = await this.authenticate();
    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [
          this.config.db,
          uid,
          this.config.password,
          model,
          method,
          args,
          kwargs,
        ],
      },
      id: Date.now(),
    };

    const { data } = await this.axios.post<JsonRpcResponse<T>>(
      '/jsonrpc',
      payload
    );
    if (data?.error) {
      throw new Error(
        `Odoo RPC error: ${data.error.message} :: ${JSON.stringify(
          data.error.data
        )}`
      );
    }
    return data.result as T;
  }

  /** Generic search_read helper */
  async searchRead<T = any>(
    model: string,
    domain: any[] = [],
    fields?: string[],
    kwargs: Record<string, unknown> = {}
  ): Promise<T[]> {
    const options = { ...(fields ? { fields } : {}), ...kwargs } as Record<string, unknown>;
    return this.rpc<T[]>(model, 'search_read', [domain], options);
  }

  /** Generic search_count helper */
  async searchCount(model: string, domain: any[] = []): Promise<number> {
    return this.rpc<number>(model, 'search_count', [domain]);
  }

  /**
   * Lightweight connectivity check.
   * Authenticates and performs a tiny RPC (search_count on res.partner).
   */
  async ping(): Promise<{ uid: number; partnerCount: number }>
  {
    const uid = await this.authenticate();
    const partnerCount = await this.rpc<number>('res.partner', 'search_count', [[]]);
    return { uid, partnerCount };
  }

  async findOrCreatePartner(partnerData: {
    name: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    zip?: string;
    country_id?: number; // optional, if looked up
  }): Promise<number> {
    const searchDomain = partnerData.email
      ? [['email', '=', partnerData.email]]
      : partnerData.phone
        ? [['phone', '=', partnerData.phone]]
        : [['name', '=', partnerData.name]];

    const ids = await this.rpc<number[]>(
      'res.partner',
      'search',
      [searchDomain, 0, 1]
    );

    if (ids && ids.length) {
      // Optionally update basic fields
      try {
        await this.rpc('res.partner', 'write', [ids, partnerData]);
      } catch (_) {
        // ignore write failures to avoid blocking
      }
      return ids[0];
    }

    const id = await this.rpc<number>('res.partner', 'create', [partnerData]);
    return id;
  }

  private async findOrCreateProduct(item: Pick<OrderItem, 'menuItemId' | 'unitPrice' | 'menuItem'>): Promise<number> {
    // Use website menuItemId as SKU (default_code). Fallback by name.
    const sku = item.menuItemId;
    const name = item.menuItem?.name || item.menuItemId;

    const domain = sku
      ? [['default_code', '=', sku]]
      : [['name', '=', name]];

    const prodIds = await this.rpc<number[]>(
      'product.product',
      'search',
      [domain, 0, 1]
    );

    if (prodIds && prodIds.length) return prodIds[0];

    // Create minimal product
    const productVals = {
      name,
      default_code: sku,
      list_price: item.unitPrice,
      sale_ok: true,
      purchase_ok: false,
      type: 'consu',
    };
    const productId = await this.rpc<number>(
      'product.product',
      'create',
      [productVals]
    );
    return productId;
  }

  async createSaleOrderFromWebsiteOrder(websiteOrder: Order, partnerHint?: {
    name?: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    zip?: string;
  }): Promise<number> {
    // Idempotency: search by client_order_ref
    const existing = await this.rpc<number[]>(
      'sale.order',
      'search',
      [[['client_order_ref', '=', websiteOrder.id]]],
      { limit: 1 }
    );
    if (existing && existing.length) return existing[0];

    const partnerId = await this.findOrCreatePartner({
      name: partnerHint?.name || `Website User ${websiteOrder.userId}`,
      email: partnerHint?.email,
      phone: partnerHint?.phone,
      street: partnerHint?.street,
      city: partnerHint?.city,
      zip: partnerHint?.zip,
    });

    const lines: any[] = [];
    for (const line of websiteOrder.items) {
      const productId = await this.findOrCreateProduct({
        menuItemId: line.menuItemId,
        unitPrice: line.unitPrice,
        menuItem: line.menuItem,
      });

      lines.push([
        0,
        0,
        {
          product_id: productId,
          name: line.menuItem?.name || line.menuItemId,
          product_uom_qty: line.quantity,
          price_unit: line.unitPrice,
          // tax_id can be set by fiscal position or left empty
          // tax_id: [[6, 0, [taxId]]],
        },
      ]);
    }

    const saleVals: Record<string, unknown> = {
      partner_id: partnerId,
      client_order_ref: websiteOrder.id,
      order_line: lines,
      note:
        websiteOrder.notes ||
        `Created from website order ${websiteOrder.orderNumber}`,
    };

    const saleId = await this.rpc<number>('sale.order', 'create', [saleVals]);
    return saleId;
  }

  /** Check whether a given model is available in this Odoo DB */
  async modelExists(modelName: string): Promise<boolean> {
    const count = await this.rpc<number>('ir.model', 'search_count', [[['model', '=', modelName]]]);
    return (count || 0) > 0;
  }

  /** Confirm a sale order (turn quotation into order). Requires Sales app. */
  async confirmSaleOrder(saleId: number): Promise<boolean> {
    // action_confirm expects a list of IDs
    await this.rpc('sale.order', 'action_confirm', [[saleId]]);
    return true;
  }
}

export function createOdooClient(): OdooClient | null {
  const cfg = getOdooConfigFromEnv();
  if (!cfg) return null;
  return new OdooClient(cfg);
}
