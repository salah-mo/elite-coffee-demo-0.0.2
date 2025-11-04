# 🚀 Quick Start (No Database Required)

Your Elite Coffee Shop runs with a working backend and no external database. Data is stored in a JSON file.

## ✨ What's Been Done

### Backend Structure Created
```
src/
├── server/
│   ├── utils/
│   │   ├── apiHelpers.ts      # API response helpers
│   │   └── jsonDatabase.ts    # JSON file storage (persistent)
│   └── middleware/
│       └── auth.ts             # Authentication (ready for future)
├── app/api/                    # API Routes
│   ├── menu/                   # Menu endpoints ✅
│   ├── cart/                   # Cart management ✅
│   └── orders/                 # Order processing ✅
├── types/                      # TypeScript definitions
└── hooks/
    └── useCart.ts              # Cart management hook
```

### Working API Endpoints

All endpoints work with the JSON file database (data persists across restarts):

#### Menu API
- `GET /api/menu` - Get all menu categories
- `GET /api/menu/[category]` - Get specific category
- `GET /api/menu/items/[slug]` - Get menu item details

#### Cart API
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `DELETE /api/cart` - Clear cart

#### Orders API
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/[id]` - Get order details

## 🏃 Get Started (3 Steps)

### 1. Start Development Server
```powershell
npm run dev
```

### 2. Test the API
```powershell
# Get all menu items
curl http://localhost:3000/api/menu

# Get user's cart
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"

# Add item to cart
curl -X POST http://localhost:3000/api/cart -H "Content-Type: application/json" -H "x-user-id: demo-user" -d '{"menuItemId":"americano","quantity":2,"size":"Large"}'
```

### 3. Use in Your Frontend
```typescript
// Example: Fetch menu
const res = await fetch('/api/menu');
const { data } = await res.json();

// Example: Add to cart
await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'demo-user'
  },
  body: JSON.stringify({ menuItemId: 'americano', quantity: 2, size: 'Large' })
});
```

## 📦 Using the Custom Hook

```typescript
import { useCart } from '@/hooks/useCart';

function MyComponent() {
  const { 
    cart, 
    loading, 
    addToCart, 
    removeFromCart,
    itemCount,
    total 
  } = useCart();

  const handleAddToCart = async () => {
    await addToCart('americano', 2, { size: 'Large' });
  };

  return (
    <div>
      <p>Items in cart: {itemCount}</p>
      <p>Total: ${total.toFixed(2)}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

## 📚 Project Structure

```
elite-coffee-shop/
├── src/
│   ├── app/
│   │   ├── api/              # Backend API routes
│   │   │   ├── menu/         # Menu endpoints
│   │   │   ├── cart/         # Cart management
│   │   │   └── orders/       # Order processing
│   │   └── ...               # Frontend pages
│   ├── server/               # Backend logic
│   │   ├── utils/           
│   │   │   ├── apiHelpers.ts    # Response helpers
│   │   │   └── jsonDatabase.ts # Data storage (file-based)
│   │   └── middleware/       # Auth & security
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript types
│   └── lib/
│       └── menuData.ts       # Menu data source
└── ...
```

## ⚡ Key Features

✅ RESTful API - Clean, type-safe endpoints  
✅ JSON File Storage - Cart & orders persist across restarts  
✅ Type Safety - Full TypeScript support  
✅ Custom Hooks - Easy integration with React  
✅ No SQL Database - Works immediately  
✅ Production-Ready structure  

## 🔄 Data Persistence

Current (JSON file):
- Data stored in `data/database.json`
- Persists across restarts
- Reset any time with `npm run db:reset`

Future (SQL database):
- When needed, replace JSON helpers with your ORM of choice. This repo does not include Prisma schema/migrations by default.

## 🎨 Frontend Integration

### Option 1: Direct API Calls
```typescript
const response = await fetch('/api/menu');
const { data } = await response.json();
```

### Option 2: Custom Hooks (Recommended)
```typescript
const { cart, addToCart } = useCart();
```

### Option 3: React Query (Future)
```typescript
const { data } = useQuery('menu', () => 
  fetch('/api/menu').then(r => r.json())
);
```

## 🧪 Testing

### Test Menu Endpoint
```bash
npm run dev
# Then visit: http://localhost:3000/api/menu
```

### Test Cart Flow
1. Add item: `POST /api/cart`
2. View cart: `GET /api/cart`
3. Create order: `POST /api/orders`
4. View orders: `GET /api/orders`

## 🚧 When You're Ready for Database

The project includes complete database schema and migration scripts for when you need persistent storage:

1. Set up PostgreSQL
2. Run: `npm install @prisma/client prisma`
3. Configure `.env` with `DATABASE_URL`
4. Run: `npx prisma generate && npx prisma db push`
5. Replace in-memory calls with Prisma calls

All the database code is ready in:
- `prisma/schema.prisma` - Database schema
- `src/server/services/` - Service layer (ready)
- `src/server/config/` - Database config

## 📖 Available Scripts

```powershell
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Typecheck + ESLint
npm run format    # Format code
npm run db:reset  # Reset JSON DB
```

## 🎯 Next Steps

1. Server is running - test the API endpoints
2. Integrate API calls in your frontend components
3. Use the `useCart` hook for cart management
4. Build your UI components
5. Add authentication when ready
6. Switch to database when needed

## 💡 Tips

- User ID: Currently using `demo-user` header. Replace with real auth later.
- Data Resets: Data clears on server restart (in-memory storage).
- Type Safety: All API responses are fully typed.
- Testing: Use browser dev tools or Postman to test endpoints.

## 🆘 Need Help?

- Check `PROJECT_STRUCTURE.md` for architecture details
- See `ODOO_INTEGRATION.md` to enable Odoo endpoints
- API returns errors with helpful messages
- All endpoints include TypeScript types

---

Everything works out of the box - no database setup required! 🎉

Start building your features right away and switch to a database later if you need it.
