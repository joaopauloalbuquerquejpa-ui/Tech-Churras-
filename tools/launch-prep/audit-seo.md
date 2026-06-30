# SEO & Marketing Technical Audit — Tech Churras
**Date:** 2026-06-30  
**Scope:** `frontend/src` — Next.js 16.2.6 App Router  
**Auditor:** SEO Agent  
**Status:** Pre-launch (lançamento 06/07/2026)

---

## Executive Summary

The site has a solid structural foundation: `metadataBase` is set correctly, JSON-LD is implemented on the main pages, the sitemap exists and is dynamic, and analytics load behind a consent gate. The critical gaps are concentrated in five areas: oversized meta descriptions on every key page, `/visita-equipe` being publicly indexable (exposes internal sales operations), `next/image` not used anywhere on the site (LCP and CLS risk), `/founder` incorrectly blocked in robots.txt, and PostHog initializing before user consent (LGPD exposure).

---

## 1. Meta Tags

### 1.1 Title Tags

| Page | Title | Chars | Status |
|------|-------|-------|--------|
| Root layout (default) | "Tech Churras — Churrasqueiros Profissionais em São Paulo" | 56 | OK |
| Homepage (`page.tsx`) | "Contratar Churrasqueiro Profissional em São Paulo \| Tech Churras" | 64 | OVER (>60) |
| `/churrasqueiros/sao-paulo` | "Churrasqueiros em São Paulo — Contrate Profissionais Certificados \| Tech Churras" | 80 | OVER (>60) |
| `/acougues/sao-paulo` | "Açougues em São Paulo — Carnes Premium para Churrasco \| Tech Churras" | 68 | OVER (>60) |
| `/churrasqueiros/[other-city]` | "Churrasqueiros em {City} — Tech Churras" | ~40 | OK |
| `/acougues/[other-city]` | "Açougues em {City} — Tech Churras" | ~35 | OK |
| `/para-acougues` | "Parceria para Açougues em São Paulo — Tech Churras" | 50 | OK |
| `/para-churrasqueiros` | "Seja Churrasqueiro Parceiro — Tech Churras" | 43 | OK |
| `/churras-club` | (no `export const metadata` — falls back to layout default) | — | MISSING |
| `/visita-equipe` | (no `export const metadata` — falls back to layout default) | — | MISSING |
| `/grillmasters/[id]` profile | "Churrasqueiro \| Tech Churras" (observed via live fetch) | 30 | GENERIC — no GM name |

**Issues:**
- Homepage title is 64 chars — Google truncates at ~60. "em São Paulo" at the end is cut.
- SP city page titles are 68–80 chars. Google will rewrite them. High probability of Google substituting its own title.
- `/churras-club` and `/visita-equipe` are `'use client'` components with no server wrapper exporting metadata. They inherit the root layout default title — "Tech Churras — Churrasqueiros Profissionais em São Paulo" — which is misleading for both pages.
- Individual GM profile titles appear to be "Churrasqueiro | Tech Churras" rather than "{GM Name} — Churrasqueiro em {City} | Tech Churras". No personalization detected.

---

### 1.2 Meta Descriptions

| Page | Description | Chars | Status |
|------|-------------|-------|--------|
| Root layout (default) | "Contrate Grillmasters profissionais certificados e açougues premium em São Paulo. Kit de churrasco planejado por IA, acompanhe ao vivo no mapa. Aniversários, eventos corporativos e confraternizações." | 200 | OVER (>160) |
| Homepage | "Contrate Grillmasters profissionais certificados para aniversários, eventos corporativos e confraternizações em São Paulo. Kit de churrasco com IA, açougue premium parceiro e rastreamento ao vivo. Jota Grillmaster — fundador." | 225 | OVER (>160) |
| `/churrasqueiros/sao-paulo` | "Churrasqueiros profissionais certificados em São Paulo. Contrate pelo app, acompanhe ao vivo no mapa e receba churrasco de qualidade no seu evento. 93% do valor vai direto ao churrasqueiro." | 190 | OVER (>160) |
| `/acougues/sao-paulo` | "Os melhores açougues parceiros em São Paulo. Picanha, fraldinha, costela e cortes premium selecionados para churrasco. Entrega organizada para o seu evento com churrasqueiro profissional." | 187 | OVER (>160) |
| `/para-acougues` | "Transforme seu açougue em um canal digital recorrente em São Paulo. QR code no balcão, pedidos no app, repasse semanal via PIX. Mensalidade R$ 369/mês + 7% de comissão." | 168 | OVER (>160) |
| `/para-churrasqueiros` | "Transforme seu talento no churrasco em renda recorrente. Receba pedidos pelo app, gerencie sua agenda e receba 93% por PIX toda semana. Zero mensalidade." | 153 | OK |
| `/churras-club` | (inherits layout default — 200 chars) | 200 | OVER + WRONG CONTENT |
| `/visita-equipe` | (inherits layout default — 200 chars) | 200 | OVER + WRONG CONTENT |

**Note on `/para-acougues` business accuracy:** The description says "7% de comissão" but the model is 10% commission for boutiques. The CLAUDE.md states 7% applies to GMs, 10% to boutiques. This is a factual error in the meta description that creates customer confusion if indexed.

---

## 2. Structured Data (JSON-LD)

### 2.1 What exists and where

| Page | Schema Types | Status |
|------|-------------|--------|
| Root layout (all pages) | Organization, LocalBusiness+FoodEstablishment, WebSite+SearchAction | OK |
| Homepage | FAQPage (5 questions) | OK |
| `/churrasqueiros/[cidade]` | BreadcrumbList, ItemList, FAQPage (SP only) | OK |
| `/acougues/[cidade]` | BreadcrumbList, ItemList, FAQPage (SP only) | OK |
| `/para-acougues` | FAQPage (5 questions) | OK |
| `/grillmasters/[id]` profile | None detected | MISSING |
| `/boutiques/[id]` profile | None detected | MISSING |
| `/churras-club` | None | MISSING |
| `/para-churrasqueiros` | None (FAQs exist in JSX but no JSON-LD) | MISSING |

### 2.2 Specific Issues

**Root Layout JSON-LD placement:** The `<script type="application/ld+json">` block is rendered inside `<body>` (inside PostHogProvider, before children). This is valid — Google accepts JSON-LD in body. No action needed.

**Organization `sameAs`:** Only Instagram (`https://www.instagram.com/tech.churras/`) listed. If YouTube or WhatsApp Business presence exists, add them to improve entity recognition.

**LocalBusiness `streetAddress`:** The address schema has `addressLocality`, `addressRegion`, and `addressCountry` but no `streetAddress` or `postalCode`. For a service-area business this is acceptable, but adding a registered address if available would strengthen the entity.

**ItemList on city pages with zero results:** When a city page has no GMs/boutiques, the ItemList schema has `numberOfItems: 0` or `1` (for SP) and an empty `itemListElement` array. An empty ItemList may trigger a validation warning in Rich Results Test. Confirm: is `numberOfItems: 1` for SP intentional when `boutiques.length === 0`? If the SP page is empty at launch, this sends a misleading signal.

**`/para-churrasqueiros` FAQ gap:** The page has an accordion FAQ section with 6 questions but no `FAQPage` JSON-LD. The `/para-acougues` page correctly implements FAQPage schema. Apply the same pattern to `/para-churrasqueiros`.

**GM Profile and Boutique Profile pages:** Individual profiles are the highest-intent pages (a user searching "João Silva churrasqueiro São Paulo" lands here) and have no structured data. At minimum, `Person` schema for GM profiles and `FoodEstablishment` for boutique profiles should be implemented. These pages also seem to lack `generateMetadata` producing personalized titles — confirmed via live fetch returning "Churrasqueiro | Tech Churras".

---

## 3. OG Images

| Page | OG Image URL | Declared Size | Status |
|------|-------------|---------------|--------|
| Root layout (default) | `/jota.jpg` (resolves to `https://www.techchurras.com.br/jota.jpg` via metadataBase) | 1200x630 | OK — dimensions correct |
| Homepage | `/jota.jpg` | 1200x630 | OK |
| `/para-acougues` | `/jota.jpg` | **800x800** | WRONG SIZE — should be 1200x630 |
| `/para-churrasqueiros` | `/jota.jpg` | **800x800** | WRONG SIZE — should be 1200x630 |
| `/churrasqueiros/[cidade]` | (none declared — inherits layout default 1200x630) | 1200x630 (inherited) | Acceptable |
| `/acougues/[cidade]` | (none declared — inherits layout default 1200x630) | 1200x630 (inherited) | Acceptable |
| `/churras-club` | (none — falls back to layout) | 1200x630 (inherited) | Acceptable |
| GM profiles | (none confirmed) | — | UNCONFIRMED |
| Boutique profiles | (none confirmed) | — | UNCONFIRMED |

**800x800 on partner acquisition pages is a priority fix.** These are the pages most likely to be shared on WhatsApp by the sales team pitching açougues and churrasqueiros. A square image renders poorly on LinkedIn and Facebook link previews which expect 1200x630 (1.91:1 ratio).

**Content note:** All pages share the same `/jota.jpg` OG image. At launch with a small catalogue, this is understandable, but it means every shared link from every page shows the same founder photo regardless of context. City pages showing "Churrasqueiros em Campinas" but displaying Jota's photo is inconsistent. Not a blocker for launch.

**metadataBase resolution:** `metadataBase: new URL('https://www.techchurras.com.br')` is correctly set in layout.tsx. Relative OG image paths like `/jota.jpg` will be resolved to absolute URLs by Next.js. This is correct.

---

## 4. Sitemap

**Location:** `https://www.techchurras.com.br/sitemap.xml` — confirmed live, returns 24 URLs.

### 4.1 What is included

- Homepage ✅
- `/grillmasters` listing ✅
- `/boutiques` listing ✅
- `/churrasqueiros/sao-paulo` (priority 0.95) ✅
- `/acougues/sao-paulo` (priority 0.95) ✅
- `/churrasqueiros/{guarulhos,campinas,osasco,santo-andre,sao-bernardo-do-campo}` ✅
- `/acougues/{guarulhos,campinas,osasco}` ✅
- Dynamic city pages from API ✅
- `/kit-perfeito`, `/para-acougues`, `/para-churrasqueiros`, `/galeria`, `/parceiros`, `/convite-acougue` ✅
- `/termos-de-uso`, `/politica-de-privacidade` ✅

### 4.2 What is missing or incorrect

- **Individual GM profiles `/grillmasters/[id]`** — not in sitemap. Each GM profile is a unique page with high-intent search potential ("contratar [nome] churrasqueiro"). These should be added dynamically from the API, filtered to `approved=true` and `available=true`.
- **Individual boutique profiles `/boutiques/[id]`** — same issue.
- **`/churras-club`** — not in sitemap despite being a public page with a unique value proposition.
- **`/founder`** — not in sitemap AND blocked in robots.txt (see Section 5). Likely a double error.
- **`/login` and `/register` are in the sitemap but blocked in robots.txt** — direct contradiction. Google Search Console will flag these as "Blocked by robots.txt" in the sitemap coverage report. Remove them from the sitemap. They serve no SEO purpose.
- **`/convite-acougue` in sitemap** — this appears to be a B2B referral page for pitching açougues. If it has indexable, useful content, it's fine. If it's a form/CTA-only page, it's thin content.

### 4.3 Sitemap quality signals

- `changeFrequency: 'hourly'` on `/grillmasters` and `/boutiques` may be too aggressive for a crawl budget perspective at launch with small inventory. `daily` is more honest and less likely to be ignored.
- `lastModified: new Date()` on all pages means every sitemap fetch reports every URL as modified today. This devalues the signal. Ideally, lastModified should reflect when the page content actually changed.

---

## 5. Robots.txt

**Location:** `https://www.techchurras.com.br/robots.txt` — confirmed live.

### 5.1 Correctly blocked paths

- `/admin`, `/admin/` ✅
- `/grillmasters/dashboard`, `/boutiques/dashboard` ✅
- `/menu`, `/menu/` ✅
- `/orders`, `/orders/` ✅
- `/pedido`, `/perfil`, `/carrinho` ✅
- `/acompanhar/`, `/indicar`, `/convite/`, `/r/` ✅
- `/api` ✅
- `/redefinir-senha`, `/login`, `/register` ✅

### 5.2 Critical Problems

**`/visita-equipe` is NOT blocked.** This page is a live sales tracking tool for the commissioned field team in SP. It contains:
- Commission structure (R$300/açougue, R$50/churrasqueiro)
- Partner acquisition tactics
- Internal business operations data

Google can crawl, index, and surface this page for searches related to "Tech Churras equipe" or similar. Competitors can find it. Add `/visita-equipe` to the disallow list immediately.

**`/founder` IS blocked, incorrectly.** The founder page is:
- Linked from the homepage with a CTA "Conheça a história completa →"
- Listed in the homepage footer nav
- The primary E-E-A-T credibility asset for the platform (Bahari of Brazil, Zanzibar PPP, 1800+ events)

Blocking it from indexing removes the highest-authority brand story content from Google's index. This is almost certainly a mistake. Remove `/founder` from the disallow list.

### 5.3 Missing blocks

- `/visita-equipe` — not blocked (critical, see above)
- `/pitch-acougue`, `/pitch-churrasqueiro`, `/script-equipe` — these are mentioned in CLAUDE.md as existing assets. Their indexability status is unknown. If they are internal sales tools, they should be disallowed. If they are public-facing pitch pages, they should have proper metadata and be in the sitemap.

---

## 6. Canonical URLs

### 6.1 Assessment

- Homepage: `https://www.techchurras.com.br` (absolute) ✅
- `/churrasqueiros/[cidade]`: `/churrasqueiros/${cidade}` (relative) — resolves correctly via metadataBase in Next.js ✅
- `/acougues/[cidade]`: `/acougues/${cidade}` (relative) — same, resolves correctly ✅
- `/para-acougues`: `/para-acougues` (relative) ✅
- `/para-churrasqueiros`: **NO canonical set** ❌
- `/churras-club`: **NO canonical set** (client component, no metadata) ❌
- `/visita-equipe`: **NO canonical set** (client component, no metadata) ❌
- `/grillmasters` listing: unknown (page file not accessible in audit)
- `/boutiques` listing: unknown

### 6.2 Duplicate content risks

**URL naming inconsistency:** GM listing is at `/grillmasters` (English) while city pages are at `/churrasqueiros/[cidade]` (Portuguese). Similarly boutique listing is at `/boutiques` while city pages are at `/acougues/[cidade]`. These serve overlapping topics from different angles — not a direct cannibalization risk since intents differ (browse all vs. browse by city) — but the inconsistent language in slugs is a UX and brand signal issue. `/grillmasters` and `/boutiques` could redirect to Portuguese slugs post-launch without affecting current volume.

**`/grillmasters` vs `/churrasqueiros/sao-paulo`:** Both pages target "churrasqueiros em São Paulo" proximity searches. At launch with a single-city audience (São Paulo), Google may see these as competing for the same query cluster. The `/churrasqueiros/sao-paulo` page has the better-structured SEO content (breadcrumbs, FAQ schema, SEO text block). The `/grillmasters` listing is the transactional page (filters, browse). These serve different intents but watch for cannibalization in early GSC data.

---

## 7. Core Web Vitals Risks

### 7.1 No `next/image` usage — Critical

Every image across the entire site uses a plain `<img>` tag. This is the single largest technical SEO risk on the site.

**Affected pages and image patterns:**
- Homepage hero: `<img src="/jota.jpg" ...>` (above the fold, LCP candidate)
- Homepage nav logo: `<img src="/logo-flame.png" ...>` (absolute bottom positioning with h-14 inside h-8 container — CLS risk)
- Homepage GM grid: `<img src={gm.photoUrl} ...>` (up to 6 external Supabase images)
- Homepage boutique grid: `<img src={b.photoUrl} ...>` (up to 6 external Supabase images)
- `/para-churrasqueiros`: `<img src="/bahari-restaurante.jpg" ...>` (above fold, LCP candidate)
- `/para-churrasqueiros`: `<img src="/jota.jpg" ...>` (founder section)
- City pages GM grid: `<img src={gm.photoUrl} ...>` (up to 50 images)
- City pages boutique grid: `<img src={b.facadeUrl ?? b.logoUrl} ...>`

**Consequences of not using `next/image`:**
- No automatic WebP/AVIF conversion — users download full JPEG/PNG
- No automatic `loading="lazy"` — all images load on initial paint including those below fold
- No automatic `width`/`height` attributes — browser cannot reserve space, causing Cumulative Layout Shift
- No blur-up placeholder — perceived LCP is worse
- No responsive `srcset` — mobile users download desktop-sized images
- No image size optimization via Vercel Image Optimization (which is included in the Vercel plan)

**Logo CLS pattern (nav on homepage):**
```jsx
<div className="h-8 overflow-hidden relative w-9">
  <img src="/logo-flame.png" alt="" className="absolute bottom-0 h-14 w-auto" />
</div>
```
The image is declared as h-14 (56px) inside a container of h-8 (32px). The container clips the image. Because no `width`/`height` is declared on the `<img>`, the browser doesn't know the image dimensions until after it loads, creating layout shift. This pattern appears on every page (nav is in every page's JSX, not in layout.tsx).

### 7.2 Missing `loading="lazy"` on below-fold images

On the homepage, the Grillmaster grid and Boutique grid appear well below the fold. None of their `<img>` tags have `loading="lazy"`. This means up to 12 external Supabase image URLs are fetched on initial page load. At launch with few GMs, this is manageable, but it degrades LCP by competing for bandwidth with above-fold content.

### 7.3 External Supabase images not optimized through Vercel

GM and boutique photos are stored at `*.supabase.co`. These URLs are loaded directly without going through Vercel Image Optimization. The CSP `img-src` allows `https://*.supabase.co`, so images load — but at whatever size and format Supabase returns. To route Supabase images through Vercel optimization (for WebP conversion, resizing), `next.config.ts` would need a `remotePatterns` configuration and images would need to use `next/image`.

### 7.4 Leaflet Map (CityMap client component)

The `CityMapClient` component on city pages loads Leaflet and OpenStreetMap tiles. As a client component with dynamic imports, this should not block SSR. No action required at launch.

### 7.5 Framer Motion in `/para-churrasqueiros`

The `AnimatedNumber` component uses `framer-motion`'s `animate` function. This is a client-side-only effect and does not affect SSR or LCP. Acceptable.

---

## 8. Analytics

### 8.1 GA4

- Measurement ID `G-1ZXG3T5ST7` is **hardcoded** in `TrackingScripts.tsx` — not pulled from an environment variable.
- Loads after consent ✅
- `gtag('config', 'G-1ZXG3T5ST7', {page_path: window.location.pathname})` is correct for SPA navigation ✅
- **Risk:** If the GA4 property needs to change (e.g., account transfer, new property), requires a code deploy. Low probability but worth noting.

### 8.2 Meta Pixel

- Loads after consent ✅
- Pulls ID from `NEXT_PUBLIC_META_PIXEL_ID` env var ✅
- `fbq('init', ...)` and `fbq('track', 'PageView')` correct ✅
- **CSP gap:** `connect-src` in `next.config.ts` does not include `https://www.facebook.com`. The Meta Pixel sends events to `https://www.facebook.com/tr`. This POST request will be blocked by the current CSP. Meta Pixel events will silently fail in production.

### 8.3 TikTok Pixel

- Loads after consent ✅
- Pulls ID from `NEXT_PUBLIC_TIKTOK_PIXEL_ID` env var ✅
- `ttq.load(...)` and `ttq.page()` correct ✅
- CSP `connect-src` includes `https://analytics.tiktok.com` ✅

### 8.4 Google Ads

- Loads after consent ✅
- Pulls ID from `NEXT_PUBLIC_GOOGLE_ADS_ID` env var ✅
- **Duplicate gtag script:** GA4 already loads `https://www.googletagmanager.com/gtag/js?id=G-1ZXG3T5ST7`. Google Ads then loads a second `https://www.googletagmanager.com/gtag/js?id={googleAdsId}`. Google's documentation supports loading multiple IDs via a single gtag script using `gtag('config', ...)` calls, but loading the gtag script twice is redundant. The second load will be a no-op (script tag with same src), so this is not broken — just inefficient.

### 8.5 PostHog

- Pulls key from `NEXT_PUBLIC_POSTHOG_KEY` env var ✅
- `PostHogProvider` initializes PostHog in a `useEffect` that runs **regardless of cookie consent**.
- The `TrackingScripts` component correctly gates GA4, Meta, TikTok behind consent. PostHog bypasses this gate. Under LGPD (Lei 13.709/2018), tracking user behavior before explicit consent is a violation when the tracker uses storage and captures identifiable behavioral data.
- PostHog's persistence is set to `'localStorage'` — this writes to local storage before consent, which is not consent-exempt under LGPD unlike purely aggregated/anonymous tools.
- **Compare:** Plausible is correctly loaded unconditionally because it collects no PII and stores no cookies — LGPD-exempt. PostHog is not in the same category.
- **CSP gap:** `connect-src` includes `https://posthog.com` and `https://app.posthog.com` but PostHogProvider.tsx sets `api_host: 'https://us.i.posthog.com'`. The actual API calls go to `https://us.i.posthog.com` which is NOT in the CSP allowlist. PostHog event capture will be blocked by CSP in production.

### 8.6 Plausible

- Loads unconditionally ✅ (correct — Plausible is LGPD-exempt by design)
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` env var gate ✅
- `strategy="afterInteractive"` ✅
- No issues.

---

## Prioritized Issue List

### P0 — Fix Before Launch (blocks correct operation or legal exposure)

| # | Issue | File |
|---|-------|------|
| 1 | `/visita-equipe` not in `robots.ts` disallow — internal sales tool indexable by Google | `src/app/robots.ts` |
| 2 | `/founder` incorrectly in `robots.ts` disallow — removes primary E-E-A-T page from index | `src/app/robots.ts` |
| 3 | `/login` and `/register` in sitemap.ts but blocked in robots.txt — GSC will flag as contradictory | `src/app/sitemap.ts` |
| 4 | Meta Pixel events blocked by CSP — `https://www.facebook.com` missing from `connect-src` | `next.config.ts` |
| 5 | PostHog CSP gap — `https://us.i.posthog.com` missing from `connect-src`, PostHog events silently fail | `next.config.ts` |
| 6 | PostHog initializes before consent — LGPD exposure | `src/components/PostHogProvider.tsx` |
| 7 | `/para-acougues` meta description says "7% de comissão" but boutique commission is 10% | `src/app/para-acougues/page.tsx` |

### P1 — Fix Before Launch (direct SEO impact on ranking target pages)

| # | Issue | File |
|---|-------|------|
| 8 | Homepage meta description 225 chars (>160) | `src/app/page.tsx` |
| 9 | Root layout default description 200 chars (>160) | `src/app/layout.tsx` |
| 10 | `/churrasqueiros/sao-paulo` title 80 chars (>60) | `src/app/churrasqueiros/[cidade]/page.tsx` |
| 11 | `/churrasqueiros/sao-paulo` description 190 chars (>160) | `src/app/churrasqueiros/[cidade]/page.tsx` |
| 12 | `/acougues/sao-paulo` title 68 chars (>60) | `src/app/acougues/[cidade]/page.tsx` |
| 13 | `/acougues/sao-paulo` description 187 chars (>160) | `src/app/acougues/[cidade]/page.tsx` |
| 14 | `/para-acougues` description 168 chars (>160) | `src/app/para-acougues/page.tsx` |
| 15 | `/churras-club` has no metadata (client component, no server wrapper) | `src/app/churras-club/page.tsx` |
| 16 | `/visita-equipe` has no metadata and no noindex | `src/app/visita-equipe/page.tsx` |
| 17 | `/para-churrasqueiros` missing canonical tag | `src/app/para-churrasqueiros/page.tsx` |

### P2 — Fix Post-Launch (optimization, not blocking)

| # | Issue | File |
|---|-------|------|
| 18 | OG image on `/para-acougues` is 800x800, should be 1200x630 | `src/app/para-acougues/page.tsx` |
| 19 | OG image on `/para-churrasqueiros` is 800x800, should be 1200x630 | `src/app/para-churrasqueiros/page.tsx` |
| 20 | Zero `next/image` usage — no WebP conversion, no lazy loading, no CLS prevention | Every page |
| 21 | Logo `<img>` in nav has CLS risk (h-14 image in h-8 clipping container) | `src/app/page.tsx` + city pages |
| 22 | GM profile pages have generic title "Churrasqueiro \| Tech Churras" — no GM name | `src/app/grillmasters/[id]/page.tsx` |
| 23 | GM profiles have no JSON-LD (Person schema) | `src/app/grillmasters/[id]/page.tsx` |
| 24 | Boutique profiles have no JSON-LD (FoodEstablishment schema) | `src/app/boutiques/[id]/page.tsx` |
| 25 | `/para-churrasqueiros` has 6-question accordion FAQ with no FAQPage JSON-LD | `src/app/para-churrasqueiros/page.tsx` |
| 26 | GM profiles not in sitemap | `src/app/sitemap.ts` |
| 27 | Boutique profiles not in sitemap | `src/app/sitemap.ts` |
| 28 | `/churras-club` not in sitemap | `src/app/sitemap.ts` |
| 29 | `changeFrequency: 'hourly'` on listing pages is overstated — use `daily` | `src/app/sitemap.ts` |
| 30 | `lastModified: new Date()` on all URLs in sitemap — every crawl reports all URLs as updated today | `src/app/sitemap.ts` |
| 31 | GA4 ID hardcoded in TrackingScripts — should be an env var | `src/components/TrackingScripts.tsx` |
| 32 | `manifest.json` `start_url` is `/dashboard` — PWA launches into authenticated area | `public/manifest.json` |
| 33 | `/churras-club` should be in sitemap (public page with unique content) | `src/app/sitemap.ts` |

---

## Key Numbers to Confirm Before Launch

1. Does `NEXT_PUBLIC_META_PIXEL_ID` have a value in Vercel production env? (If empty, Meta Pixel never fires)
2. Does `NEXT_PUBLIC_TIKTOK_PIXEL_ID` have a value in Vercel? (Same)
3. Does `NEXT_PUBLIC_GOOGLE_ADS_ID` have a value in Vercel? (Same)
4. Does `NEXT_PUBLIC_POSTHOG_KEY` have a value in Vercel? (PostHog)
5. Confirm `/jota.jpg` exists in `public/` and is actually 1200x630px in actual file dimensions (not just declared)
6. Confirm `/bahari-restaurante.jpg` exists in `public/` (used in `/para-churrasqueiros` Bahari section)
