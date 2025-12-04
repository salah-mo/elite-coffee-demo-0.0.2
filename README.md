# Elite Coffee Shop - Full Stack Application

A modern, production-ready coffee shop web application built with Next.js 15, TypeScript, and live Odoo product data. Cart and order flows now operate entirely in memory unless you connect a different persistent store, keeping the app lightweight while relying on Odoo as the source of truth for the menu.

> **Documentation:** All docs live in the `docs/` folder.
> **Quick Start:** [QUICKSTART.md](./docs/QUICKSTART.md) · [QUICKSTART_GUIDE.md](./docs/QUICKSTART_GUIDE.md)
> **Guides:** [START_HERE](./docs/START_HERE.md) · [PROJECT_STRUCTURE](./docs/PROJECT_STRUCTURE.md) · [ODOO_INTEGRATION](./docs/ODOO_INTEGRATION.md)

---

## 🚀 Features

### Current Features
- ✅ **Menu System** - Categories, subcategories, and detailed item pages
- ✅ **Cart Management** - Add, update, remove items with customizations
- ✅ **Order Processing** - Complete order workflow from cart to completion
- ✅ **RESTful API** - 10+ well-structured endpoints
- ✅ **Odoo-Sourced Menu** - Live categories and products pulled from your Odoo instance
- ✅ **Type Safety** - Full TypeScript coverage with Zod validation
- ✅ **Odoo Integration** - Optional ERP/POS connectivity (Sales & Kitchen Display)
- ✅ **Modern UI** - Responsive design with Tailwind CSS
- ✅ **Animations** - Framer Motion and GSAP for smooth UX

### Architecture Highlights
- **Backend**: Next.js 15 API routes with server-side rendering
- **Data Layer**: Odoo-backed menu service + in-memory cart/order store (no local JSON database)
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Consistent error responses across all endpoints
- **User Context**: Header-based user identification (`x-user-id`)

---

## 📦 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript 5.6+
- **Styling:** Tailwind CSS 3.4+
- **Animations:** Framer Motion, GSAP
- **UI Components:** Custom components with class-variance-authority

### Backend
- **Runtime:** Node.js 18+
- **API:** Next.js Route Handlers (RESTful)
- **Data Layer:** Odoo product API plus in-memory cart/order store
- **Validation:** Zod schemas
- **Integration:** Optional Odoo JSON-RPC client

### Development Tools
- **Build Tool:** Turbopack (Next.js 15)
- **Linting:** ESLint + TypeScript
- **Formatting:** Biome
- **Type Checking:** TypeScript strict mode

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm package manager
- Git (optional)

### Quick Start (3 Steps)

1. **Install dependencies**
   ```powershell
   npm install
   ```

2. **Start development server**
   ```powershell
   npm run dev
   ```

3. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

### Optional: Odoo Integration

Create `.env.local` file if you want Odoo connectivity:

```bash
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key
# Leave unset or 0 for live menu fetches, set >0 (ms) to cache temporarily
ODOO_MENU_CACHE_TTL_MS=0
```

See [ODOO_INTEGRATION.md](./docs/ODOO_INTEGRATION.md) for complete guide.

## 📚 API Documentation

### Menu Endpoints

#### Get All Categories
```http
GET /api/menu
```

#### Get Category by Slug
```http
GET /api/menu/[category]
```

#### Get Menu Item by Slug
```http
GET /api/menu/items/[slug]
```

### Cart Endpoints

#### Get Cart
```http
GET /api/cart
Headers: x-user-id: <user-id>
```

#### Add to Cart
```http
POST /api/cart
Headers: x-user-id: <user-id>
Content-Type: application/json

{
  "menuItemId": "string",
  "quantity": number,
  "size": "string",
  "flavor": "string",
  "toppings": ["string"]
}
```

#### Clear Cart
```http
DELETE /api/cart
Headers: x-user-id: <user-id>
```

### Order Endpoints

#### Get User Orders
```http
GET /api/orders
Headers: x-user-id: <user-id>
```

#### Create Order
```http
POST /api/orders
Headers: x-user-id: <user-id>
Content-Type: application/json

{
  "paymentMethod": "CASH" | "CARD" | "WALLET" | "ONLINE",
  "addressId": "string",
  "notes": "string"
}
```

#### Get Order by ID
```http
GET /api/orders/[id]
Headers: x-user-id: <user-id>
```

## 🗄️ Database Schema

### Main Models
- **User**: Customer accounts and authentication
- **Category**: Menu categories
- **SubCategory**: Menu subcategories
- **MenuItem**: Individual menu items
- **Size/Flavor/Topping**: Customization options
- **Cart/CartItem**: Shopping cart
- **Order/OrderItem**: Order management
- **Review**: Product reviews
- **Reward**: Loyalty program
- **Address**: User addresses

---

## 🔧 Available Scripts

```powershell
npm run dev       # Start development server (with Turbopack)
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # TypeScript checking + ESLint
npm run format    # Format code with Biome
```

## 🏗️ Development Workflow

1. **Make changes** to your code
2. **Run linter**: `npm run lint`
3. **Format code**: `npm run format`
4. **Test locally**: `npm run dev`
5. **Build**: `npm run build`
6. **Commit** your changes

## 📝 Code Style

- TypeScript for type safety
- ESLint for code quality
- Biome for code formatting
- Follow the existing project structure

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ODOO_HOST` | Odoo base URL (e.g., https://odoo.example.com) | No |
| `ODOO_DB` | Odoo database name | No |
| `ODOO_USERNAME` | Odoo API user | No |
| `ODOO_API_KEY` | Odoo API key (preferred) | No |
| `ODOO_PASSWORD` | Odoo password (fallback) | No |
| `ODOO_TIMEOUT_MS` | Request timeout in ms (default: 20000) | No |
| `ODOO_INSECURE_SSL` | Allow self-signed certs (dev only) | No |
| `ODOO_MENU_CACHE_TTL_MS` | Menu cache lifetime in ms (`0` = always fetch from Odoo) | No |

**Tip:** No `DATABASE_URL` is required out of the box. Connect your own database only if you need persistence beyond the in-memory cart/order store.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

This project is private and proprietary.

---

## 🎯 Troubleshooting

### Data Issues
- Remember that carts and orders live in memory by default and reset when the server restarts.
- To persist orders long-term, connect Odoo sales/POS sync or wire up your own database layer.

### Build Errors
```powershell
# Clear Next.js cache and reinstall
Remove-Item -Recurse -Force .next, node_modules
npm install
```

### Port 3000 in use
```powershell
# Option 1: Kill the process
npx kill-port 3000

# Option 2: Use different port
npm run dev -- -p 3001
```

### Type Errors
```powershell
npm run lint
```

### Odoo Connection Issues
- Verify `.env.local` values
- Prefer `ODOO_API_KEY` over `ODOO_PASSWORD`
- Check network connectivity to Odoo instance
- For dev with self-signed certs: set `ODOO_INSECURE_SSL=true`

## 🧩 Odoo POS/ERP Integration (Optional)

This project can push website orders into Odoo's Sales module using JSON‑RPC.

- Configure env vars in `.env` (see `.env.example`).
- Test connectivity:
   ```http
   POST /api/odoo/test
   ```
- Create a website order via `POST /api/orders` and it will best‑effort sync to Odoo.

See the full guide in `ODOO_INTEGRATION.md`.

## 📞 Support

For issues and questions, please contact the development team.
