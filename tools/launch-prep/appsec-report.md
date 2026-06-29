# AppSec Review — Tech Churras Payment & Webhook Surface

**Scope:** Payment processing, webhook validation, order status machine, payout authorization  
**Date:** 2026-06-29  
**Files reviewed:**
- `backend/src/modules/payments/payments.service.ts`
- `backend/src/modules/payments/payments.controller.ts`
- `backend/src/modules/payments/payments.routes.ts`
- `backend/src/modules/webhooks/whatsapp.routes.ts`
- `backend/src/modules/orders/orders.service.ts`
- `backend/src/modules/admin/payouts/payouts.service.ts`
- `backend/src/modules/admin/payouts/payouts.controller.ts`
- `backend/src/modules/admin/admin.routes.ts`
- `backend/src/middlewares/auth.middleware.ts`
- `backend/src/server.ts`

---

## Findings Summary

| # | Title | Severity | File |
|---|-------|----------|------|
| 1 | `gmAccompaniments.laborPrice` is fully customer-controlled | **HIGH** | `orders.service.ts` |
| 2 | No timestamp validation on MP webhook — replay window is unlimited | **HIGH** | `payments.controller.ts` |
| 3 | `updateOrderStatus` skips all auth checks when `userId` is not passed | **HIGH** | `orders.service.ts` |
| 4 | `WEBHOOK_SECRET` exposed in Railway access logs via URL query param | **MEDIUM** | `webhooks/whatsapp.routes.ts` |
| 5 | Rate-limit bypass via attacker-controlled `x-forwarded-for` | **MEDIUM** | `server.ts` |
| 6 | TOCTOU race condition in `updateOrderStatus` status transition | **MEDIUM** | `orders.service.ts` |
| 7 | `eventHours` has no upper bound | **LOW** | `orders.service.ts` |
| 8 | `generatePayouts` uses current GM `pricePerHour`, not rate at time of order | **LOW** | `payouts.service.ts` |

---

## Findings Detail

---

### FINDING 1 — HIGH: `gmAccompaniments.laborPrice` is fully customer-controlled

**File:** `backend/src/modules/orders/orders.service.ts`, line 113  
**What it is:**

The order creation schema accepts `gmAccompaniments` as an array of objects with a `laborPrice` field supplied by the client:

```typescript
gmAccompaniments: z.array(z.object({
  name: z.string().min(2),
  laborPrice: z.number().nonnegative(),  // client controls this
})).optional(),

// ...
const accompLaborTotal = (gmAccompaniments ?? []).reduce((sum, a) => sum + a.laborPrice, 0)
```

The code comment says "validated by name match" but there is no such validation anywhere in the service. The `laborPrice` is summed directly from the client-supplied payload. A customer can send `laborPrice: 0` (or `0.001`) for every accompaniment and pay nothing for services that the GM should be paid for.

**Impact:** A customer can zero out accompaniment labor costs by submitting the order with `laborPrice: 0` on every item. The GM performs work without compensation for that portion and the platform loses its 7% commission on that labor.

**Fix:** Store GM accompaniment definitions and their prices in the database, look them up by name at order time, and never accept a `laborPrice` from the client. This follows the exact pattern already used correctly for product items:

```typescript
// Fetch DB-authoritative prices, reject unknown names
const gmAccompanimentNames = (gmAccompaniments ?? []).map(a => a.name)
const dbAccompaniments = await prisma.grillmasterAccompaniment.findMany({
  where: {
    grillmasterId: data.grillmasterId,
    name: { in: gmAccompanimentNames },
    active: true,
  },
  select: { name: true, laborPrice: true },
})
const accompPriceMap = Object.fromEntries(dbAccompaniments.map(a => [a.name, a.laborPrice]))
const accompLaborTotal = gmAccompanimentNames.reduce((sum, name) => {
  const price = accompPriceMap[name]
  if (price === undefined) throw new Error(`Acompanhamento desconhecido: ${name}`)
  return sum + price
}, 0)
```

Short-term pre-launch option if schema change is not feasible: remove `gmAccompaniments` from the MVP order flow entirely. If the feature is needed, ship it with DB-backed prices, not client-supplied ones.

---

### FINDING 2 — HIGH: No timestamp validation on MP webhook — replay window is unlimited

**File:** `backend/src/modules/payments/payments.controller.ts`, lines 26–37  
**What it is:**

`verifyMPSignature` extracts `ts` from the `x-signature` header and includes it in the HMAC manifest:

```typescript
const manifest = `id:${paymentId};request-id:${xRequestId ?? ''};ts:${ts}`
const expected = createHmac('sha256', secret).update(manifest).digest('hex')
```

`ts` participates in the signature (correct), but its *value* is never compared against the current server time. A valid webhook captured at any point in the past passes signature validation forever.

**Impact:** An attacker who captures a valid MP webhook request (from a Railway log, a compromised network path, or any other source) can replay it indefinitely. The idempotency guard in `handleMPWebhook` prevents double-application of the `approved` event for payment confirmation. However, dispute/chargeback webhooks use `prisma.order.update()` without any idempotency guard, so a replayed dispute event could be re-applied. Additionally, as business logic expands and new webhook handlers are added, the absence of a timestamp check silently makes every new handler vulnerable to replay.

**Fix:** Reject webhooks where `ts` is older than 5 minutes. MP's own documentation recommends a 5-minute tolerance window:

```typescript
function verifyMPSignature(req: FastifyRequest, paymentId: string): boolean {
  // ... (existing header extraction) ...

  const { ts, v1 } = parts
  if (!ts || !v1) return false

  // Reject stale webhooks (replay protection)
  const tsSeconds = parseInt(ts, 10)
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (isNaN(tsSeconds) || Math.abs(nowSeconds - tsSeconds) > 300) {
    req.log.warn('[webhook] Timestamp fora da janela de 5 minutos — possivel replay')
    return false
  }

  const manifest = `id:${paymentId};request-id:${xRequestId ?? ''};ts:${ts}`
  // ... (rest unchanged) ...
}
```

---

### FINDING 3 — HIGH: `updateOrderStatus` skips all authorization when `userId` is not provided

**File:** `backend/src/modules/orders/orders.service.ts`, lines 305–337  
**What it is:**

```typescript
export async function updateOrderStatus(id: string, status: OrderStatus, userId?: string, role?: string) {
  if (userId && role !== 'ADMIN') {   // entire auth block guarded by userId truthy check
    const existing = await prisma.order.findUnique(...)
    // ownership check, transition validation, payment status check ...
  }
  // update runs unconditionally regardless of whether userId was provided:
  const updated = await prisma.order.update({ where: { id }, data: { status, ... } })
```

`userId` is typed `optional`. When it is `undefined`, the `if (userId && ...)` block is skipped entirely and the `prisma.order.update` runs without any authorization check, ownership verification, or state-machine validation. Any caller that omits `userId` can transition any order to any status, bypassing the `VALID_TRANSITIONS` map and the payment-before-confirm guard.

**Impact:** This is a latent privilege escalation path. Current callers in the route handlers appear to always supply `userId` from the JWT. But any future internal caller (cron job, webhook handler, admin script, new feature) that calls `updateOrderStatus(id, status)` without providing `userId` bypasses all guards silently. The risk surface grows with every new feature.

**Fix (immediate, minimal change before launch):** Add a hard guard at the top of the function:

```typescript
export async function updateOrderStatus(id: string, status: OrderStatus, userId?: string, role?: string) {
  // Prevent accidental auth bypass from missing userId
  if (!userId && role !== 'ADMIN') {
    throw new Error('updateOrderStatus requer userId ou role ADMIN explicito')
  }
  // ... rest unchanged
}
```

**Fix (proper, for post-launch):** Use a discriminated union for the caller parameter so the TypeScript compiler enforces correct usage:

```typescript
type StatusUpdateCaller =
  | { source: 'user'; userId: string; role: 'CUSTOMER' | 'GRILLMASTER' }
  | { source: 'admin' }

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  caller: StatusUpdateCaller,
) {
  if (caller.source === 'user') {
    // ... all existing checks using caller.userId and caller.role
  }
  // admin path: no ownership check needed, but still validate transitions
}
```

---

### FINDING 4 — MEDIUM: `WEBHOOK_SECRET` exposed in Railway access logs via URL query param

**File:** `backend/src/modules/webhooks/whatsapp.routes.ts`, lines 172–178  
**What it is:**

The WhatsApp webhook and leads endpoint authenticate via a shared secret in the URL query string:

```typescript
app.post('/webhooks/whatsapp', ..., async (request, reply) => {
  const { token } = request.query as { token?: string }
  if (!process.env.WEBHOOK_SECRET || token !== process.env.WEBHOOK_SECRET) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
```

Fastify is configured with `logger: true` (`server.ts` line 50). Pino logs the full request URL, including query parameters, for every incoming request. Every inbound Z-API webhook produces a log line similar to:

```
{"url":"/webhooks/whatsapp?token=prod_secret_value","method":"POST",...}
```

This appears in Railway's log output, accessible to anyone with Railway project access.

**Impact:** Anyone who can read Railway logs extracts `WEBHOOK_SECRET` and can forge WhatsApp webhook events. A forged event can inject arbitrary "inbound messages" from any phone number into the AI conversation pipeline, modify lead capture records, and trigger Z-API outbound messages to arbitrary numbers (since the handler calls `zapiSend` based on the forged payload).

**Fix (immediate):** Suppress URL logging on the two affected routes:

```typescript
app.post('/webhooks/whatsapp', {
  config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
  logLevel: 'warn',  // suppresses info-level request logging (URL stays out of logs)
}, async (request, reply) => { ... })

app.get('/webhooks/leads', {
  logLevel: 'warn',
}, async (request, reply) => { ... })
```

**Fix (proper):** Move the token to the `Authorization` header. Configure Z-API to send `Authorization: Bearer <secret>` on its webhook deliveries, and update the handler:

```typescript
const authHeader = request.headers['authorization'] as string | undefined
const token = authHeader?.replace('Bearer ', '').trim()
if (!process.env.WEBHOOK_SECRET || token !== process.env.WEBHOOK_SECRET) {
  return reply.status(401).send({ error: 'Unauthorized' })
}
```

---

### FINDING 5 — MEDIUM: Rate-limit bypass via attacker-controlled `x-forwarded-for`

**File:** `backend/src/server.ts`, lines 53–59  
**What it is:**

```typescript
app.register(rateLimit, {
  global: true,
  max: 120,
  timeWindow: '1 minute',
  keyGenerator: (req) => (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip,
```

The rate limiter keys on the *first* IP in `x-forwarded-for`. When Railway's reverse proxy appends its own entry, the header becomes `<client-supplied>, <railway-added>`. Using `.split(',')[0]` takes the client-supplied value, which is fully attacker-controlled. An attacker rotates `x-forwarded-for: 1.2.3.4`, `x-forwarded-for: 5.6.7.8`, etc. on successive requests to avoid any per-IP counter.

**Impact:** All rate limits are bypassable. The most sensitive implication: brute-force or enumeration attacks against the authentication endpoints (which use the same global rate limit) are not effectively rate-limited.

**Fix:** Use the last IP in the chain, which Railway appends and the client cannot spoof:

```typescript
keyGenerator: (req) => {
  const xff = req.headers['x-forwarded-for'] as string | undefined
  if (xff) {
    const ips = xff.split(',').map(ip => ip.trim()).filter(Boolean)
    return ips[ips.length - 1] || req.ip
  }
  return req.ip
},
```

---

### FINDING 6 — MEDIUM: TOCTOU race condition in `updateOrderStatus`

**File:** `backend/src/modules/orders/orders.service.ts`, lines 305–337  
**What it is:**

The function reads the current order status in one query, validates the transition, then writes the new status in a separate query with no guard on the current state:

```typescript
// Query 1: read current state
const existing = await prisma.order.findUnique({ where: { id }, ... })
const allowed = VALID_TRANSITIONS[existing.status] ?? []
if (!allowed.includes(status)) throw new Error(...)

// Query 2: write — no WHERE clause enforcing current state
const updated = await prisma.order.update({ where: { id }, data: { status, ... } })
```

Between the two queries, another concurrent request can change the order status. Two concurrent `CONFIRMED` requests from the same GM both read `PENDING`, both pass validation, and both execute the update. The state machine constraint is violated and all post-update side effects (confirmation emails, push notifications, WhatsApp messages) fire twice.

**Impact:** Duplicate customer-facing notifications at current scale. As traffic increases post-launch, the probability of concurrent hits on the same order grows. Depending on future business logic added to the completion and cancellation paths, data integrity consequences can compound.

**Fix:** Replace the two-query pattern with a single atomic conditional update:

```typescript
// Capture current status before update for validation
const existing = await prisma.order.findUnique({ where: { id }, include: { grillmaster: { select: { userId: true } } } })
if (!existing) throw new Error('Pedido nao encontrado')
// ... (run all validation checks against existing) ...

// Single atomic conditional write — only succeeds if status hasn't changed since we read it
const result = await prisma.order.updateMany({
  where: { id, status: existing.status },  // guard on current state
  data: { status, ...(statusDetailMap[status] ? { statusDetail: statusDetailMap[status] } : {}) },
})

if (result.count === 0) {
  throw new Error('Estado do pedido foi modificado concorrentemente — tente novamente')
}

const updated = await prisma.order.findUnique({
  where: { id },
  include: { customer: true, grillmaster: { include: { user: { select: { name: true } } } } },
})
```

---

### FINDING 7 — LOW: `eventHours` has no upper bound

**File:** `backend/src/modules/orders/orders.service.ts`, line 27  
**What it is:**

```typescript
eventHours: z.number().int().min(1).default(4),
```

No `max()` constraint. A user can submit `eventHours: 99999`, creating an order with a total price inflated by the GM's hourly rate times the absurd hours value. This produces anomalous records that pollute fraud detection signals (`detectSuspiciousOrder` checks `pricePerGuest` but not `eventHours` range) and creates confusion in the admin dashboard and payout calculations.

**Fix:**

```typescript
eventHours: z.number().int().min(1).max(24).default(4),
```

---

### FINDING 8 — LOW: `generatePayouts` uses current GM `pricePerHour`, not the rate at time of order

**File:** `backend/src/modules/admin/payouts/payouts.service.ts`, lines 105–110  
**What it is:**

```typescript
const laborGross = order.grillmaster
  ? +(order.grillmaster.pricePerHour * order.eventHours).toFixed(2)
  : 0
```

`pricePerHour` is the GM's current rate from the live `Grillmaster` row. If the GM raises their hourly rate after completing an order but before `generatePayouts` runs, the payout is calculated at the new (higher) rate — paying out more than what was charged to the customer's `totalPrice`. The inverse is also true.

**Impact:** Financial discrepancy between revenue collected and payouts disbursed. Creates an audit trail inconsistency where payout amounts don't reconcile against the charged `totalPrice`.

**Fix:** Snapshot the labor gross at order completion time. Either store `laborGrossAtCompletion` on the `Order` model when status transitions to `COMPLETED`, or compute it as `totalPrice - itemsTotal` and store that. Then use the snapshotted value in `generatePayouts`:

```typescript
// At order completion, store the labor amount
await prisma.order.update({
  where: { id },
  data: {
    status: 'COMPLETED',
    laborGross: +(grillmaster.pricePerHour * order.eventHours).toFixed(2),
  },
})

// In generatePayouts, use the stored value
const laborGross = order.laborGross ?? 0
```

---

## What Is Working Well

These controls are correctly implemented and should not be changed:

- **HMAC validation uses `timingSafeEqual`.** The signature verification in `verifyMPSignature` uses constant-time comparison, preventing timing-oracle attacks on the HMAC.
- **Payment webhook is idempotent.** `updateMany({ where: { paymentStatus: { not: 'PAID' } } })` is a single atomic database operation. A replayed `approved` webhook cannot cause a double-payment — the guard fails on the second call.
- **Product prices are never trusted from the client.** `priceMap` is built from DB records; the client-supplied quantity is accepted but the unit price is always DB-authoritative.
- **Coupon race condition is correctly handled.** The `$transaction` with `isolationLevel: 'Serializable'` and a re-read inside the transaction prevents concurrent coupon overuse.
- **Admin and payout routes are properly protected.** Both `app.authenticate` (JWT) and `requireAdmin` (role check) are registered as `preHandler` hooks on the admin route group. There are no admin endpoints that bypass this chain.
- **Payout generation has idempotency.** The `existingSet` check on `orderId:type` prevents duplicate `Payout` records from being created on repeated calls to `generatePayouts`.
- **Secrets are absent from the payment log path.** `MP_ACCESS_TOKEN` and `MP_WEBHOOK_SECRET` are not passed to `console.log` or `console.error` anywhere in the payment service or controller.
- **Startup hard-fails on missing payment secrets.** `server.ts` calls `process.exit(1)` if `MP_WEBHOOK_SECRET` or `MP_ACCESS_TOKEN` are not configured, preventing the server from running in an insecure state.

---

## Fix Priority for Launch (06/07/2026)

| Priority | Finding | Effort |
|----------|---------|--------|
| Fix before launch | F2 — webhook replay window | Trivial — 6 lines added to `verifyMPSignature` |
| Fix before launch | F3 — updateOrderStatus auth bypass | Trivial — 3-line guard at function top |
| Fix before launch | F4 — WEBHOOK_SECRET in logs | Trivial — add `logLevel: 'warn'` to two routes |
| Fix before launch | F1 — gmAccompaniments price manipulation | Medium — remove feature from MVP or add DB model |
| Fix within 30 days | F5 — rate limit bypass | Trivial — one-line change to keyGenerator |
| Fix within 30 days | F6 — TOCTOU in status update | Medium — query restructure |
| Fix within 30 days | F7 — eventHours no max | Trivial — `.max(24)` in schema |
| Backlog | F8 — payout rate snapshot | Medium — schema migration required |
