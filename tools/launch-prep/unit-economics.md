# Tech Churras — Unit Economics
**Version**: 1.0 | **Author**: Morgan (Financial Analyst) | **Date**: 29/06/2026
**Purpose**: Pre-launch unit economics for operator and strategic decision-making

---

## Key Assumptions

State your assumptions before your conclusions. Every number below flows from these.

| Assumption | Low | Mid | High | Source |
|---|---|---|---|---|
| GM hourly rate | R$100/h | R$130/h | R$160/h | Stated range |
| Event duration | 6h | 6h | 6h | Stated |
| GM labor per event | R$600 | R$780 | R$960 | Derived |
| Meat package value | R$800 | R$1,100 | R$1,400 | Stated (20 guests) |
| Total customer ticket | R$1,600 | R$1,900 | R$2,200 | Stated range |
| Mercado Pago fee | 3.49% + R$0.49 | same | same | Stated (production rate) |
| USD/BRL (tech costs) | 5.50 | 5.50 | 5.50 | Reference rate |
| Açougue subscription — founder (5 slots) | R$369/mo | same | same | Business model |
| Açougue subscription — standard | R$497/mo | same | same | Business model |
| Founder free period | 3 months | same | same | Business model |
| Events per açougue per month | 4 | 8 | 15 | Estimate — KEY DRIVER |
| Açougue 12-month retention | 100% | 100% | 100% | Simplified for LTV floor |
| Fixed costs scenario | Early-stage | At-scale | same | See Section 4 |

---

## 1. Revenue per Completed Order — Gross Commission

The platform collects the full customer ticket via Mercado Pago, then distributes 93% of GM labor to the GM and 90% of meat value to the açougue. The platform retains the difference.

| Component | Low | Mid | High |
|---|---|---|---|
| GM labor | R$600.00 | R$780.00 | R$960.00 |
| Platform take (7%) | R$42.00 | R$54.60 | R$67.20 |
| GM receives (93%) | R$558.00 | R$725.40 | R$892.80 |
| Meat package | R$800.00 | R$1,100.00 | R$1,400.00 |
| Platform take (10%) | R$80.00 | R$110.00 | R$140.00 |
| Açougue receives (90%) | R$720.00 | R$990.00 | R$1,260.00 |
| **Gross platform commission** | **R$122.00** | **R$164.60** | **R$207.20** |
| Gross commission as % of ticket | 7.6% | 8.7% | 9.4% |

---

## 2. Net Revenue per Order After Mercado Pago

The MP fee applies to the full customer ticket — not just the platform commission. This is the largest structural margin leak in the per-order model.

| | Low | Mid | High |
|---|---|---|---|
| Customer ticket | R$1,600.00 | R$1,900.00 | R$2,200.00 |
| MP fee (3.49% + R$0.49) | R$56.33 | R$66.80 | R$77.27 |
| Gross platform commission | R$122.00 | R$164.60 | R$207.20 |
| **Net platform revenue / order** | **R$65.67** | **R$97.80** | **R$129.93** |
| MP fee as % of gross commission | **46.2%** | **40.6%** | **37.3%** |
| Net platform margin on ticket | 4.1% | 5.1% | 5.9% |

The gateway fee consumes 37–46% of gross commission. This is not a rounding error — it is a structural cost that must be managed through ticket size, not volume.

---

## 3. Monthly Recurring Revenue — Subscription Tiers

Subscription revenue is the margin foundation. Order commissions are upside. Note that the first 3 months are free for all founder açougues — subscription MRR starts in month 4.

| Açougues Active | Configuration | Monthly Sub MRR | Annual Sub Revenue |
|---|---|---|---|
| 1 | 1 founder | R$369 | R$3,321 (9 paid months) |
| 3 | 3 founders | R$1,107 | R$9,963 |
| 5 | 5 founders (full cohort) | R$1,845 | R$16,605 |
| 10 | 5 founder + 5 standard | R$4,330 | R$38,925 |
| 20 | 5 founder + 15 standard | R$9,300 | R$83,655 |

The jump from 5 to 10 açougues (+R$2,485/mo) exceeds total fixed-cost burn at scale. At 10 açougues, subscriptions alone fund operations with surplus to reinvest.

---

## 4. Fixed Costs and Break-Even Analysis

### Monthly Fixed Cost Structure

| Line Item | Early Stage | At Scale | Notes |
|---|---|---|---|
| WhatsApp / Z-API | R$200 | R$200 | Fixed |
| Railway (backend) | R$80 | R$80 | Fixed |
| Vercel (frontend) | R$0 | R$100 | Hobby → Pro |
| Resend (email) | R$0 | R$50 | Free → paid |
| Supabase | R$0 | R$150 | Free → paid |
| Claude Haiku API | R$5 | R$15 | ~$0.075/mo at current usage |
| **Total fixed costs** | **R$285/month** | **R$595/month** | |

### Break-Even: Orders per Month Required (Mid Case, R$97.80 net/order)

| Subscription Revenue | Fixed Cost Residual | Orders to Break Even | Context |
|---|---|---|---|
| R$0 (months 1–3, free period) | R$285 | 3 orders | Early infra only |
| R$0 (months 1–3, free period) | R$595 | **7 orders** | Full at-scale infra |
| R$369 (1 founder, month 4+) | R$226 | 3 orders | |
| R$1,107 (3 founders) | −R$512 surplus | **0 orders** | Subs exceed fixed costs |
| R$1,845 (5 founders) | −R$1,250 surplus | 0 orders | R$1,250/mo from subs alone |
| R$4,330 (10 açougues) | −R$3,735 surplus | 0 orders | Subs fund growth capital |

The critical window is months 1–3: zero subscription revenue, all income from order commissions. At full at-scale infra (R$595), the platform must generate at least 7 mid-case orders per month to cover costs — before paying any growth expense, sales commissions, or founder salary.

---

## 5. LTV — One Açougue (12-Month Horizon)

LTV has two components: subscription revenue and meat order commissions. Both are stated separately because they have different risk profiles. Subscriptions are contracted; commissions depend on event frequency.

| Revenue Component | Founder (Low) | Founder (Mid) | Founder (High) | Standard (Mid) |
|---|---|---|---|---|
| Subscription revenue | R$3,321 | R$3,321 | R$3,321 | R$5,964 |
| (Basis) | 9 × R$369 | 9 × R$369 | 9 × R$369 | 12 × R$497 |
| Events / month (assumption) | 4 | 8 | 15 | 8 |
| Meat commission / event | R$110 | R$110 | R$110 | R$110 |
| Commission revenue (12 mo) | R$5,280 | R$10,560 | R$19,800 | R$10,560 |
| **Total LTV (12 months)** | **R$8,601** | **R$13,881** | **R$23,121** | **R$16,524** |

Sensitivity: if event frequency drops from 8 to 4/month, founder LTV falls 38% (R$13,881 → R$8,601). Subscriptions are the LTV floor; commissions are the upside driver.

---

## 6. CAC — Cost to Acquire One Açougue

| Cost Component | Amount | Notes |
|---|---|---|
| Sales commission (direct) | R$300 | R$150 on signature + R$150 on 1st payment |
| Overhead (rep time, materials, SP travel) | R$100–R$200 | Estimate: 3–5 in-person meetings to close |
| **Total CAC** | **R$400–R$500** | Conservative: R$500 |

### LTV:CAC Ratios

| Açougue Type | LTV (Mid) | CAC | LTV:CAC | Payback |
|---|---|---|---|---|
| Founder | R$13,881 | R$500 | **27.8x** | Month 5 (first paid sub month) |
| Standard | R$16,524 | R$500 | **33.0x** | Month 2 from first payment |

CAC payback on subscriptions alone: R$500 / R$369 = 1.4 subscription months — but effective in month 4 after the free period. Cash-on-cash payback arrives at month 5 from contract date for founder accounts.

These ratios are compelling. The risk is not in the economics of individual accounts — it is in closing enough accounts before cash runs out.

---

## Summary Scorecard

| Metric | Value |
|---|---|
| Net revenue per order — low / mid / high | R$65.67 / R$97.80 / R$129.93 |
| Gateway cost as % of gross commission | 37–46% (key structural cost) |
| Break-even orders/month — no subs, full infra | 7 orders (mid case) |
| Break-even orders/month — 3 founder subs active | 0 (subs exceed fixed costs) |
| Subscription MRR at 5 founders (month 4+) | R$1,845/month |
| Subscription MRR at 10 açougues | R$4,330/month |
| LTV per founder açougue — mid case, 12 mo | R$13,881 |
| LTV per standard açougue — mid case, 12 mo | R$16,524 |
| CAC per açougue | R$400–R$500 |
| LTV:CAC ratio — mid case | 27–33x |
| Payback period on CAC | Month 5 from contract (founder) |

---

## Top 3 Financial Risks — Launch Phase

### Risk 1: Gateway Fee Absorbs 37–46% of Gross Commission

The Mercado Pago fee (3.49% + R$0.49) is computed on the full customer ticket, not the platform's share. In the low-ticket scenario, a R$56 gateway fee against R$122 gross commission leaves only R$66 net — a 46% haircut before any operating cost.

This means the per-order business is structurally thin. A drift toward lower-value events (fewer guests, cheaper cuts, shorter events) directly compresses the only revenue line available during months 1–3.

Trigger: if average customer ticket falls below R$1,600 in month 2, initiate minimum order policy or service fee review.

### Risk 2: Zero Subscription Revenue for the First 3 Months

Every founder açougue has a 3-month free period. If all 5 sign on 06/07/2026, the first subscription invoice is not due until approximately 06/10/2026. During months 1–3, total platform revenue equals order commissions only.

At 7 orders/month (mid case), net monthly income is R$685 against R$595 in at-scale fixed costs — a R$90 monthly buffer. One slow month produces a cash deficit. There is no financial cushion built into the launch structure.

Mitigation: maintain a minimum 3-month operating reserve of R$1,800 before go-live. Alternatively, shorten the founder free period to 6 weeks, or structure it as a post-activation credit rather than a pre-activation waiver.

### Risk 3: Event Volume per Açougue Is the Central LTV Uncertainty

The mid-case 12-month founder LTV of R$13,881 assumes 8 events per açougue per month. This is market-driven and uncontracted. If realized frequency settles at 4 events/month — a plausible early-stage outcome before word-of-mouth builds — commission LTV is halved.

At 4 events/month, founder LTV drops to R$8,601. LTV:CAC compresses from 27.8x to 17.2x. Still positive, but it signals a platform activation problem: açougues onboarded without corresponding GM and customer demand are subscription accounts that generate no network effect and no commission revenue.

Trigger: monitor events per açougue monthly. If any partner falls below 3 events/month by day 60, activate a partner success intervention (GM matching, marketing co-op, local demand push).

---

*Assumptions drive conclusions. Review this model monthly and update as actuals become available. The first 90 days of live data will materially sharpen every estimate above.*
