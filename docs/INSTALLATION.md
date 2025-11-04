# 🎯 Installation Commands - Copy & Paste Guide

## Step-by-Step Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up PostgreSQL Database

#### Option A: Using Neon (Recommended - Free Cloud Database)
```bash
# 1. Go to https://neon.tech
# 2. Sign up for free account
# 3. Create a new project
# 4. Copy the connection string
# 5. Paste it in your .env file
```

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL first, then:
createdb elite_coffee

# Update .env with:
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/elite_coffee"
```

### 3. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Then edit .env and update:
# - DATABASE_URL (your PostgreSQL connection string)
# - JWT_SECRET (generate a random secret)
```

### 4. Initialize Database
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed
```

### 5. (Optional) Migrate Existing Menu Data
```bash
# This will migrate menuData.ts to the database
npx tsx scripts/migrateMenuData.ts
```

### 6. Start Development Server
```bash
npm run dev
```

### 7. Open in Browser
```
http://localhost:3000
```

## Quick Test Commands

### Test the API
```bash
# Test menu endpoint
curl http://localhost:3000/api/menu

# Test cart endpoint
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"
```

### View Database
```bash
# Open Prisma Studio (database GUI)
npm run db:studio
```

## All Available Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run linter
npm run format           # Format code with Biome

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Create and run migrations
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open Prisma Studio GUI
```

## Troubleshooting

### Problem: "Cannot connect to database"
```bash
# Check if PostgreSQL is running
# Verify DATABASE_URL in .env file
# Test connection:
npx prisma db push
```

### Problem: "Prisma Client not found"
```bash
# Regenerate Prisma Client
npm run db:generate
```

### Problem: "Port 3000 already in use"
```bash
# Use a different port
npm run dev -- -p 3001
```

### Problem: Node module errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Reset Database (WARNING: Deletes all data)
```bash
npx prisma migrate reset
npm run db:seed
```

## Environment Variables Template

Create a `.env` file with these variables:

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://username:password@localhost:5432/elite_coffee?schema=public"

# JWT Secret (REQUIRED)
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Optional: Payment Integration
# STRIPE_SECRET_KEY=""
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Optional: Email Service
# EMAIL_HOST=""
# EMAIL_PORT=""
# EMAIL_USER=""
# EMAIL_PASSWORD=""
```

## Quick Start (One-Liner)

After setting up your database URL in `.env`:

```bash
npm install && npm run db:generate && npm run db:push && npm run db:seed && npm run dev
```

## Success Checklist

After installation, you should see:
- ✅ Dependencies installed
- ✅ Prisma Client generated
- ✅ Database schema created
- ✅ Sample data seeded
- ✅ Development server running
- ✅ No errors in terminal
- ✅ Can access http://localhost:3000
- ✅ API endpoints responding

## What's Next?

1. ✅ Explore the API endpoints at `http://localhost:3000/api/menu`
2. ✅ Open Prisma Studio to view your database: `npm run db:studio`
3. ✅ Read the documentation files:
   - `QUICKSTART.md` - Quick start guide
   - `BACKEND_SETUP.md` - Detailed backend setup
   - `PROJECT_STRUCTURE.md` - Architecture overview
4. ✅ Start building features!

## Need Help?

Check these files in order:
1. `QUICKSTART.md` - Quick solutions
2. `BACKEND_SETUP.md` - Detailed setup
3. `PROJECT_STRUCTURE.md` - Architecture
4. `README.md` - Full documentation

## Happy Coding! ☕🚀
