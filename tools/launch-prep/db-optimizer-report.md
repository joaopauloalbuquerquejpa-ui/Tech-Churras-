# DB Optimizer Report — Tech Churras
Generated: 2026-06-29 | Scope: schema.prisma + orders/grillmasters/boutiques/admin services

---

## 1. Queries Missing Covering Indexes

| Table | Columns Queried (without index) | Query Location |
|---|---|---|
| `KitChurrasco` | `boutiqueId` | `getKitsByBoutique`, `updateKit`, `deleteKit` |
| `User` | `referredByBoutiqueId` | `getBoutiqueReferralStats`, `getBoutiqueDashboardStats`, `getBoutiqueReferralStats (admin)` |
| `Message` | `orderId + senderId + read` (only `orderId` indexed) | `listOrders` — groupBy with `read = false` filter |
| `Address` | `userId` | No FK index; lookup by user will seq-scan |
| `PointsRedemption` | `userId` | No FK index |
| `Contract` | `partnerId, partnerType` | No index on either lookup column |
| `Boutique` | `open` (composite `[city,state,approved]` lacks `open`) | `findNearbyBoutiques` filters `{ approved: true, open: true }` |

---

## 2. N+1 and Over-Query Patterns

**Full-table scans disguised as filtered queries (highest risk at scale):**

- `recommendGrillmasters` and `findNearbyGrillmasters` both call `prisma.grillmaster.findMany({ where: { available: true, approved: true } })` with no `take` limit, then filter by distance in JS. At 1 000 GMs this loads the full table on every wizard step.
- `listBoutiques` has no pagination (`take`/`skip`). It fetches every matching boutique on every public listing call. The existing `@@index([city, state, approved])` helps with DB filtering but the result set is unbounded.
- `findNearbyBoutiques` does `include: { products: { where: { available: true } } }` — all products for all boutiques loaded to filter by GPS distance in JS. Should filter by bounding-box in SQL first.

**Repeated 2-query pattern for GM identity resolution (not an N+1, but redundant):**

The pattern `grillmaster.findUnique({ where: { userId } })` then `order.findFirst({ where: { grillmasterId: gm.id } })` appears in 6 places: `updateOrderStatusDetail`, `updateOrderLocation`, `getOrderEta`, `cancelOrder`, `getOrderById`, `getMyGrillmasterOrders`. Each costs an extra round-trip. Could be collapsed via a nested Prisma `where` using the `user` relation.

**Redundant query on status CONFIRMED:**

`updateOrderStatus` (orders.service.ts ~line 387) fetches `order.findUnique` again after `order.update` to get boutique phone for WhatsApp. The boutique can be included in the original `update` call's `include`.

---

## 3. Top 3 Highest-Impact Index Additions

### #1 — KitChurrasco: missing FK index (HIGH)

Every boutique dashboard load, kit list page, and kit mutation hits this without an index.

```prisma
model KitChurrasco {
  // ...existing fields...

  @@index([boutiqueId])
}
```

### #2 — User: referredByBoutiqueId (MEDIUM-HIGH)

Two dashboard queries (`getBoutiqueDashboardStats`, `getBoutiqueReferralStats`) count users by this column. As the user table grows with paid-ad traffic, this becomes a full seq-scan on the largest table in the database.

```prisma
model User {
  // ...existing fields...

  @@index([referredByBoutiqueId])
}
```

### #3 — Message: composite for unread groupBy (MEDIUM)

`listOrders` runs `message.groupBy({ by: ['orderId'], where: { orderId: { in: [...] }, senderId: { not: customerId }, read: false } })`. The existing `@@index([orderId])` only covers the first predicate. Adding `read` to the index lets Postgres skip already-read messages at the index level, which matters as chat volume grows.

```prisma
model Message {
  // ...existing fields...

  @@index([orderId, read])
}
```

---

## 4. Over-fetching — Add `select` to These Queries

| Location | Problem | Fix |
|---|---|---|
| `getOrderById` — `grillmaster: { include: { user: true } }` | Fetches the full `User` row including `password` hash | `select: { name: true, email: true, phone: true }` |
| `listOrders` — `grillmaster: { include: { user: true } }` | Same as above, called on every customer dashboard load | Same `select` |
| `getOrderById` — `boutique: true` | Returns `pixKey`, `commissionRate`, `monthlyFee` to the customer frontend | `select: { id, name, rating, city, logoUrl }` |
| `listOrders` — `items: { include: { product: true } }` | Fetches all product columns including `imageUrl`, `discountValidUntil`, `stockQuantity` per item | `select: { id, name, price, unit, category }` |
| `createOrder` return — `grillmaster: { include: { user: true } }, boutique: true` | Same pattern; the created-order response should not expose internal finance fields | Scoped `select` on both relations |
| `getBoutiqueProductsHandler` | Calls `getBoutiqueById(id)` (which also loads the full boutique row) and returns only `.products` | Add a dedicated `prisma.product.findMany({ where: { boutiqueId: id, available: true } })` query |

---

## Migration SQL (apply via `prisma db push` or a migration file)

```sql
-- Run all CONCURRENTLY to avoid table locks in production
CREATE INDEX CONCURRENTLY IF NOT EXISTS "KitChurrasco_boutiqueId_idx"
  ON "KitChurrasco"("boutiqueId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "User_referredByBoutiqueId_idx"
  ON "User"("referredByBoutiqueId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Message_orderId_read_idx"
  ON "Message"("orderId", "read");
```

Add these to `schema.prisma` first, then run `prisma migrate dev` (local) or `prisma db push` (Railway). All three are safe to apply on a live database with zero downtime.

---

## Priority Order for Launch (06/07)

1. `KitChurrasco(boutiqueId)` — add before first boutique onboarding
2. `User(referredByBoutiqueId)` — add before referral link activation
3. `Message(orderId, read)` — add before chat goes live under paid traffic
4. `select` fixes on `getOrderById` / `listOrders` — security hygiene (password hash leak) + payload size
5. Pagination on `listBoutiques` and distance-first filtering in `findNearbyBoutiques` — defer to post-launch once GM/boutique count > 20
