# 🚀 Quick Start Guide

Get your Elite Coffee Shop backend up and running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Git

## Step 1: Install Dependencies (2 min)
```bash
npm install
```

## Step 2: Set Up Environment (1 min)
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database URL
# For local PostgreSQL:
DATABASE_URL="postgresql://postgres:password@localhost:5432/elite_coffee"

# For cloud database (e.g., Neon, Supabase):
# Use the connection string they provide
```

## Step 3: Initialize Database (1 min)
```bash
# Generate Prisma Client
npm run db:generate

# Create database schema
npm run db:push

# Seed with sample data
npm run db:seed
```

## Step 4: Start Development Server (1 min)
```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

## Quick Database Setup Options

### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL, then:
createdb elite_coffee
```

### Option 2: Cloud Database (Recommended)

#### Neon (Free)
1. Visit https://neon.tech
2. Create account & new project
3. Copy connection string to `.env`

#### Supabase (Free)
1. Visit https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy connection string to `.env`

#### Railway (Free tier)
1. Visit https://railway.app
2. Create new PostgreSQL database
3. Copy connection string to `.env`

## Testing the API

### Test Menu Endpoint
```bash
curl http://localhost:3000/api/menu
```

### Test Cart Endpoint
```bash
curl http://localhost:3000/api/cart -H "x-user-id: demo-user"
```

## Useful Commands

```bash
# View database in browser
npm run db:studio

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# Check lint errors
npm run lint

# Format code
npm run format
```

## Common Issues

### "Cannot connect to database"
- ✅ Check PostgreSQL is running
- ✅ Verify DATABASE_URL in `.env`
- ✅ Ensure database exists

### "Prisma Client not found"
```bash
npm run db:generate
```

### Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001
```

## Next Steps

1. ✅ Explore the API endpoints
2. ✅ Check out `BACKEND_SETUP.md` for detailed docs
3. ✅ Review `PROJECT_STRUCTURE.md` for architecture
4. ✅ Start building features!

## Need Help?

- 📖 Read `README.md` for full documentation
- 📖 Check `BACKEND_SETUP.md` for detailed setup
- 📖 Review `PROJECT_STRUCTURE.md` for architecture
- 🐛 Check GitHub issues for common problems

---

**Happy Coding! ☕**
