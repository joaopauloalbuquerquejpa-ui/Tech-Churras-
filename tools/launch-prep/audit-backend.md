# Backend Audit — Tech Churras — Launch Readiness
Date: 2026-06-30 | Auditor: Backend Architect Agent
Stack: Fastify 5 + TypeScript + Prisma 7 + Supabase PostgreSQL

---

## CRITICAL

| # | File:Line | Issue |
|---|-----------|-------|
| C1 | `cron.routes.ts:35,115` | **CRON_SECRET bypass** — if `CRON_SECRET` env var is unset, `undefined !== undefined` evaluates to `false`, so the auth check silently passes for ANY request; both `/cron/event-reminders` and `/cron/daily-summary` are fully open |
| C2 | `webhooks/whatsapp.routes.ts:273` | **Secret in query param** — `GET /webhooks/leads` passes `WEBHOOK_SECRET` via `?token=` which is written to Railway access logs; use Authorization header instead |
| C3 | `server.ts:41-48` | **DATABASE_URL, ANTHROPIC_API_KEY, RESEND_API_KEY not validated at startup** — server boots successfully without them; failures surface only on first request, silently degrading email, AI, and all DB operations |

---

## HIGH

| # | File:Line | Issue |
|---|-----------|-------|
| H1 | `public.routes.ts:8-113` | **No try/catch on 5 handlers** — `GET /public/orders/:token`, `GET /public/gallery`, `GET /public/testimonials`, `GET /ref/:code`, `GET /ref/user/:userId` make raw Prisma calls with no try/catch; Prisma errors bubble to the global error handler, returning opaque 500s with no context |
| H2 | `cron.routes.ts:39-110` | **Main cron body lacks try/catch** — `Promise.all` DB queries at line 46 have no error boundary; a Prisma failure aborts the entire reminder job silently from the caller's perspective |
| H3 | `public.routes.ts:117-173` | **Unauthenticated mutating route** — `POST /public/visita-equipe` writes leads to the DB with no auth token; any anonymous actor can insert/update lead records; rate-limited to 30/min but no CAPTCHA or signing |
| H4 | `orders.controller.ts:58-69` | **`status` field accepts any string** — `PATCH /orders/:id/status` casts body to `{ status: OrderStatus }` with a TypeScript assertion, not Zod; invalid enum values reach the service layer; add `z.nativeEnum(OrderStatus)` |
| H5 | `admin.routes.ts:141-149` | **`PATCH /admin/coupons/:id` uses `.parse` not `.safeParse`** — a ZodError throws uncaught and the global handler returns `{ error: 'Erro interno do servidor' }` with status 500 instead of 400 |
| H6 | `webhooks/whatsapp.routes.ts:229-233` | **Fire-and-forget Prisma calls without error suppression** — `prisma.lead.updateMany` at line 230 is chained with `.catch(() => {})` but `markLeadContacted` at line 229 is unawaited and not error-wrapped; unhandled rejection risk in Node.js |

---

## MEDIUM

| # | File:Line | Issue |
|---|-----------|-------|
| M1 | `coupons.routes.ts:11` | **`POST /coupons/validate` is unauthenticated** — allows coupon code enumeration; rate limit (15/min per IP) is the only gate; consider requiring a valid session for coupon validation |
| M2 | `calculator.routes.ts:19` | **`POST /calculator/meat-suggestion` unauthenticated** — queries `Product` table for any `boutiqueId` without auth; discloses boutique inventory counts to anonymous callers |
| M3 | `admin.routes.ts:73-81` | **`PATCH /admin/grillmasters/:grillmasterId/profile` no input schema** — `req.body` cast as `Record<string, unknown>` passed directly to `updateGrillmasterProfile`; the service filters via `GRILLMASTER_EDITABLE_FIELDS` allowlist (safe), but a Zod schema would reject malformed payloads before the DB layer |
| M4 | `admin.routes.ts:98-119` | **`POST /admin/grillmasters/:grillmasterId/schedule/toggle` no date validation** — `date` is taken from body and passed to `new Date()` without Zod; a non-string or garbage date string will produce `Invalid Date` and Prisma will throw a generic 500 |
| M5 | `grillmasters.controller.ts:85-93` | **`POST /grillmasters/schedule/toggle` no date validation** — same pattern as M4; `date` string not validated before `toggleScheduleDay` |
| M6 | `orders.controller.ts:45-56` | **`statusDetail` accepted without validation** — arbitrary string written directly to DB; no max-length or enum constraint enforced at the API layer |
| M7 | `orders.controller.ts:130-143` | **`rescheduleOrder` validates with `isNaN` only** — any parseable-but-past date (e.g. year 1970) passes; no minimum date guard |
| M8 | `admin.routes.ts:152-155` | **`GET /admin/leads` no try/catch** — admin-protected but DB failure returns generic 500 |
| M9 | `webhooks/whatsapp.routes.ts:271-275` | **`GET /webhooks/leads` — same secret as webhook** — reuse of `WEBHOOK_SECRET` for a data-read endpoint means any whatsapp-bot integration automatically has read access to all lead PII |
| M10 | `public.routes.ts:40-73` | **Over-fetch pattern in gallery** — `take: pageSize * 3` (60 rows) then `.filter` in memory; for large datasets this is inefficient; add a `photos: { some: {} }` Prisma filter |

---

## LOW

| # | File:Line | Issue |
|---|-----------|-------|
| L1 | `ai.routes.ts:10-17` | **In-memory rate limit map** — `suggestRateLimits` for `/ai/suggest-product` resets on every deploy; a restart bypasses the per-user quota; use Redis or the existing `@fastify/rate-limit` plugin |
| L2 | `reviews.routes.ts:28-35` | **Photo upload: no MIME magic-byte check** — relies on `data.mimetype` (client-declared); `upload.routes.ts` correctly uses magic bytes but `reviews/upload-photo` does not; allows MIME spoofing |
| L3 | `server.ts:79-82` | **CORS allows `!origin`** — comment says "mobile apps, Postman, server-to-server"; this means any curl/wget request without an Origin header bypasses CORS entirely; acceptable but document the intentional decision |
| L4 | `contracts.controller.ts:45-54` | **Admin role check inside handler body** — `GET /contracts/all` checks `user.role !== 'ADMIN'` inline rather than in a preHandler; works correctly but inconsistent with the pattern used in `adminRoutes` |
| L5 | `admin.routes.ts:37-41` | **`requireAdmin` defined in two separate files** — `grillmasters.routes.ts:15` and `admin.routes.ts:37` both declare local `requireAdmin` functions; not a bug but increases maintenance surface |
| L6 | `auth.routes.ts:108-117` | **`DELETE /auth/account` accepts credentials in body** — no JWT required; only email+password; exposes account deletion to scripted attacks within the 5 req/min window; consider requiring active session token |
| L7 | `server.ts:125-128` | **`GET /sentry-test` is publicly accessible** — exposes an unauthenticated endpoint that intentionally fires a Sentry exception; remove or restrict to ADMIN before launch |

---

## Environment Variable Checklist

| Var | Validated at Startup | Graceful Absent Handling |
|-----|---------------------|--------------------------|
| `JWT_SECRET` | Yes (`process.exit`) | N/A |
| `MP_WEBHOOK_SECRET` | Yes (`process.exit`) | N/A |
| `MP_ACCESS_TOKEN` | Yes (`process.exit`) | N/A |
| `DATABASE_URL` | **No** | Prisma throws on first query |
| `ANTHROPIC_API_KEY` | **No** | SDK throws at first API call |
| `RESEND_API_KEY` | **No** | Silently skips email (warns in logs) |
| `CRON_SECRET` | **No** | **Auth bypass if unset (C1)** |
| `WEBHOOK_SECRET` | **No** | Rejects all WA webhooks if unset |
| `VAPID_PUBLIC_KEY / PRIVATE_KEY` | No | Push silently disabled |
| `SUPABASE_URL / SERVICE_KEY` | No | Upload/AI image returns 500 |
| `ZAPI_INSTANCE / TOKEN` | No | WhatsApp silently no-ops |
| `SENTRY_DSN` | No | Monitoring disabled (acceptable) |
| `FRONTEND_URL / BACKEND_URL` | No | Falls back to hardcoded prod URLs |

**Recommend adding to startup validation:** `DATABASE_URL`, `ANTHROPIC_API_KEY`, `CRON_SECRET`.

---

## Summary Counts
- Critical: 3
- High: 6
- Medium: 10
- Low: 7
- TODOs/FIXMEs in production code: **0** (clean)
