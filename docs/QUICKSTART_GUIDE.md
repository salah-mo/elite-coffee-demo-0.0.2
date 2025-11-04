# 🚀 Elite Coffee Shop - Quick Start Guide

## ⚡ Fast Setup (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation Steps
# 🚀 Quick Start Guide (5 minutes)

Spin up Elite Coffee Shop with zero database setup. Works on Windows PowerShell.

## Prerequisites
- Node.js 18+ installed
- Git (optional)

## 1) Install dependencies
```powershell
npm install
```

## 2) (Optional) Configure Odoo
If you want to test the Odoo integration, create a `.env.local` file in the project root and add:

```dotenv
ODOO_HOST=https://your-odoo.odoo.com
ODOO_DB=your_db
ODOO_USERNAME=your_user@example.com
ODOO_API_KEY=your_api_key
```

You can skip this step if you don't use Odoo.

## 3) Start the dev server
```powershell
npm run dev
```

Open http://localhost:3000

## 4) Test the API

Menu
```powershell
curl http://localhost:3000/api/menu
```

Cart (uses header x-user-id; defaults to demo-user)
```powershell
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"
```

Create order
```powershell
curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -H "x-user-id: demo-user" -d '{"paymentMethod":"CASH","notes":"Extra hot"}'
```

Odoo diagnostics (optional)
```powershell
curl http://localhost:3000/api/odoo/orders
```

## Useful commands
```powershell
npm run lint      # Typecheck + ESLint
npm run format    # Biome format
npm run db:reset  # Reset JSON database (data/database.json)
```

## Notes
- No SQL database required. Data is stored in `data/database.json` and persists between runs.
- The dev server uses Turbopack and binds to 0.0.0.0 by default.

---

Happy Coding! ☕
    "autoConfirm": true,
    "orderNumber": "WEB-TEST-001"
  }'
```
Response includes `saleId`, `confirmed`, and a `webUrl` to open the record directly in Odoo.

3) Create a POS order so it appears on Kitchen Display (requires open POS session):
```bash
curl http://localhost:3000/api/odoo/pos
curl -X POST http://localhost:3000/api/odoo/pos/orders \
  -H "Content-Type: application/json" \
  -d '{
    "partner": { "name": "Table 7" },
    "items": [ { "menuItemId": "LATTE-MED", "name": "Latte (M)", "quantity": 2, "unitPrice": 30 } ],
    "notes": "No sugar",
    "orderNumber": "WEB-POS-001",
    "posConfigName": "Main Register"
  }'
```
Response includes `posOrderId` and a direct `webUrl` to the POS Order in Odoo.

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
