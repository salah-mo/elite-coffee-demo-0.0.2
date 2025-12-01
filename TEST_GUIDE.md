# Quick Test Guide

## Test the Fix Locally

### 1. Start the Development Server
```powershell
npm run dev
```

### 2. Test Order Page
1. Open http://localhost:3000/order in your browser
2. You should see "Your cart is empty" (not a 500 error)

### 3. Test Adding Items
1. Navigate to http://localhost:3000/menu
2. Click on any drink
3. Add it to cart
4. Go back to http://localhost:3000/order
5. You should see your items in the cart

### 4. Test Placing Order
1. On the order page with items in cart
2. Select "Pickup" or "Delivery"
3. Click "Place Order"
4. You should see "Order Placed Successfully!"

## Simulate Production Environment

To test the serverless mode locally:

### Option 1: Set Environment Variable
```powershell
$env:NETLIFY = "true"
npm run dev
```

This will make the app use in-memory store just like in production.

### Option 2: Use Netlify CLI
```powershell
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Run locally with Netlify functions
netlify dev
```

## Expected Behavior

### ✅ Success Indicators
- Order page loads without errors
- Cart displays correctly
- Can add/remove items
- Can place orders
- Orders appear in order history

### ❌ If You See Errors
1. Check browser console (F12)
2. Check terminal for server errors
3. Verify all files were saved
4. Try restarting dev server

## Deploy When Ready

Once local tests pass:

```powershell
git add .
git commit -m "Fix: Production serverless compatibility for order page"
git push origin Backend
```

Monitor deployment at: https://app.netlify.com
