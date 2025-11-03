# 🚀 Quick Start (No Database Required)

Your Elite Coffee Shop has been refactored with a working backend - **no database setup needed!**

## ✨ What's Been Done

### Backend Structure Created
```
src/
├── server/
│   ├── utils/
│   │   ├── apiHelpers.ts      # API response helpers
│   │   └── inMemoryStore.ts   # In-memory data storage
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

All endpoints work with in-memory storage (data persists during runtime):

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
```bash
npm run dev
```

### 2. Test the API
```bash
# Get all menu items
curl http://localhost:3000/api/menu

# Get user's cart
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"

# Add item to cart
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "x-user-id: demo-user" \
  -d '{
    "menuItemId": "americano",
    "quantity": 2,
    "size": "Large"
  }'
```

### 3. Use in Your Frontend
```typescript
// Example: Fetch menu
const response = await fetch('/api/menu');
const { data } = await response.json();

// Example: Add to cart
const response = await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'demo-user'
  },
  body: JSON.stringify({
    menuItemId: 'americano',
    quantity: 2,
    size: 'Large'
  })
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
│   │   │   └── inMemoryStore.ts # Data storage
│   │   └── middleware/       # Auth & security
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript types
│   └── lib/
│       └── menuData.ts       # Menu data source
└── ...
```

## ⚡ Key Features

✅ **RESTful API** - Clean, type-safe endpoints  
✅ **In-Memory Storage** - Cart & orders persist during runtime  
✅ **Type Safety** - Full TypeScript support  
✅ **Custom Hooks** - Easy integration with React  
✅ **No Database** - Works immediately, no setup required  
✅ **Production Ready** - Easy to migrate to database later  

## 🔄 Data Persistence

**Current (In-Memory):**
- Data stored in server memory
- Persists during server runtime
- Lost on server restart
- Perfect for development

**Future (Database):**
The structure is ready for database integration:
1. Prisma schema already created (`prisma/schema.prisma`)
2. Service files ready (`src/server/services/`)
3. Just replace in-memory calls with Prisma calls
4. No API changes needed

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

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run linter
npm run format    # Format code
```

## 🎯 Next Steps

1. ✅ Server is running - test the API endpoints
2. ✅ Integrate API calls in your frontend components
3. ✅ Use the `useCart` hook for cart management
4. ✅ Build your UI components
5. ⏳ Add authentication when ready
6. ⏳ Switch to database when needed

## 💡 Tips

- **User ID**: Currently using `demo-user` header. Replace with real auth later.
- **Data Resets**: Data clears on server restart (in-memory storage).
- **Type Safety**: All API responses are fully typed.
- **Testing**: Use browser dev tools or Postman to test endpoints.

## 🆘 Need Help?

- Check `PROJECT_STRUCTURE.md` for architecture details
- API returns errors with helpful messages
- All endpoints include TypeScript types
- Console logs show request/response data

---

**Everything works out of the box - no database setup required!** 🎉

Start building your features right away and add database persistence later when you need it.
