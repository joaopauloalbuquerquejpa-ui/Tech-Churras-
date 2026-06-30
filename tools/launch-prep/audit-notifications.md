# Audit: Notification Systems — Launch Readiness
**Date:** 2026-06-30
**Scope:** Email (Resend), Push (VAPID/web-push), WhatsApp (Z-API)
**Files audited:**
- `backend/src/modules/email/email.service.ts`
- `backend/src/modules/push/push.service.ts`
- `backend/src/modules/push/push.routes.ts`
- `backend/src/modules/webhooks/whatsapp.routes.ts`
- `backend/src/modules/orders/orders.service.ts`
- `backend/src/modules/payments/payments.service.ts`
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/cron/cron.routes.ts`
- `frontend/src/hooks/usePushNotifications.ts`
- `frontend/src/app/(dashboard)/layout.tsx`
- `frontend/public/sw.js`

---

## 1. Coverage Matrix — Order Lifecycle Events

Legend: ✅ fires | ⚠️ conditional (requires phone/push subscription) | ❌ missing

### Event: ORDER CREATED (status = PENDING)

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| Customer  | ❌    | ❌   | ❌       |
| GM        | ✅ `emailNewOrderGrillmaster` | ✅ | ⚠️ requires `gm.user.phone` |
| Boutique  | ❌    | ✅   | ⚠️ requires `boutique.user.phone` |
| Admin     | ❌    | ✅ (all admins) | ✅ |

**Gap:** Customer receives zero notification at order creation. They learn their order exists only after payment. At minimum, a push or email confirming the order was placed would reduce drop-off and support inquiries.

---

### Event: PAYMENT CONFIRMED → status CONFIRMED (primary path: MP webhook in `payments.service.ts`)

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| Customer  | ✅ `emailOrderConfirmed` | ✅ | ❌ |
| GM        | ❌    | ✅ ("Pagamento confirmado") | ❌ |
| Boutique  | ❌    | ❌   | ❌ |
| Admin     | ❌    | ❌   | ✅ |

**Critical Gap:** The boutique receives NOTHING when the order is confirmed via payment webhook. The "prepare the cuts" WhatsApp message (`order-confirmed-boutique`) is inside `updateOrderStatus('CONFIRMED')` in `orders.service.ts`, but this function is never called by the payment webhook. The webhook uses `prisma.order.updateMany()` directly. After payment sets the order to CONFIRMED, no subsequent call to `updateOrderStatus('CONFIRMED')` can succeed (atomic WHERE check finds no PENDING rows). The boutique only got a push at order creation (PENDING). They never get a "payment confirmed, prepare now" signal. This is a real operational gap for launch.

**Secondary path (admin manual confirm via `updateOrderStatus`):** Boutique DOES get WA in this path. But this path is never reached for normal MP-paid orders.

---

### Event: IN_PROGRESS (GM arrived at event)

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| Customer  | ❌    | ⚠️ only if GM separately calls `updateOrderStatusDetail('Churrasqueiro a caminho')` | ❌ |
| GM        | ❌    | ❌   | ❌ |
| Boutique  | ❌    | ❌   | ❌ |
| Admin     | ❌    | ❌   | ❌ |

**Gap:** The `updateOrderStatus` function has NO notification block for the IN_PROGRESS transition. A customer push only fires if the GM uses `updateOrderStatusDetail` with the exact string `'Churrasqueiro a caminho'` — a separate, optional call. If the GM transitions to IN_PROGRESS via the status update route without also updating the statusDetail, the customer receives no notification that their churrasqueiro has arrived.

---

### Event: COMPLETED

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| Customer  | ✅ `emailOrderCompleted` (review request) | ✅ (review prompt) | ⚠️ requires `customer.phone` |
| GM        | ❌    | ✅ ("Avalie o cliente") | ❌ |
| Boutique  | ❌    | ❌   | ❌ |
| Admin     | ❌    | ❌   | ✅ |

Well-covered for customer. Boutique receives no completion signal (acceptable — their role is done before IN_PROGRESS). GM gets no WhatsApp on completion.

---

### Event: CANCELLED

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| Customer  | ❌    | ⚠️ only if GM cancelled | ❌ |
| GM        | ❌    | ⚠️ only if customer cancelled | ❌ |
| Boutique  | ❌    | ❌   | ❌ |
| Admin     | ❌    | ❌   | ✅ |

**Gaps:**
- No email template exists for cancellation. If push is not subscribed, the affected party gets zero notification.
- If admin cancels: NEITHER customer NOR GM receives any push. The `cancelledBy === 'CUSTOMER'` and `'GRILLMASTER'` checks in `cancelOrder` both fail for admin cancellations.
- Boutique is never notified of cancellation. If they received the initial "new order" notification and began preparation, they have no signal to stop.
- No WhatsApp to customer or GM on cancellation (only push).

---

### Event: REFUNDED / CHARGEBACK (via MP webhook, `payment.status` = `refunded` / `charged_back` / `in_mediation`)

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| Customer  | ❌    | ❌   | ❌ |
| GM        | ❌    | ❌   | ❌ |
| Admin     | ❌    | ❌   | ✅ (chargeback alert) |

**Gap:** Customer is never informed of a chargeback or refund outcome. The order's `paymentStatus` is updated to a string like `DISPUTE_REFUNDED`, but no user-facing communication is sent.

---

### Event: RESCHEDULE (customer reschedules order date)

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| GM        | ❌    | ✅   | ❌ |
| Customer  | ❌    | ❌   | ❌ |
| Boutique  | ❌    | ❌   | ❌ |

Customer receives no acknowledgment of their own reschedule. Boutique is not told the date changed.

---

### Event: PARTNER APPROVED (GM or Boutique)

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| GM/Boutique | ✅ `emailPartnerApproved` | ✅ | ✅ (requires phone) |

Well-covered. All three channels fire.

---

### Event: PARTNER REJECTED

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| GM/Boutique | ❌ | ✅ (vague "Perfil em revisão" message) | ❌ |

Only a push with a generic message. No email. No WA. The push body says "Entre em contato com o suporte" but no contact info is provided.

---

### Event: NEW USER REGISTRATION (CUSTOMER role)

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| Customer  | ✅ `emailWelcomeCustomer` | ❌ | ❌ |
| Admin     | ❌    | ✅ (all admins) | ✅ |

---

### Event: NEW GRILLMASTER or BOUTIQUE REGISTRATION

| Recipient | Email | Push | WhatsApp |
|-----------|-------|------|----------|
| New partner | ❌ | ❌ | ❌ |
| Admin     | ❌    | ❌   | ❌ |

**Gap:** Admin is not notified when a new GM or boutique registers. The `registerUser` function only sends admin notifications for `role === 'CUSTOMER'`. Admin must proactively check the pending approvals panel. For launch, with the team relying on WhatsApp for all coordination, this is an operational blind spot.

---

## 2. Template Quality

All six email templates in `email.service.ts` contain real, production-ready content. No placeholder text (`[NAME]`, `TODO`, `Lorem ipsum`) detected.

**Specific findings:**

- `emailWelcomeCustomer` includes the coupon code `CHURRAS10` with "10% OFF no primeiro pedido." Verify this coupon exists in the database before launch — it is referenced in the template but was not found in any coupon-creation code path. If the coupon does not exist, new customers will be confused when the code fails.
- `emailOrderConfirmed` correctly references the `eventAddress` field. Verify this field is always populated before the email fires — if a customer omits the address, the email will show an empty string.
- `emailPartnerApproved` uses a hardcoded `dashUrl` passed as a parameter from `admin.service.ts` (`approveGrillmaster` and `approveBoutique`). Both callers pass the correct absolute URLs. No issue.
- `emailPasswordReset` mentions a 30-minute expiry. Confirm the actual JWT or token TTL used for reset links matches this claim.

---

## 3. Missing Recipient Cases (Silent Failures)

The following notification calls silently skip (no error, no fallback) when data is absent:

| Notification | Condition for silent skip |
|---|---|
| WhatsApp to customer on CONFIRMED | `updated.customer.phone` is null |
| WhatsApp to boutique ("Separe os cortes") | `o.boutique.user.phone` is null |
| WhatsApp to GM on new order | `gm.user.phone` is null |
| WhatsApp reminder 24h/48h | `order.customer.phone` is null → flag is still set to `true` so customer NEVER gets this reminder through any channel |
| Push to anyone | No active push subscription → silently no-ops in `sendPushToUser` |

**Specific concern with reminders:** In `cron.routes.ts`, when a customer has no phone, `sendWhatsAppReminder` is skipped. But `prisma.order.update({ data: { reminder24hSent: true } })` still executes. This means phoneless customers silently lose their only reminder — no email or push backup fires as a fallback.

---

## 4. WhatsApp Fallback (Z-API Down)

**Order flow: does NOT break.** All WhatsApp calls are fire-and-forget with `.catch(() => {})` or similar. Z-API errors are logged but not re-thrown. The order lifecycle continues normally.

**What is lost:** There is no retry mechanism, no queue, and no dead-letter store for failed WhatsApp messages. If Z-API is down for 5 minutes during a peak moment (new order + customer confirmation + boutique notification), all three WhatsApp messages for that order are permanently lost. No scheduled retry exists anywhere in the codebase.

**Five separate Z-API send implementations** exist across the codebase:
1. `sendWhatsAppToAdmin` in `push.service.ts`
2. `sendWhatsAppMessage` (module-private) in `orders.service.ts`
3. `zapiSend` in `whatsapp.routes.ts`
4. `sendWhatsApp` (module-private) in `admin.service.ts`
5. `sendWhatsAppReminder` (module-private) in `cron.routes.ts`

All five are functionally identical fetch calls. Any future reliability improvement (retry, circuit breaker, queue) would need to be applied to five locations. Not a launch blocker, but a maintenance risk.

---

## 5. Push Notification Permission Flow

**Where the prompt appears:** A `PushBanner` component renders at the top of the dashboard layout (`frontend/src/app/(dashboard)/layout.tsx`). It shows only when:
- `supported === true` (browser has SW + PushManager)
- `permission !== 'denied'`
- `permission !== 'granted'` (already have permission)
- `subscribed === false`

**When it fires:** Passively on any dashboard page visit after login. The user must click "Ativar notificacoes" — no automatic prompt. This is correct behavior (browsers require user gesture for `Notification.requestPermission()`).

**Gap 1 — Token race condition:** The `subscribe()` function in `usePushNotifications.ts` exits early if `localStorage` has no auth token (`if (!token) return`). A user who grants permission at the browser OS level but is not fully logged in will have the subscription registered in the service worker locally but never saved to the backend. They will never receive push notifications despite the browser showing "Notifications allowed." The banner would also not re-show since `permission === 'granted'` hides it.

**Gap 2 — No prompt before the first order.** Users who register and immediately start the order wizard see the push prompt only AFTER reaching a dashboard page. The wizard itself lives outside the dashboard layout. If a user completes an order via the wizard without ever visiting a dashboard page, they have no push subscription and will miss all order lifecycle notifications until they navigate to the dashboard.

**Gap 3 — Android Capacitor.** The push implementation uses Web Push (VAPID). Native Android push via Capacitor Push Notifications plugin is not present in any file reviewed. For the Android app on Play Store, Web Push works in browser but push behavior inside a Capacitor webview may differ. This requires device-level verification before Play Store submission.

**Service worker:** `public/sw.js` is minimal and correct. It handles `push`, `notificationclick`, and basic offline cache. The `renotify: true` flag in notification options means each push replaces the previous one with the same `tag` — which uses `data.url` as the tag, so different events on the same order will replace each other rather than stack. This is reasonable behavior.

---

## 6. Cron Reminder (`/cron/event-reminders`)

The cron runs hourly via cron-job.org using `x-cron-secret` header authentication.

**What it does:**
- Finds CONFIRMED orders with `eventDate` in the `[now+47h, now+49h]` window → sends WhatsApp 48h reminder to customer (if phone exists), marks `reminder48hSent = true`
- Finds CONFIRMED orders with `eventDate` in the `[now+23h, now+25h]` window → sends WhatsApp 24h reminder to customer (if phone exists), marks `reminder24hSent = true`
- Finds CONFIRMED orders in 24h window → sends push to GM (no deduplication flag)
- Calls `sendFollowUps()` for B2B boutique leads

**The 2-hour catch window (±1h) is correctly designed** to tolerate cron drift across hourly runs.

**Edge cases and gaps:**

1. **GM push reminder has no dedup flag.** The customer reminders use `reminder48hSent` and `reminder24hSent` flags. The GM push in the 24h block has no equivalent (`gmReminder24hSent` field does not exist). If the cron runs twice within the 24h-25h window (e.g., cron-job.org fires at :00 and :30), the GM receives two push notifications. Minor annoyance but fixable with a schema field.

2. **No customer push reminder.** Customer only gets WhatsApp at 24h and 48h. No push reminder is sent. If a customer has no phone, they get zero reminder through any channel (email or push).

3. **No email reminder.** No reminder email fires at any point. For customers without WhatsApp or without push, there is no 24h/48h reminder at all.

4. **No reminder for PENDING orders.** Only `status: 'CONFIRMED'` orders get reminders. Orders stuck in PENDING (created but not paid) get no reminder to complete payment. This is acceptable design since payment abandonment recovery is not in scope for launch.

5. **Cron sends B2B follow-ups every hour.** `sendFollowUps()` is called on every cron tick. The function queries `followUpAt <= now` and `followUpSent: false`, then marks `followUpSent: true` after sending. The flag prevents double-sends. After sending, it schedules the next follow-up 72h later (`followUpAt = now + 72h`, `followUpSent: false`). This creates a recursive follow-up loop for leads that never respond. There is no max-follow-up-count guard — a stale lead will receive a follow-up every 72 hours indefinitely.

---

## 7. Admin Notifications

### What admin receives:

| Event | Push | WhatsApp |
|---|---|---|
| New CUSTOMER registration | ✅ | ✅ |
| New order created | ✅ | ✅ |
| Payment confirmed (webhook) | ❌ | ✅ |
| Order completed | ❌ | ✅ |
| Order cancelled | ❌ | ✅ |
| Refund failure | ❌ | ✅ |
| Chargeback/dispute | ❌ | ✅ |
| Suspicious order (2+ fraud flags) | ❌ | ✅ |
| Daily summary (separate cron `/cron/daily-summary`) | ❌ | ✅ |
| QR code guest registration | ❌ | ✅ |
| New GM registration | ❌ | ❌ |
| New Boutique registration | ❌ | ❌ |
| GM approved/rejected | ❌ | ❌ |
| Boutique approved/rejected | ❌ | ❌ |

**Critical gap:** Admin receives NO notification (push or WhatsApp) when a new GM or boutique registers. During the launch period, fast partner approval is a competitive differentiator (pitch materials promise "quick onboarding"). If Jota is in Zanzibar and the admin panel is the only discovery mechanism, new partner applications can sit unreviewed indefinitely.

**Note:** Admin notifications use `sendWhatsAppToAdmin` which reads `ADMIN_WHATSAPP_PHONE` from env. Only one phone number is supported. If that env var is missing, all admin WhatsApp notifications silently skip.

---

## 8. Duplicate `emailOrderConfirmed` Risk

`emailOrderConfirmed` is imported and called in two places:
- `payments.service.ts` → `handleMPWebhook` (when payment status = `approved`)
- `orders.service.ts` → `updateOrderStatus('CONFIRMED')`

In normal flow (MP payment), the webhook fires first and sets the order to CONFIRMED via `updateMany`. Any subsequent call to `updateOrderStatus('CONFIRMED')` fails on the atomic WHERE clause (`WHERE status = PENDING` returns 0 rows), preventing double execution. The duplicate is theoretically safe. However, if an admin manually calls `updateOrderStatus('CONFIRMED')` on an order already set to CONFIRMED by the webhook, it would fail with an exception. The customer does not receive a duplicate email. Low risk, but the two code paths should be reconciled post-launch.

---

## Summary: Ranked by Launch Impact

| # | Finding | Severity | Channel(s) |
|---|---------|----------|------------|
| 1 | Boutique never notified when payment confirms order (primary flow) | HIGH | WhatsApp |
| 2 | Admin not notified of new GM/boutique registrations | HIGH | Push, WhatsApp |
| 3 | IN_PROGRESS status change fires no automatic customer notification | MEDIUM | Push, Email, WhatsApp |
| 4 | CANCELLED by admin: neither customer nor GM is notified | MEDIUM | Push |
| 5 | Customers with no phone lose 24h/48h reminder silently (flag still set) | MEDIUM | WhatsApp |
| 6 | Push permission banner not shown during order wizard; may miss users pre-subscription | MEDIUM | Push |
| 7 | Chargeback/refund: customer receives zero notification | MEDIUM | Email |
| 8 | No cancellation email template (push only; fails silently if not subscribed) | MEDIUM | Email |
| 9 | `CHURRAS10` coupon in welcome email — existence in DB unverified | MEDIUM | Email |
| 10 | GM push reminder (24h) has no dedup flag — hourly cron may double-send | LOW | Push |
| 11 | B2B follow-up loop has no max-count guard — leads receive indefinite messages | LOW | WhatsApp |
| 12 | Five separate Z-API send implementations — no single retry point | LOW | WhatsApp |
| 13 | Guest users (QR code path) receive no welcome email | LOW | Email |
| 14 | Partner rejected: only push with vague message, no email or WhatsApp | LOW | Email |
| 15 | Rescheduled order: customer gets no acknowledgment, boutique not notified | LOW | Push, WhatsApp |
