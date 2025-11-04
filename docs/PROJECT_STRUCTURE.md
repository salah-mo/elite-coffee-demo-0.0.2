# Project Architecture

This document describes the current codebase layout and backend architecture of Elite Coffee Shop. It reflects the latest implementation using a JSON file database and optional Odoo integration.

## 🏗️ Repository Tree (key parts)

```
ELITE/
├── data/
│   └── database.json            # Persistent JSON database (carts, orders)
├── public/
│   └── images/                  # Static assets
├── src/
│   ├── app/                     # Next.js App Router (Next 15)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Home
│   │   ├── api/                 # Backend API routes
│   │   │   ├── cart/
│   │   │   │   └── route.ts     # GET/POST/DELETE /api/cart
│   │   │   ├── menu/
│   │   │   │   ├── route.ts     # GET /api/menu
│   │   │   │   ├── [category]/route.ts
│   │   │   │   └── items/[slug]/route.ts
│   │   │   ├── orders/
│   │   │   │   ├── route.ts     # GET/POST /api/orders
│   │   │   │   └── [id]/route.ts
│   │   │   └── odoo/            # Odoo JSON-RPC integrations
│   │   │       ├── orders/route.ts       # GET diagnostics, POST sale order
│   │   │       ├── order-test/route.ts   # POST quick single-item order
│   │   │       ├── products/route.ts     # GET product list
│   │   │       └── pos/
│   │   │           ├── route.ts          # GET POS diagnostics
│   │   │           └── orders/route.ts   # POST pos.order (Kitchen Display)
│   │   ├── menu/                # Menu pages (categories/subcategories)
│   │   ├── rewards/
│   │   └── shop/
│   ├── components/              # UI components
│   ├── hooks/
│   │   └── useCart.ts           # Client cart helper
│   ├── lib/
│   │   └── menuData.ts          # Menu data source
│   ├── server/
│   │   ├── middleware/
│   │   │   └── auth.ts          # Placeholder auth middleware
│   │   ├── utils/
│   │   │   ├── apiHelpers.ts    # jsonResponse/error helpers
│   │   │   ├── errors.ts        # HTTP error classes
│   │   │   ├── jsonDatabase.ts  # JSON DB read/write helpers
│   │   │   └── odooClient.ts    # Odoo JSON-RPC client
│   │   └── validators/
│   │       ├── cartSchemas.ts
│   │       └── orderSchemas.ts
│   └── types/
│       └── index.ts             # Shared TypeScript types
├── package.json                 # Scripts and dependencies
├── next.config.js
├── tailwind.config.ts
└── docs/                        # Documentation (source of truth)
```

Notes:
- There is no Prisma or SQL database in the current implementation. Persistence is handled by `data/database.json` via `src/server/utils/jsonDatabase.ts`.
- Some older docs referenced Prisma as a future path; this is now captured under “Future Work” below.

## 🔧 Runtime and Scripts

From `package.json`:

```
dev      → next dev -H 0.0.0.0 --turbopack
build    → next build
start    → next start
lint     → npx tsc --noEmit && next lint
format   → npx biome format --write
db:reset → echo {"carts":{},"orders":[]} > data/database.json && echo Database reset complete!
```

## 📦 Dependencies (selected)

- next 15, react 18, tailwindcss
- zod (validation)
- axios (+ cookie jar support) for Odoo client
- framer-motion, gsap (UI)
- dev: TypeScript, ESLint, Biome

## 💾 Data Storage

- File: `data/database.json`
- Accessed through `src/server/utils/jsonDatabase.ts` providing `cartDB` and `orderDB` helpers
- Safe to delete/reset during dev using `npm run db:reset`

## 🚀 API Endpoints

Menu:
- GET `/api/menu`
- GET `/api/menu/[category]`
- GET `/api/menu/items/[slug]`

Cart:
- GET `/api/cart` (requires `x-user-id` header; defaults to `demo-user`)
- POST `/api/cart` (add item)
- DELETE `/api/cart` (clear)

Orders:
- GET `/api/orders` (by user via `x-user-id`)
- POST `/api/orders`
- GET `/api/orders/[id]`

Odoo (optional integration):
- GET `/api/odoo/orders` (diagnostics)
- POST `/api/odoo/orders` (create sale.order; `autoConfirm` supported)
- POST `/api/odoo/order-test` (quick single-item test)
- GET `/api/odoo/products` (with sampling/fields)
- GET `/api/odoo/pos` (POS diagnostics)
- POST `/api/odoo/pos/orders` (create `pos.order` for Kitchen Display)

## 🔐 Configuration

Odoo environment variables (set in `.env` or `.env.local`):

```
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key
# ODOO_PASSWORD=optional_password
ODOO_TIMEOUT_MS=20000
ODOO_INSECURE_SSL=true  # dev only
```

The app does not require a database connection; no `DATABASE_URL` is needed.

## 🧭 Future Work (optional)

- Replace JSON file with a real database (e.g., Postgres + Prisma)
- Authentication and permissions
- Payments, email, admin UI
- Caching, rate limiting, logging/metrics

---

Last Updated: November 4, 2025
Maintainers: Development Team
