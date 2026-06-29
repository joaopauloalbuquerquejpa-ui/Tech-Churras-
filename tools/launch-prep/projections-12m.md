# Tech Churras — 12-Month Financial Projection
**Period**: Jul 2026 – Jun 2027 | **Version**: 1.0 | **Author**: Morgan (Financial Analyst) | **Date**: 29/06/2026
**Purpose**: Pre-launch scenario planning — supply ramp, break-even timing, and weekly operational targets

---

## Key Assumptions

State your assumptions before your conclusions. Every output below flows from these inputs.

| Assumption | Value | Source |
|---|---|---|
| Net platform revenue per order (commission − MP fee) | **R$98/order** | Unit Economics v1.0 (R$97.80 mid case, rounded) |
| MP fee structure | 3.49% + R$0.49 on full ticket | Mercado Pago production rate |
| Founder açougue subscription | R$369/month | Business model |
| Standard açougue subscription (6th+) | R$497/month | Business model |
| Founder free period | **Jul–Sep 2026 (3 months)** | Business model — no sub revenue in this window for any founder slot |
| Fixed costs — early stage | **R$285/month** | Unit Economics v1.0 (WhatsApp R$200 + Railway R$80 + Haiku R$5) |
| Fixed costs — at scale | **R$480/month** | Per model brief; note: detailed cost breakdown in unit-economics.md shows R$595/month at full scale (adds Vercel Pro R$100 + Resend R$50 + Supabase R$150 + R$10 Haiku delta). The R$115/month gap is a sensitivity flag — see Model Limitations. |
| Scale transition | Jan 2027 for Conservative and Base; Nov 2026 for Optimistic | Volume-triggered infra upgrade |
| Ad spend: Conservative | R$1,000/month — starts Nov 2026 (month 5) | Not activated until month 5 per brief |
| Ad spend: Base | R$3,000/month — starts Sep 2026 (month 3) | Per brief |
| Ad spend: Optimistic | R$5,000/month — starts Aug 2026 (month 2) | Per brief |
| Average orders per GM per month | 6 (Conservative) / 8 (Base) / 10 (Optimistic) | Estimated from typical GP capacity |
| Açougue and GM churn | 0% in year 1 | Simplifying assumption — LTV floor. Monitor month 3 activation rate. |
| Sales commissions (CAC) | R$300/açougue (R$150 on sign + R$150 on first payment) | Business model — NOT modeled in tables below. Budget R$4,200–R$8,000 separately depending on scenario. |
| Currency / USD rate | R$5.50 | Reference — affects Haiku API cost only |

**What this model does not capture**: Sales commissions to field team (~R$300/açougue), founder salary, one-time setup costs, or working capital requirements from Mercado Pago's settlement timing (D+14 for credit card).

---

## Scenario 1 — Conservative

**Narrative**: Sales progress is slow. First açougue signs in Aug. +1 founder/month through Dec. GM pool reaches 2 by Oct and stays constrained. Paid ads activate in month 5 at low spend. Order growth hits the 2-GM capacity ceiling (~12/month) by Dec and only grows modestly as a 3rd GM joins mid-2027.

**Thesis that proves this wrong**: The field rep team isn't recruited by Aug, or the first 1–2 açougues take 3+ months to close instead of 1 month.

| Month | Açougues | GMs | Orders | Sub MRR (R$) | Commission (R$) | Total Rev (R$) | Ad Spend (R$) | Fixed (R$) | Net (R$) | Cumul. Net (R$) |
|---|---|---|---|---|---|---|---|---|---|---|
| Jul '26 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 285 | **(285)** | **(285)** |
| Aug | 1 | 1 | 3 | 0 | 294 | 294 | 0 | 285 | **9** | **(276)** |
| Sep | 2 | 1 | 5 | 0 | 490 | 490 | 0 | 285 | **205** | **(71)** |
| Oct | 3 | 2 | 7 | 1,107 | 686 | 1,793 | 0 | 285 | **1,508** | **1,437** |
| Nov | 4 | 2 | 10 | 1,476 | 980 | 2,456 | 1,000 | 285 | **1,171** | **2,608** |
| Dec | 5 | 2 | 12 | 1,845 | 1,176 | 3,021 | 1,000 | 285 | **1,736** | **4,344** |
| Jan '27 | 5 | 2 | 12 | 1,845 | 1,176 | 3,021 | 1,000 | 480 | **1,541** | **5,885** |
| Feb | 5 | 2 | 14 | 1,845 | 1,372 | 3,217 | 1,000 | 480 | **1,737** | **7,622** |
| Mar | 5 | 3 | 16 | 1,845 | 1,568 | 3,413 | 1,000 | 480 | **1,933** | **9,555** |
| Apr | 5 | 3 | 18 | 1,845 | 1,764 | 3,609 | 1,000 | 480 | **2,129** | **11,684** |
| May | 6 | 4 | 20 | 2,342 | 1,960 | 4,302 | 1,000 | 480 | **2,822** | **14,506** |
| Jun | 6 | 4 | 22 | 2,342 | 2,156 | 4,498 | 1,000 | 480 | **3,018** | **17,524** |
| **TOTAL** | — | — | **139** | **16,191** | **13,622** | **29,813** | **8,000** | **4,590** | **17,524** | |

> Sub MRR is R$0 in Jul–Sep for all founders (free period). Standard açougue (6th) joins May 2027.
> Oct–Apr: 3–5 founders × R$369. May–Jun: 5 × R$369 + 1 × R$497 = R$2,342.

---

## Scenario 2 — Base

**Narrative**: 1 founder açougue at launch in Jul. +1 in Aug, +1 in Sep (3 founders total by Sep). All 5 founder slots filled by Nov. Standard açougues join from Oct onwards at 1/month. Orders start at 5 in Jul, grow ~80% per month to ~80 by Dec driven by ads starting in Sep. Growth tapers to ~30% per month from Jan as the supply side consolidates. GMs scale alongside: 2 in Jul, 24 by Jun.

**Thesis that proves this wrong**: Ads convert but GMs are the bottleneck — GM onboarding lags order growth by 4–6 weeks.

| Month | Açougues | GMs | Orders | Sub MRR (R$) | Commission (R$) | Total Rev (R$) | Ad Spend (R$) | Fixed (R$) | Net (R$) | Cumul. Net (R$) |
|---|---|---|---|---|---|---|---|---|---|---|
| Jul '26 | 1 | 2 | 5 | 0 | 490 | 490 | 0 | 285 | **205** | **205** |
| Aug | 3 | 4 | 9 | 0 | 882 | 882 | 0 | 285 | **597** | **802** |
| Sep | 5 | 5 | 16 | 0 | 1,568 | 1,568 | 3,000 | 285 | **(1,717)** | **(915)** |
| Oct | 6 | 7 | 29 | 2,342 | 2,842 | 5,184 | 3,000 | 285 | **1,899** | **984** |
| Nov | 7 | 9 | 52 | 2,839 | 5,096 | 7,935 | 3,000 | 285 | **4,650** | **5,634** |
| Dec | 8 | 12 | 80 | 3,336 | 7,840 | 11,176 | 3,000 | 285 | **7,891** | **13,525** |
| Jan '27 | 9 | 14 | 100 | 3,833 | 9,800 | 13,633 | 3,000 | 480 | **10,153** | **23,678** |
| Feb | 10 | 16 | 130 | 4,330 | 12,740 | 17,070 | 3,000 | 480 | **13,590** | **37,268** |
| Mar | 11 | 18 | 165 | 4,827 | 16,170 | 20,997 | 3,000 | 480 | **17,517** | **54,785** |
| Apr | 12 | 20 | 210 | 5,324 | 20,580 | 25,904 | 3,000 | 480 | **22,424** | **77,209** |
| May | 13 | 22 | 270 | 5,821 | 26,460 | 32,281 | 3,000 | 480 | **28,801** | **106,010** |
| Jun | 14 | 24 | 340 | 6,318 | 33,320 | 39,638 | 3,000 | 480 | **36,158** | **142,168** |
| **TOTAL** | — | — | **1,406** | **38,970** | **137,788** | **176,758** | **30,000** | **4,590** | **142,168** | |

> Sep dip: ads start (R$3,000) before subscription revenue kicks in (Oct). Cumulative turns negative in Sep, recovers in Oct.
> All 5 founders pay from Oct at R$369. Standard açougues (1/month from Oct) pay R$497 from day of signing.

---

## Scenario 3 — Optimistic

**Narrative**: 3 founder açougues sign before or at launch. All 5 founder slots filled by Aug. Standard açougues onboard at 2/month from Aug. Orders launch at 20 in Jul, double monthly through Oct (2x), then growth tapers to ~25–30% as GM capacity becomes the pacing constraint. Ads go live in Aug at R$5,000/month. GMs scale aggressively: 5 at launch, 30 by Dec.

**Thesis that proves this wrong**: 150+ orders/month in Oct requires ~15 GMs running ~10 churrascos each. If GM onboarding lags, order growth hits a hard ceiling and this scenario tracks base by Q4.

| Month | Açougues | GMs | Orders | Sub MRR (R$) | Commission (R$) | Total Rev (R$) | Ad Spend (R$) | Fixed (R$) | Net (R$) | Cumul. Net (R$) |
|---|---|---|---|---|---|---|---|---|---|---|
| Jul '26 | 3 | 5 | 20 | 0 | 1,960 | 1,960 | 0 | 285 | **1,675** | **1,675** |
| Aug | 6 | 10 | 40 | 497 | 3,920 | 4,417 | 5,000 | 285 | **(868)** | **807** |
| Sep | 8 | 15 | 80 | 1,491 | 7,840 | 9,331 | 5,000 | 285 | **4,046** | **4,853** |
| Oct | 10 | 20 | 150 | 4,330 | 14,700 | 19,030 | 5,000 | 285 | **13,745** | **18,598** |
| Nov | 12 | 25 | 220 | 5,324 | 21,560 | 26,884 | 5,000 | 285 | **21,599** | **40,197** |
| Dec | 14 | 30 | 300 | 6,318 | 29,400 | 35,718 | 5,000 | 285 | **30,433** | **70,630** |
| Jan '27 | 16 | 33 | 370 | 7,312 | 36,260 | 43,572 | 5,000 | 480 | **38,092** | **108,722** |
| Feb | 18 | 36 | 440 | 8,306 | 43,120 | 51,426 | 5,000 | 480 | **45,946** | **154,668** |
| Mar | 20 | 39 | 520 | 9,300 | 50,960 | 60,260 | 5,000 | 480 | **54,780** | **209,448** |
| Apr | 22 | 42 | 600 | 10,294 | 58,800 | 69,094 | 5,000 | 480 | **63,614** | **273,062** |
| May | 24 | 45 | 680 | 11,288 | 66,640 | 77,928 | 5,000 | 480 | **72,448** | **345,510** |
| Jun | 26 | 48 | 760 | 12,282 | 74,480 | 86,762 | 5,000 | 480 | **81,282** | **426,792** |
| **TOTAL** | — | — | **4,180** | **76,742** | **409,640** | **486,382** | **55,000** | **4,590** | **426,792** | |

> Aug is the only month with negative operating income (−R$868). Jul is so strong that cumulative net never turns negative — the business starts cash-flow positive.
> Sub MRR: 3 founders free in Jul, all 5 free Jul–Sep. Standard açougues (1 in Aug, +2/month from Sep) pay R$497 from sign date — no free period.
> Optimistic infra note: fixed cost should move to R$480 starting Nov 2026 as Vercel and Supabase free tiers are exceeded at this volume. This is modeled from Jan 2027 for consistency — the difference is 2 months × R$195 = R$390 understatement of costs.

---

## Cross-Scenario Summary

All figures in R$ unless noted.

| Metric | Conservative | Base | Optimistic |
|---|---|---|---|
| **Year 1 Gross Revenue** | **30,114** | **176,758** | **486,382** |
| Total Subscription Revenue | 16,191 | 38,970 | 76,742 |
| Total Commission Revenue | 13,622 | 137,788 | 409,640 |
| Total Ad Spend | 8,000 | 30,000 | 55,000 |
| Total Fixed Costs | 4,590 | 4,590 | 4,590 |
| **Year 1 Net Revenue (Profit)** | **17,524** | **142,168** | **426,792** |
| Jun 2027 Monthly Run Rate (Net) | 3,018 | 36,158 | 81,282 |
| Total Orders (12 months) | 139 | 1,406 | 4,180 |
| Açougues by Jun 2027 | 6 | 14 | 26 |
| GMs by Jun 2027 | 4 | 24 | 48 |
| Subscription MRR by Jun 2027 | 2,342 | 6,318 | 12,282 |

**Subscription mix by Jun 2027**: In base and optimistic, standard açougues (R$497) represent the majority of subscription MRR by H2 2027. Closing the 5 founder slots fast is important for launch optics and team commission economics — but the real subscription compounding happens with standard açougues thereafter.

---

## Break-Even Analysis

Break-even is defined two ways: monthly (when a given month first shows positive net) and cumulative (when the running total of net revenue first turns and stays positive).

| Scenario | First Profitable Month | Persistent Monthly Profit | Cumulative Break-Even |
|---|---|---|---|
| Conservative | **Aug 2026** (R$9 net) | Aug 2026 — never dips again | **Oct 2026** — cumulative turns R$+1,437 |
| Base | Jul 2026 (R$205) — then Sep dips | **Oct 2026** — Sep is the only loss month | **Oct 2026** — Sep takes cumulative to −R$915; Oct restores to +R$984 |
| Optimistic | **Jul 2026** (R$1,675) | **Sep 2026** — Aug is the only loss month | **Never negative** — Jul is so strong that cumulative net stays above zero throughout |

**The critical insight on base case**: The September dip is entirely caused by ads starting (R$3,000) one month before subscription revenue activates (Oct). This is a deliberate sequencing risk. If ads could be delayed to Oct, the Sep dip disappears — but so does the demand stimulus during the açougue-filling month. The dip is worth accepting.

**Conservative risk**: The Jul–Sep window has zero subscription revenue and zero (or near-zero) order commissions. Total cash outflow in this window: R$855 in fixed costs. If the first açougue doesn't sign by Aug, cumulative losses extend to Sep (−R$71 by end of Sep). The buffer is thin. Minimum recommended operating reserve before 06/07 launch: R$1,500 (covers 5 months of early-stage fixed costs).

---

## 2 Weekly KPIs to Track

These are the two numbers to pull every Monday morning. Everything else is an output. These are the inputs.

---

### KPI 1: Açougues Signed Per Week

This is the master constraint on subscription MRR and order potential. No açougues = no kits = no GM orders = no commission revenue. The platform literally cannot generate commission revenue without supply-side coverage.

**How to measure**: Count new açougue accounts with status "approved" or "contract signed" in the admin panel week-over-week.

| Scenario | Weeks 1–4 | Months 2–6 | Red-Flag Signal |
|---|---|---|---|
| Conservative | 0–0.5/week (building) | 0.5/week | 0 new açougues for 4 consecutive weeks |
| Base | 0.5–1/week | 1/week | Less than 2 new açougues in any rolling month |
| Optimistic | 1–2/week | 2/week | Less than 1 new açougue per week for 3 consecutive weeks |

**Interpretation**: If week 2 or week 3 of launch shows zero açougue progress, the model is tracking to conservative — or worse. Do not wait for month-end to adjust. The field rep team, WhatsApp bot follow-up cadence, and in-person visit schedule are the levers.

---

### KPI 2: Completed Orders Per Week

This is the demand validation metric and the direct driver of commission revenue. Weekly orders tell you whether supply (açougues with product kits + GMs ready to work) is actually converting into customer churrascos. A stalled order count with açougues signed signals a GM shortage, not a demand problem.

**How to measure**: Count orders with status "completed" (payment confirmed, event delivered) in the admin panel, week-over-week.

| Scenario | Jul (month 1) | Dec (month 6) | Jun 2027 (month 12) |
|---|---|---|---|
| Conservative | 0/week | 3/week | 5–6/week |
| Base | 1–2/week | 20/week | 85/week |
| Optimistic | 5/week | 75/week | 190/week |

**Interpretation**: Divide your current weekly order count by the base case target for that month. If you're tracking at 60%+ of base, the model is valid. If you're tracking below 40% of base for two consecutive weeks, re-run this model on conservative assumptions and adjust the ad budget accordingly — spending R$3,000/month on ads that are not converting to orders is a structural problem, not a timing problem.

**Secondary read**: Calculate revenue per week = weekly orders × R$98. If this is growing week-over-week, the flywheel is working. If flat or declining despite ad spend, the bottleneck is supply (GM capacity) not demand.

---

## Model Limitations and Sensitivity Flags

These are the assumptions that, if wrong, most materially change the output.

**1. Net revenue per order is held constant at R$98 across all scenarios**
In practice, conservative outcomes may correlate with smaller events (fewer guests, shorter duration, cheaper cuts) — pushing the low-case per-order figure toward R$65.67 from unit-economics.md. If conservative materialize with an average ticket below R$1,600, rerun commission projections at R$66/order. Conservative year 1 net would drop from R$17.5K to approximately R$12K.

**2. Fixed cost at scale may be R$595, not R$480**
The unit-economics.md detailed breakdown shows R$595/month at full scale (Vercel Pro, Resend, Supabase paid, Haiku at volume). The R$480 figure used here underestimates at-scale infra by R$115/month. Over 6 at-scale months (Jan–Jun), that's R$690 of unmodeled costs — immaterial in base and optimistic, but worth watching in conservative where every real has a name.

**3. Sales commissions (R$300/açougue) are not in the tables**
Budget separately: Conservative ~R$1,800, Base ~R$4,200, Optimistic ~R$7,800 in field commissions over year 1. These reduce actual cash profit but are not operating costs — they're CAC that buys contracted MRR with a 27–33x LTV:CAC ratio. Pay them without hesitation; just track them against the LTV payback schedule.

**4. Zero açougue churn is the LTV floor assumption**
If any founder açougue churns before month 4 (before paying a single subscription invoice), that R$369/month is permanently lost from the base. Three months free with no commitment is a customer acquisition offer, not a lock-in. Trigger a partner success check-in at day 45 and day 75 of each new açougue account.

**5. Order growth rates in base and optimistic do not model seasonality**
July is low season for São Paulo outdoor events (winter). August begins improving. The peak is Sep–Nov (spring) and Dec–Jan (festas). The base case growth rates are probably conservative in the Jul–Sep window and may understate the Oct–Dec surge. This is a risk to the upside, not the downside, relative to the base projection.

**6. GM capacity is the binding constraint above 100 orders/month**
In base, the model assumes 24 GMs by Jun 2027 averaging 14 events/month each (340 orders). That's achievable but requires a structured GM recruitment pipeline from month 4 onward. Track: GMs with status "active + available" per week. If this count is growing slower than orders, you will hit a supply ceiling before financial targets.

---

*This model is a projection, not a guarantee. Revisit it monthly with actuals. The first 60 days of live data will invalidate or confirm the growth assumptions. The scenario that materializes will be visible by the end of August — which scenario you're in is a fact, not a forecast, by day 60.*

*Cross-reference: unit-economics.md (same directory) — per-order economics, LTV tables, and CAC payback analysis.*
