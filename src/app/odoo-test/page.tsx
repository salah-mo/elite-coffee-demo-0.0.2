import React from 'react';

// Server Component that calls the internal Odoo test API and renders the result
export default async function OdooTestPage() {
  async function runPostTest() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/odoo/test`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
      });
      const json = await res.json();
      return { ok: res.ok, status: res.status, json } as const;
    } catch (err: any) {
      return { ok: false, status: 0, json: { success: false, message: err?.message || String(err) } } as const;
    }
  }
  async function runGetTest() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/odoo/test`, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        cache: 'no-store',
      });
      const json = await res.json();
      return { ok: res.ok, status: res.status, json } as const;
    } catch (err: any) {
      return { ok: false, status: 0, json: { success: false, message: err?.message || String(err) } } as const;
    }
  }

  const [getResult, postResult] = await Promise.all([runGetTest(), runPostTest()]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Odoo Connectivity Test</h1>
      <p className="text-sm text-gray-600 mb-4">
        This page calls both <code>GET /api/odoo/test</code> (non-mutating ping) and <code>POST /api/odoo/test</code> (find or create a partner) and prints the raw JSON responses.
      </p>
      <div className="rounded border p-3 bg-gray-50">
        <h2 className="font-medium mb-2">GET /api/odoo/test</h2>
        <pre className="text-sm whitespace-pre-wrap break-words">{JSON.stringify(getResult, null, 2)}</pre>
      </div>
      <div className="rounded border p-3 bg-gray-50 mt-4">
        <h2 className="font-medium mb-2">POST /api/odoo/test</h2>
        <pre className="text-sm whitespace-pre-wrap break-words">{JSON.stringify(postResult, null, 2)}</pre>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>
          Tip: Ensure Odoo env vars are set in <code>.env</code>: ODOO_HOST, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD.
        </p>
      </div>
    </div>
  );
}
