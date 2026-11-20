# SparkZ — Agent Workspace Rules

## 1. Project Identity & Scope
- **Project:** SparkZ — Electronic Components E-Commerce Platform (educational & portfolio project).
- **Monorepo:** `frontend/` (React + TS + Vite + Tailwind CSS v4, Vercel) and `backend/` (NestJS + TS + Prisma ORM + Supabase PostgreSQL, Render).
- **Workflow:** Plan -> Act -> Verify. Outline a plan before multi-file changes; run builds/tests before marking tasks complete.

## 2. Hard Architectural Boundaries
- `backend/` is the single source of truth for business logic, pricing, inventory deductions, role verification, webhooks.
- Zero secrets in `frontend/`. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.
- Strict TypeScript (`strict: true`). No `any` without justification.

## 3. Database (5-table hybrid schema in `backend/prisma/schema.prisma`)
1. `users` (id, email, full_name, phone, role [CUSTOMER|ADMIN], account_type [INDIVIDUAL|BUSINESS], created_at)
2. `products` (id, sku, mpn, category, subcategory, manufacturer, name, slug, description, unit_price, stock_quantity, image_urls String[], datasheet_url, specifications Json + GIN index, is_active, created_at)
3. `cart_items` (id, user_id, product_id, quantity, added_at; `@@unique([userId, productId])`)
4. `orders` (id, order_number, user_id, shipping_address Json, subtotal, shipping_cost, total_amount, status, payment_status, payment_reference, created_at)
5. `order_items` (id, order_id, product_id, quantity, unit_price_at_purchase)
- Order numbers: `SZ-YYYY-NNNN`.
- Checkout, order creation and stock decrements inside one `prisma.$transaction()`. Never negative stock.
- Prisma 7: `@prisma/adapter-pg` with `DATABASE_URL` (pooler) at runtime; `DIRECT_URL` for migrate.

## 4. Security
- Supabase JWT verified by `JwtAuthGuard`; admin endpoints use `@Roles('ADMIN')` + `RolesGuard`.
- Roles come from `app_metadata` or the `users` table — never `user_metadata` or client input.
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` with class-validator DTOs.
- Assume RLS enabled on all public tables; backend uses server credentials.

## 5. Caching
- Frontend: `@tanstack/react-query`, `staleTime` 30–60s for catalog data.
- Backend: `@nestjs/cache-manager` in-memory for catalog/filter endpoints.
- Never cache checkout stock checks, carts, or order histories. Invalidate catalog cache on admin product writes.

## 6. Frontend UI
- SparkZ branding everywhere.
- Palette 60/30/10 via Tailwind v4 `@theme`: onyx `#0B0B0D` / onyx-surface `#141418`; pure-white `#FFFFFF` / off-white `#F4F4F6`; spark-lime `#A3E635` / spark-lime-hover `#BEF264`. `text-onyx` on lime buttons.
- `motion` + Tailwind. Animate only `transform`/`opacity`. Mouse coords via `useMotionValue`/`useSpring`, never `useState`.
- Cursor effects gated on `(pointer: fine)`; honor `(prefers-reduced-motion: reduce)`.
- Lazy-load Admin & Checkout routes; `loading="lazy"` on catalog images.

## 7. Git & Safety
- Never commit `.env`/secrets; keep `.env.example` current in both packages.
- No `prisma migrate reset` or force-push without explicit approval.
- `npm run build` and `npm run lint` must pass in both packages before finishing a milestone.
