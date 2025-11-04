/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { createOdooClient, isOdooConfigured } from '@/server/utils/odooClient';
import { jsonResponse, successResponse, errorResponse } from '@/server/utils/apiHelpers';

// POST /api/odoo/test
// Optional body: { name, email, phone }
export async function POST(request: NextRequest) {
  try {
    if (!isOdooConfigured()) {
      return jsonResponse(
        errorResponse('Odoo is not configured. Set ODOO_* env vars.'),
        500
      );
    }

    const payload = await request.json().catch(() => ({}));

    const client = createOdooClient();
    if (!client) throw new Error('Failed to init Odoo client');

    const ping = await client.ping().catch(() => null);

    const partnerId = await client.findOrCreatePartner({
      name: payload.name || 'API Test User',
      email: payload.email,
      phone: payload.phone,
    });

    return jsonResponse(
      successResponse({ partnerId, ping }, 'Odoo connectivity OK')
    );
  } catch (err: any) {
    return jsonResponse(
      errorResponse(err?.message || 'Odoo test failed'),
      500
    );
  }
}

// GET /api/odoo/test
// Simple connectivity check (no partner creation)
export async function GET() {
  try {
    if (!isOdooConfigured()) {
      return jsonResponse(
        errorResponse('Odoo is not configured. Set ODOO_* env vars.'),
        500
      );
    }

    const client = createOdooClient();
    if (!client) throw new Error('Failed to init Odoo client');

    const ping = await client.ping();
    return jsonResponse(successResponse(ping, 'Odoo connectivity OK'));
  } catch (err: any) {
    return jsonResponse(
      errorResponse(err?.message || 'Odoo test failed'),
      500
    );
  }
}
