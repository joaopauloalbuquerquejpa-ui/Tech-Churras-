# Audit: Admin Dashboard & Operational Flows
**Date:** 2026-06-30
**Scope:** Admin panel, boutique dashboard, GM dashboard, backend admin/payouts services
**Files read:**
- `frontend/src/app/(dashboard)/admin/page.tsx`
- `frontend/src/app/(dashboard)/admin/repasses/page.tsx`
- `frontend/src/app/(dashboard)/boutiques/page.tsx`
- `frontend/src/app/(dashboard)/boutiques/dashboard/page.tsx` (lines 1–1242)
- `frontend/src/app/(dashboard)/grillmasters/page.tsx`
- `frontend/src/app/(dashboard)/grillmasters/dashboard/page.tsx` (lines 1–1308)
- `backend/src/modules/admin/admin.routes.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/admin/payouts/payouts.controller.ts`
- `backend/src/modules/admin/payouts/payouts.service.ts`

---

## 1. Admin Capabilities

### What is present and working

The admin panel is a single-page dashboard with 8 tabs:

| Tab | Function |
|---|---|
| Resumo | KPIs (today + all-time), Z-API health widget, links to repasses and onboarding script |
| Pedidos | Expandable order list with full detail; status dropdown to change order state |
| Pendentes | Approve/reject GMs (with chancela toggle, pricePerHour override, uniform-sent flag) and boutiques |
| Financeiro | Revenue summary calculated client-side from the orders list; link to repasses |
| Contratos | Read-only list of all partner contracts with full-text viewer |
| Minha Equipe | Edits profile and availability calendar for the Team Jota GM specifically (hardcoded by certificationCode TC-FUNDADOR-001) |
| Leads | Lead list with status transitions and direct WhatsApp links |
| Metricas IA | On-demand: conversion funnel, top GMs, revenue by day, AI demand forecast |

Backend routes that exist but have no admin UI:
- `GET /admin/users` + `PATCH /admin/users/:userId/block` — user listing and blocking
- `GET /admin/coupons` + `POST /admin/coupons` + `PATCH /admin/coupons/:id` — full coupon CRUD
- `PATCH /admin/orders/:orderId/mark-paid` — manual payment confirmation
- `GET /admin/boutiques/:boutiqueId/referrals` — per-boutique referral stats

### Missing admin capabilities — Day-1 critical

**[Critical] No coupon management UI.** The backend has a complete create/list/toggle coupon system. If you want to create a launch promo code (e.g. TECHCHURRAS10) you have to POST to the API directly. There is no admin frontend for this at all.

**[Critical] No subscription tier tracking.** The business model defines Açougue Fundador (R$369/mês, up to 5 slots, 1 per region) vs. Açougue Padrão (R$497/mês). Neither concept exists in the data model or admin UI. There is no field marking a boutique as founder-tier, no cap enforcement, and no monthly fee payment tracking. The admin has no way to know which boutiques owe what or who has paid.

**[High] No user management tab.** The `blockUser` endpoint and `listUsers` service exist but there is zero UI. If an abusive account needs to be banned, the admin has to call the API directly.

**[High] No manual mark-paid button in orders UI.** The backend has `markOrderPaid` which sets status to COMPLETED and paymentStatus to PAID. The admin orders tab only exposes a status dropdown — no "Marcar como pago" button. Edge cases like test payments or manual arrangements have no resolution path from the UI.

**[High] No contract generation from admin.** Admin can read all contracts but cannot generate one for a new partner. This step presumably happens outside the platform or via a separate flow not covered here.

**[High] No refund/cancellation management.** There is no Mercado Pago refund trigger anywhere in the admin panel. A cancelled paid order has no resolution path.

**[Medium] No way to edit a boutique's profile post-approval.** Admin can edit GM profiles (via the "Minha Equipe" tab for Team Jota, or via the approval form). There is no equivalent for boutiques. If a boutique submits wrong info, rejection and re-registration is the only path.

**[Medium] No order search or filter.** The orders tab fetches up to 200 orders sorted by `createdAt desc` with no search, no status filter, and no date range. Finding one specific order in 200 means manual scrolling.

**[Medium] No payout Pix key editor for partners.** If a boutique or GM has no pixKey set (shows "—" in repasses), the admin cannot set it from the panel. The partner must update their own profile, assuming that field is editable in their dashboard (not confirmed from the files read).

**[Low] "Minha Equipe" tab is hardcoded to one person.** It finds the GM by `certificationCode === 'TC-FUNDADOR-001'`. Fine for today, but the tab name suggests it should eventually manage the whole field team.

---

## 2. Boutique Onboarding Flow

### Flow steps

1. Boutique user registers account and navigates to `/boutiques/new` (self-service)
2. Boutique submits profile — stored with `approved: false`
3. Admin sees them in the "Pendentes" tab and clicks Aprovar or Reprovar
4. On approval: `approved = true`, `referralCode` generated, `trialEndsAt = today + 60 days`, push + WhatsApp + email sent to boutique
5. Boutique logs in, adds products and kits, toggles store open — all self-service
6. Boutique receives and processes orders (accept/reject/ready) — all self-service

This flow works end-to-end. The boutique dashboard is polished and includes a step-by-step onboarding checklist.

### Issues

**[Critical] Trial period is hardcoded to 60 days for all boutiques.** The CLAUDE.md specifies 3 months (approximately 90 days) for founder boutiques. The `approveBoutique` service sets `trialEndsAt = today + 60 days` unconditionally. A founder boutique approved on July 6 gets a trial ending September 4, not October 6. The 30-day founder window (06/07–06/08) makes this especially visible if the first boutique is approved on day 1.

**[Critical] Subscription payment after trial is not integrated.** When `trialEndsAt` passes, the boutique dashboard shows a red banner with a `mailto:techchurras@gmail.com` link as the subscribe action. There is no payment link, no Mercado Pago subscription, no automatic charge. The revenue from R$369/mês or R$497/mês has to be collected manually with zero in-product support.

**[High] No founder-tier differentiation.** There is no `isFounding` flag or `monthlyFee` field on the Boutique model (based on what's visible in the dashboard interface). The admin has no way to enforce the 5-slot, 1-per-region-in-SP founder rule, or to set whether a boutique pays R$369 vs. R$497.

**[Medium] Admin receives no alert when a new boutique registers.** The pendentes tab shows a count badge, but only if admin visits the page. There is no push notification or WhatsApp message to the admin when a boutique submits. In a remote-launch scenario from Zanzibar, approval latency may exceed the 24h promise shown to the boutique.

**[Medium] Reject message is generic.** Rejection sends a push: "Precisamos de mais informações sobre seu açougue. Entre em contato com o suporte." There is no field for the admin to specify what is missing. WhatsApp rejection message is not sent (only push + email).

---

## 3. GM Onboarding Flow

### Flow steps

1. GM registers account at `/grillmasters/new` (self-service)
2. Submits profile — stored with `approved: false`
3. Admin sees in "Pendentes" tab; can toggle Chancela Jota, set pricePerHour, mark uniform sent, check training completion
4. Admin clicks Aprovar — GM gets push + WhatsApp + email, status set to available
5. GM accesses full dashboard: events, schedule, profile, training, financeiro tabs

The GM dashboard is comprehensive. The training module flow, GPS tracker, and availability calendar are all functional.

### Issues

**[High] Training videos are placeholder URLs.** The four training modules in the GM dashboard link to `https://youtube.com/watch?v=PLACEHOLDER_MODULO_1` through `PLACEHOLDER_MODULO_4`. If a GM tries to complete training before launch, they get broken links. The admin training-completeness check (`g.trainingModules?.length === 4`) will therefore always show false for real GMs.

**[High] No admin notification on new GM submission.** Same issue as boutiques — admin must proactively check the Pendentes tab.

**[Medium] Rejection has no reason field.** Reject GM sends a push but no WhatsApp, and there is no free-text field for the admin to specify what needs improvement.

**[Medium] Uniform-sent is a one-way flag with no context.** Once marked, it cannot be un-marked from the UI. There is no way to record the tracking code or date of shipment beyond `uniformSentAt`.

**[Low] pricePerHour override at approval is a footgun.** The approval form lets the admin override the GM's self-declared pricePerHour. If set to 0 by mistake, the GM will have zero earnings calculated in payouts. There is no validation or confirmation step.

---

## 4. Lead Management

### What works

- Leads from the WhatsApp bot are auto-populated (bot writes to `prisma.lead`)
- Each lead shows: name, boutique name, neighborhood, phone, status, follow-up sent flag, created-at timestamp
- Status transitions (new → qualified → contacted → converted → dead) work inline
- Direct WhatsApp link per lead opens `wa.me/55{phone}`
- 200-lead cap with `orderBy: createdAt desc`

### Issues

**[High] Source is stored but not displayed or filterable.** The `Lead` interface in the frontend includes a `source` field. It is not rendered in any column or filter in the UI. When the field team starts logging leads (possibly via a separate intake form or manual entry), there will be no way to distinguish "WhatsApp bot lead" from "field team lead" from the admin panel.

**[High] No search by name or phone.** As lead volume grows past 200, finding a specific boutique by name requires knowing it is in the top 200 by creation date. There is no search input.

**[Medium] Hard cap of 200 records.** `prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })` — after 200 leads, older ones are invisible. No pagination exists.

**[Medium] No "notes" or free-text field per lead.** Field reps doing in-person visits will have context (owner name, best call time, specific objection) that cannot be logged.

**[Low] Follow-up sent flag is read-only.** The `followUpSent` field is displayed but there is no way to trigger or re-trigger a follow-up from the admin UI.

**[Low] Migrate trialEndsAt button is exposed in the Leads tab.** This is a one-off maintenance migration action (`POST /admin/migrate/trial-ends-at`) that has a `confirm()` dialog and lives in the Leads tab header. Misfire risk is low given the confirm, but it is out of place and should not be visible post-migration.

---

## 5. Payout Flow

### What works

- `POST /admin/payouts/generate` processes all COMPLETED + PAID orders, computes GM labor payout (93% of pricePerHour × eventHours) and boutique product payout (90% of order items total), deduplicates by order+type pair
- Payout list shows: recipient, type, period, gross, commission, net, Pix key, status
- Status and type filters
- Per-payout "Marcar como Pago" button
- Running total of pending liquid amount at table footer

### Issues

**[Critical] No actual payment execution.** Clicking "Marcar como Pago" only updates a database record. The actual Pix transfer must be done manually outside the platform (banking app, Pix portal, etc.). There is no Pix API integration, no batch payment file, and no confirmation that the transfer succeeded. The operational risk is marking a payout as paid before the money actually moves.

**[Critical] Missing Pix key for partners shows silently.** Partners without a `pixKey` show "—" in the Pix column. The generate action still creates the payout record. At payment time, the admin has no Pix key to send to and no in-panel way to obtain or set one. This will block every payout for any partner who skipped the Pix field during onboarding.

**[High] "Comissão da Plataforma (15%)" label is wrong.** The repasses page summary card labels the retained commission as "15%". The actual rates are 7% (GM labor) and 10% (boutique products), applied separately per payout. The arithmetic is correct per payout record, but the label creates confusion when explaining finances to a partner or auditing internally.

**[High] Payout summary scope is current week only.** `getPayoutsSummary()` uses `getWeekBounds()` relative to today. If you generate payouts mid-week or review on a Monday, the summary will undercount or exclude last week's payouts. The list view is unaffected (no date filter), but the summary cards are misleading.

**[High] Boutique subscription revenue is entirely absent.** Monthly fees (R$369 or R$497) are not tracked in any database table visible here. The payout system is order-commission-only. There is no reconciliation between subscription revenue owed and received.

**[Medium] No filter by date range in payout list.** The UI has status and type filters only. To see all payouts from a specific week, admin would need to call the API directly with `weekStart` param, which the UI does not expose.

**[Medium] Generate payouts has no idempotency guard in the UI.** Clicking the button twice rapidly in the same session would not cause duplicates (the service checks `existingSet`), but the success message only shows what was created in that call — not the full picture of pending payouts.

**[Low] No payout history per partner.** There is no way to see all historical payouts for a single GM or boutique from the admin panel.

---

## 6. Dashboard Metrics

### Visible on the stats tab (always loaded)

- Today: orders, revenue, new users, active orders
- All-time: total orders, users, GMs, boutiques, total revenue
- Last 7 days revenue
- Z-API health indicator

### Visible in Metricas IA tab (on-demand)

- Conversion funnel: total → confirmed → completed (with %)
- Revenue by day (last 30 days — computed only for COMPLETED orders)
- Orders by hour of day (last 30 days)
- Top 5 GMs by total orders and acceptance rate
- AI narrative summary (Claude Haiku)
- 14-day demand forecast by day of week
- Orders by day of week (90-day window)

### Missing metrics — critical for a founder monitoring launch

**[High] No approved vs. pending split on GMs and boutiques.** The stats show `totalGrillmasters` and `totalBoutiques` as simple counts of all records regardless of approval status. On launch day, knowing "2 boutiques approved, 4 pending" is more actionable than "6 boutiques."

**[High] No leads KPI on the main stats tab.** Total leads and leads-by-status are visible only by switching to the Leads tab and counting. The stats resumo has no leads widget.

**[High] No revenue breakdown by source.** Total revenue is a single number. There is no split between GM labor commissions, boutique product commissions, and subscription fees. At launch, these are all zero — but the inability to distinguish them becomes important by week 2.

**[Medium] No average order value.** Not shown anywhere in the UI.

**[Medium] No viral referral funnel.** Boutique referral counts exist in the API (`getBoutiqueReferralStats`) but are not visible anywhere in the admin stats. The referral program is a primary GTM lever and should have its own widget (total referrals, conversion rate, pending bonus pool).

**[Medium] No cancellation rate.** Orders with status CANCELLED exist but there is no cancellation rate metric or analysis of cancellation reasons.

**[Low] Revenue metric on the Financeiro tab is recalculated client-side from the orders list.** If the orders list is capped at 200, the financeiro tab revenue totals will be wrong for any deployment that has more than 200 orders. The `/admin/stats` endpoint calculates server-side against the full dataset, but the Financeiro tab ignores it.

---

## Summary Priority Matrix

| Finding | Priority | Affects Day-1? |
|---|---|---|
| No coupon management UI (backend exists) | Critical | Yes — launch promo needs a code |
| Trial period hardcoded to 60d, not 90d for founders | Critical | Yes — first boutique approved July 6 |
| Subscription payment not integrated (mailto only) | Critical | Yes — revenue model depends on it |
| No actual Pix payment execution in payout flow | Critical | Yes — first payout after launch |
| Missing Pix key blocks payout with no recovery path | Critical | Yes — any partner who skipped Pix |
| No admin notification on new GM/boutique submission | High | Yes — remote launch from Zanzibar |
| Training videos are PLACEHOLDER URLs | High | Yes — blocks GM certification |
| No user management tab (backend exists) | High | No — lower volume at launch |
| No manual mark-paid button in orders UI | High | Edge case at launch |
| No refund/cancellation management | High | Edge case at launch |
| Source field not shown/filterable in leads | High | Yes — need to distinguish bot vs. field team |
| No founder-tier flag or slot enforcement | High | Yes — 5-slot rule cannot be tracked |
| "15% comissão" label is incorrect | High | Yes — confusing for partner conversations |
| Payout summary shows current week only | High | Yes — first week of operation |
| No subscription revenue tracking | High | Yes — part of business model |
| Lead list hard-capped at 200, no search | Medium | Unlikely to hit at launch |
| No order search/filter | Medium | Manageable at low volume |
| Boutique reject has no reason field | Medium | Yes — 24h turnaround expectation |
| No payout Pix key editor for partners | Medium | Yes — depends on onboarding quality |
| No revenue split by source in metrics | Medium | Nice-to-have at launch |
| No approved/pending split in stats | Medium | Yes — monitoring launch supply |
| No leads KPI on main stats tab | Medium | Yes — monitoring GTM traction |
| No filter by date range in payout list | Medium | No |
| Migrate trialEndsAt button exposed in Leads tab | Low | No — post-migration cleanup |
| Uniform-sent is one-way flag | Low | No |
| pricePerHour override has no zero validation | Low | Edge case |
