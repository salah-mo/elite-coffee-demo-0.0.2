# 🚀 Elite Coffee Shop - Quick Start Guide

## ⚡ Fast Setup (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation Steps

1. **Clone & Navigate**
   ```bash
   cd "c:\Users\Salah Mohamed\Desktop\ELITE"
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   ```
   http://localhost:3000
   ```

That's it! ✅ Your app is running!

---

## 📱 Features Currently Working

### ✅ Available Now
- **Menu Browsing** - Browse all coffee categories and items
- **Product Details** - View item details with customization options
- **Shopping Cart** - Add/remove items, update quantities
- **Order Creation** - Place orders with cart items
- **Persistent Storage** - Data saved to JSON file

### 🔄 Coming Soon
- **User Authentication** - Login/Register system
- **Rewards Program** - Loyalty points and rewards
- **Shop** - Purchase coffee beans and equipment
- **Payment Integration** - Online payment processing

---

## 🛠️ Available Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Check TypeScript & ESLint errors
npm run format       # Format code with Biome

# Database
npm run db:reset     # Reset cart and orders data
```

---

## 📂 Project Structure

```
ELITE/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── cart/          # Cart operations
│   │   │   ├── menu/          # Menu data
│   │   │   └── orders/        # Order management
│   │   ├── menu/              # Menu pages
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities & menu data
│   ├── server/                # Backend logic
│   │   └── utils/             # API helpers & database
│   └── types/                 # TypeScript definitions
├── public/                     # Static assets
│   └── images/                # Images & logos
├── data/                       # JSON database
│   └── database.json          # Persistent storage
└── package.json               # Dependencies
```

---

## 🎯 Testing the API

### Get Menu
```bash
curl http://localhost:3000/api/menu
```

### Get Cart
```bash
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"
```

### Add to Cart
```bash
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -H "x-user-id: demo-user" \
  -d '{
    "menuItemId": "americano",
    "quantity": 2,
    "size": "Large"
  }'
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-user-id: demo-user" \
  -d '{
    "paymentMethod": "CASH",
    "notes": "Extra hot"
  }'
```

### (Optional) Test Odoo Connectivity
Set `ODOO_*` variables in `.env` then:
```bash
curl -X POST http://localhost:3000/api/odoo/test \
  -H "Content-Type: application/json" \
  -d '{"name":"API Test","email":"test@example.com"}'
```
If configured correctly, you should receive a JSON response with a `partnerId`.

---

## 🔧 Common Issues & Solutions

### Issue: Port 3000 already in use
**Solution:**
```bash
# Find and kill the process
npx kill-port 3000
# Then run again
npm run dev
```

### Issue: Module not found errors
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Issue: Can't run lint command
**Solution:** Already fixed! Now uses `npx` instead of `bunx`

### Issue: Images not loading
**Solution:** Make sure images are in `public/images/` directory

---

## 💻 Frontend Integration Examples

### Using the Cart Hook
```typescript
import { useCart } from '@/hooks/useCart';

function MyComponent() {
  const { cart, addToCart, removeFromCart, total } = useCart();

  const handleAdd = async () => {
    await addToCart('americano', 2, {
      size: 'Large',
      flavor: 'Vanilla'
    });
  };

  return (
    <div>
      <p>Cart Total: ${total}</p>
      <button onClick={handleAdd}>Add to Cart</button>
    </div>
  );
}
```

### Direct API Calls
```typescript
// Get menu data
const response = await fetch('/api/menu');
const { data } = await response.json();

// Add to cart
await fetch('/api/cart', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'demo-user'
  },
  body: JSON.stringify({
    menuItemId: 'latte',
    quantity: 1,
    size: 'Medium'
  })
});
```

---

## 📊 Data Storage

- **Location:** `data/database.json`
- **Type:** JSON file (persistent across server restarts)
- **Structure:**
  ```json
  {
    "carts": {
      "user-id": [ /* cart items */ ]
    },
    "orders": [ /* all orders */ ]
  }
  ```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify
1. Build: `npm run build`
2. Publish directory: `.next`
3. Build command: `npm run build`

---

## 📞 Support & Documentation

- **Full Documentation:** See `README.md`
- **API Reference:** See `START_HERE.md`
- **Project Structure:** See `PROJECT_STRUCTURE.md`
- **No Database Setup:** See `NO_DATABASE_SETUP.md`
 - **Odoo Integration:** See `ODOO_INTEGRATION.md`

---

## 🎉 You're All Set!

Your Elite Coffee Shop is now running and ready for development!

**Next Steps:**
1. ✅ Browse to http://localhost:3000
2. ✅ Explore the menu
3. ✅ Test adding items to cart
4. ✅ Create test orders
5. 🔨 Start building features!

**Happy Coding! ☕**
