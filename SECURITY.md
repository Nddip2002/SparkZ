# SparkZ — Security Review & Hardening Checklist

_Last reviewed: 2026-11-20 · Scope: `frontend/` (React + Vite), `backend/` (NestJS + Prisma 7), Supabase (Auth + PostgreSQL)_

This document records the current security posture of SparkZ, the known gaps, and the work required before going to production. Status legend: ✅ in place · ⚠️ gap / action needed · ℹ️ informational.

---

## 1. Summary

The core design is sound: the backend is the single source of truth, admin access is enforced on the server, prices and stock are handled server-side in one transaction, and no secrets are committed. The main gaps are **no CI/CD pipeline**, **no rate limiting / security headers**, and a few **hardening items** listed below.

| Area | Status |
|---|---|
| Secrets in git | ✅ None committed (`.env` ignored; only `.env.example` tracked) |
| Authentication | ✅ Supabase JWT verified server-side (JWKS / HS256, issuer + audience checked) |
| Authorization / admin | ✅ `JwtAuthGuard` + `RolesGuard` + `@Roles(ADMIN)` on all `/admin/*` routes |
| Input validation | ✅ Global `ValidationPipe({ whitelist, forbidNonWhitelisted })` + class-validator DTOs |
| Pricing / stock integrity | ✅ Server-side pricing, conditional atomic stock decrement in one `$transaction` |
| Database | ✅ RLS enabled on all tables; CHECK constraints for non-negative stock/price |
| Rate limiting | ✅ `@nestjs/throttler` globally (100 req/min) + stricter on `POST /orders/checkout` (10 req/min) |
| Security headers (API + frontend) | ✅ `helmet()` on NestJS API + CSP & security headers in `frontend/vercel.json` |
| CI/CD | ✅ `.github/workflows/ci.yml` + `.github/dependabot.yml` |
| Payments | ℹ️ Not integrated (orders stay `PAYMENT_STATUS = PENDING`) |

---

## 2. Findings & Required Actions

| # | Severity | Finding | Recommended fix |
|---|---|---|---|
| 1 | **High** | The Supabase **database password was shared in plain text** during development (chat). | Rotate it now: Supabase → Project Settings → Database → Reset password. Update `backend/.env` (`DATABASE_URL`, `DIRECT_URL`). |
| 2 | **Medium** | **No rate limiting.** Checkout, cart and public search endpoints can be spammed or scraped. | Add `@nestjs/throttler` globally; apply stricter limits to `POST /orders/checkout` and `/cart`. |
| 3 | **Medium** | **Unbounded cache-key growth.** `CatalogCacheService.keys` (a `Set`) grows with every distinct query, so varying `?search=` can exhaust memory. | Cap the number of tracked keys (or bucket queries) and limit `search` length (e.g. ≤ 100 chars, already `MaxLength(100)` – also cap cardinality). |
| 4 | **Medium** | **Slow search at scale.** Case-insensitive `contains` across 4 columns with no trigram index. | Add a `pg_trgm` GIN index on `name`, `sku`, `mpn`, `manufacturer`; keep rate limiting. |
| 5 | **Low–Medium** | **No security headers.** API has no `helmet`; frontend has no CSP. The Supabase session token is stored in `localStorage`, so XSS would expose it. | Add `helmet` to the API. Add CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` via `vercel.json` headers. |
| 6 | **Medium (pre-prod)** | **Email confirmation is disabled** for local testing. Anyone can register any address. | Re-enable **Confirm email** in Supabase → Authentication → Providers → Email before launch. (Roles are tied to user ID, not email, so this is not a privilege-escalation path.) |
| 7 | **Low** | `specifications` (JSONB) is validated only as "is an object" — no size/depth limit. | Enforce max keys / max serialized size / flat primitive values. |
| 8 | **Info** | **No payment integration.** Orders are created with `paymentStatus = PENDING` indefinitely. | Integrate a provider (Stripe / Razorpay) with a verified webhook before accepting real orders. |
| 9 | **Low** | Backend `npm audit`: 3 high (ReDoS in `effect` via `prisma → @prisma/config`). Prisma CLI tooling only; frontend: 0 vulnerabilities. | Track upstream Prisma releases; do **not** run `npm audit fix --force` (it downgrades Prisma). Re-run audit in CI. |

---

## 3. Authentication & Authorization

**In place**
- Supabase access tokens verified in `AuthService.verifyToken` — asymmetric keys via JWKS, legacy HS256 only if `SUPABASE_JWT_SECRET` is set; `issuer` and `audience: 'authenticated'` are enforced.
- `JwtAuthGuard` resolves the user and provisions the `users` row on first sight.
- Role resolution: `users` table → `app_metadata.role` → `CUSTOMER`. **`user_metadata` and client input are never used for roles.** `PATCH /users/me` cannot set `role`.
- All `/admin/products` and `/admin/orders` routes use `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)`.
- Customer order/cart endpoints always scope queries by the authenticated `user.id`.

**Gaps / notes**
- ⚠️ No MFA enforced for admin accounts (Supabase supports TOTP — enable and require for admins).
- ℹ️ A role granted via `app_metadata` takes precedence over the DB. To **revoke** admin, update `users.role` **and** remove it from Supabase Auth `app_metadata`.
- ℹ️ The frontend `/admin` check is UX only; real enforcement is server-side.

---

## 4. Admin Controls

| Control | Status |
|---|---|
| Server-side role check on every admin route | ✅ |
| Roles never sourced from client-controlled data | ✅ |
| Order status state machine (terminal states locked) | ✅ |
| Cancelling an order restocks inventory inside the same transaction | ✅ |
| Concurrent status updates guarded (`updateMany` on read status) | ✅ |
| Product deletion is a soft delete (history preserved) | ✅ |
| Inventory updates cannot go negative (`@Min(0)` + DB CHECK) | ✅ |
| Catalog cache invalidated on every admin write | ✅ |
| **Audit log of admin actions** (stock, status, deletes) | ⚠️ Missing |
| **MFA for admins** | ⚠️ Missing |
| Admin bootstrap | ✅ Manual SQL only (safest default) |

Admin bootstrap (run in Supabase SQL Editor):

```sql
UPDATE public.users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Recommended: add an `admin_audit_log` table (actor id, action, entity, before/after, timestamp) written inside the same transaction as each admin mutation.

---

## 5. Data Security

**In place**
- **RLS enabled** on `users`, `products`, `cart_items`, `orders`, `order_items` with **no policies**, so the Supabase anon/authenticated roles cannot read or write directly. All access goes through the NestJS backend (server credentials).
- DB CHECK constraints: `stock_quantity >= 0`, `unit_price >= 0`, positive quantities, `order_number ~ '^SZ-[0-9]{4}-[0-9]{4,}$'`.
- Shipping address stored as an immutable JSON snapshot per order; `unit_price_at_purchase` frozen per line item.
- Money stored as `DECIMAL(12,2)`, calculated server-side with `Prisma.Decimal`.
- Logs record user IDs only — no emails, addresses or tokens.
- Frontend holds only public values: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (publishable), `VITE_API_URL`.

**Gaps**
- ℹ️ PII (email, phone, address) is stored in plain text columns. This is normal; Supabase encrypts disks at rest and connections use TLS.
- ⚠️ No account deletion / data export flow (needed for GDPR-style requests).
- ⚠️ Free Supabase tier has **no point-in-time recovery** — take manual backups before real customer data is stored.
- ⚠️ Define a retention policy for orders and personal data.

**Secrets handling**
- `.env`, `.env.*` are git-ignored (`!.env.example` allowed). Never commit `service_role` keys, DB URLs or JWT secrets.
- In production, store backend secrets only in the Render dashboard and frontend public vars in Vercel.

---

## 6. API & Application Hardening

**In place**
- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`.
- `ParseUUIDPipe` on ID params; page size capped at 100; cart line quantity capped at 999.
- CORS limited to `CORS_ORIGIN` list; methods restricted to `GET, POST, PATCH, DELETE`; `credentials: false`.
- URLs validated with `@IsUrl`; slug restricted to lowercase kebab-case.
- React escapes rendered content; external links use `rel="noopener noreferrer"`.

**To add**
- `helmet()` in `main.ts`.
- `@nestjs/throttler` (global + stricter on checkout/cart).
- Request body size limit and sensible request timeouts.
- CSP and security headers on the frontend (`vercel.json`).
- Optional: `Idempotency-Key` for checkout once payments exist.

---

## 7. CI/CD (currently absent)

No `.github/workflows`, `vercel.json`, or `render.yaml` exist, and `backend/test` is empty. The "build and lint must pass" rule in `AGENTS.md` is not enforced automatically.

**Recommended pipeline** (`.github/workflows/ci.yml`, on every PR and push to `main`):

1. `npm ci` in `frontend/` and `backend/`
2. `npm run lint` and `npm run build` in both packages
3. `npx prisma validate` (and `prisma generate`)
4. `npm audit --omit=dev --audit-level=high`
5. Secret scanning with `gitleaks`
6. Unit tests (`vitest run`) once tests exist

**Also add**
- `.github/dependabot.yml` — weekly updates for `npm` (both packages) and `github-actions`.
- **Branch protection on `main`**: require PR + passing CI, no force-push.
- **Deployment**
  - Frontend → Vercel (root `frontend/`), env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.
  - Backend → Render (root `backend/`): build `npm ci && npx prisma generate && npm run build`; **pre-deploy** `npx prisma migrate deploy`; start `npm run start:prod`. Never run migrations on app start, and never run `prisma migrate reset` against production.
  - Set `CORS_ORIGIN` to the exact Vercel URL.

---

## 8. Pre-Production Checklist

- [ ] Rotate the Supabase DB password (shared in chat)
- [ ] Re-enable **Confirm email** in Supabase Auth
- [ ] Enable MFA for admin accounts
- [ ] Add `helmet` and `@nestjs/throttler`
- [ ] Cap catalog cache keys; add `pg_trgm` index for search
- [ ] Add CSP + security headers on the frontend host
- [ ] Add CI workflow, Dependabot, gitleaks, branch protection
- [ ] Add admin audit log
- [ ] Integrate payments with a verified webhook
- [ ] Define backup, retention, and account-deletion procedures
- [ ] Restrict `specifications` size/depth
- [ ] Re-run `npm audit` and re-review before launch

---

## 9. Reporting a Vulnerability

Please report security issues privately to the repository owner (GitHub: `Nddip2002`) rather than opening a public issue. Include steps to reproduce, affected endpoint/file, and impact.
