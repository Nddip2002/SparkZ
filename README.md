# SparkZ — Electronic Components E-Commerce Platform

A production-grade, full-stack electronic components platform with atomic stock reservations, dynamic JSON specifications, and high-performance UI chrome.

- **GitHub Repository:** [https://github.com/Nddip2002/SparkZ.git](https://github.com/Nddip2002/SparkZ.git)
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion
- **Backend:** NestJS 12 + TypeScript + Prisma ORM 7 (`@prisma/adapter-pg`) + Supabase PostgreSQL

---

## ⚡ Architecture & Key Highlights

1. **Atomic Transactions & Guaranteed Non-Negative Stock:**
   - Cart checkout decrements stock using conditional SQL locks inside an isolated `prisma.$transaction()`.
   - Out-of-stock or race condition attempts fail immediately before order creation.
2. **Hybrid Relational + JSONB Schema:**
   - 5-table normalized schema (`users`, `products`, `cart_items`, `orders`, `order_items`).
   - Technical specifications (voltages, clock speeds, pin counts, packages) stored in indexed `specifications` `JSONB` column with GIN indexes.
3. **60/30/10 SparkZ Design Theme:**
   - **60% Onyx Black** (`#0B0B0D` canvas, `#141418` surface)
   - **30% Pure White** (`#FFFFFF` text, high-contrast tables and cards)
   - **10% Spark Lime** (`#A3E635` primary CTAs, hover rings, badges)
4. **Performance & Low-End Device Optimizations:**
   - Custom cursor tracker ring driven by `useMotionValue` and `useSpring` (zero React re-renders).
   - Gated behind `(pointer: fine)` so mobile and touchscreens never mount cursor listeners.
   - Respects `(prefers-reduced-motion: reduce)`.
   - Lazy-loaded `CheckoutPage` and `AdminPage` routes via `React.lazy()` + `Suspense`.
   - Edge-cached catalog responses via `@nestjs/cache-manager` and `@tanstack/react-query` with write-invalidation.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v20+ (tested on Node v25)
- npm v10+
- A Supabase PostgreSQL project with Auth enabled

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
```

Fill in your `.env` credentials:
```env
PORT=3000
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:xxx@aws-0-region.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
```

Generate client, run migrations and seed catalog:
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

### 3. Frontend Setup
```bash
cd ../frontend
cp .env.example .env
```

Configure `frontend/.env` (no secrets are stored in the frontend):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3000/api
```

Start Vite development server:
```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

---

## 🧪 Verification & Quality Control

Both packages strictly conform to the workspace guidelines:

```bash
# Frontend
cd frontend
npm run build   # tsc -b && vite build
npm run lint    # oxlint (0 errors, 0 warnings)

# Backend
cd backend
npm run build   # nest build
npm run lint    # oxlint --type-aware (0 errors, 0 warnings)
```
