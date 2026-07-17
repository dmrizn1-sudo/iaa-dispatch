# Google Ads Audit & Rebuild Plan — Israel Air Ambulance

**Objective:** Increase qualified private emergency leads (calls, WhatsApp, website forms) for Air Ambulance **TO Israel** and **FROM Israel**, while cutting wasted spend.

**Recommendation:** **Rebuild Search account structure** into dedicated intent campaigns (below). Pause or tightly restrict any campaigns that mix domestic ground ambulance, medical tourism, jobs/training queries, or broad “ambulance near me” traffic.

---

## 1. Audit checklist (run in Google Ads + GA4)

### Campaign structure
| Check | What “good” looks like | Action if failing |
|-------|------------------------|-------------------|
| Intent separation | TO Israel ≠ FROM Israel ≠ Escort ≠ ICU | Split campaigns |
| Geo alignment | High-value countries only; language matched | Rebuild geo layers |
| Brand vs non-brand | Separate brand campaign (low CPA protection) | Create brand Search |
| Domestic bleed | No Israel-only ground ambulance keywords in intl campaigns | Negatives + pause |

### Keywords & search terms
| Check | Action |
|-------|--------|
| Search terms last 90 days | Export → mark Qualified / Irrelevant / Competitor |
| Broad match waste | Move winners to Phrase/Exact; add negatives |
| QS distribution | Fix landing page + ad relevance for QS ≤ 5 |
| Israel tourism / MDA / 911 / jobs | Add account negatives immediately |

### Budgets & bidding
| Check | Action |
|-------|--------|
| Budget on low-intent geos | Reallocate to US/UK/FR/DE/CH/GR/CY/AE/TH |
| Maximize Clicks | Switch to Maximize Conversions → tCPA once ≥30 conv/30d |
| Device CPA | Bid adjust mobile if call conversion rate higher |

### Assets & ads
| Check | Action |
|-------|--------|
| Ad strength | Target “Good/Excellent” with 15+ headlines, 4 descriptions |
| Call assets | Mandatory on all campaigns; use +972 intl format |
| Sitelinks | TO / FROM / ICU / Escort / Contact |
| Image/logo | Upload brand logo + aircraft/crew approved images |

### Landing pages
| Check | Action |
|-------|--------|
| Message match | Ad “TO Israel” → LP hero “Air Ambulance TO Israel” |
| CTA | Sticky Call + WhatsApp above fold |
| Speed | LCP < 2.5s mobile |
| Trust | ICU capability, bedside-to-bedside, 24/7, testimonials |

### Tracking
| Check | Action |
|-------|--------|
| GA4 + GTM | See `07-tracking-conversions-qa.md` |
| Call tracking | Primary conversion: calls ≥ 60s |
| WhatsApp click | Secondary conversion |
| Form submit | Secondary conversion |
| Duplicate conversions | Deduplicate; don’t count page views as conv |

---

## 2. Rebuild decision matrix

| Current symptom | Decision |
|-----------------|----------|
| Mixed TO/FROM/domestic in one campaign | **Full rebuild** of Search |
| No conversion tracking reliability | Fix tracking first (1–3 days), then rebuild |
| High spend, low calls | Negatives + geo cut + RSA rewrite this week |
| Brand terms contested | Keep/create Brand campaign immediately |

**Default path for this account:** Rebuild Search into the 11 campaigns in `01-campaign-structure.md`, keep any proven Exact keywords that convert, discard Broad Match until conversion volume is stable.

---

## 3. 14-day implementation sequence

### Days 1–2 — Tracking & hygiene
1. Verify GA4, GTM, call tracking, WhatsApp events.
2. Import account negative list (`negative-keywords.csv`).
3. Exclude low-value countries / domestic ground intent.
4. Export last 90 days search terms → negative harvest.

### Days 3–5 — Structure
1. Create 11 Search campaigns (paused).
2. Build ad groups: Core + Country + City themes.
3. Upload keywords from `keywords-database.csv` (Phrase + Exact only at launch).
4. Attach shared negative lists.

### Days 6–8 — Ads & assets
1. Load RSAs from `04-responsive-search-ads.md`.
2. Add call, sitelink, callout, structured snippet, logo, images.
3. Map each ad group to matching landing URL (TO / FROM / Escort / ICU).

### Days 9–10 — Soft launch
1. Enable Priority-1 geos only (US, CA, GB, FR, DE, CH, GR, CY, AE, TH, IT).
2. Bidding: Maximize Conversions (no tCPA) for 2 weeks **or** Manual CPC if conversion volume < 15/month.
3. Daily search-term review.

### Days 11–14 — Optimize
1. Pause zero-conversion high-spend queries.
2. Add city ad groups that show impression share.
3. Align budgets to CPQL winners.
4. Document baseline: CTR, CPC, Conv rate, CPA, CPQL, QS.

---

## 4. Success metrics (30 / 60 / 90 days)

| KPI | 30-day target | 90-day target |
|-----|---------------|---------------|
| Qualified lead share of conversions | ≥ 60% | ≥ 75% |
| Wasted spend (negatives/irrelevant) | −40% vs baseline | −60% |
| CTR (Search non-brand) | ≥ 6% | ≥ 8% |
| Landing conversion rate (click→lead) | ≥ 8% | ≥ 12% |
| Ad strength | Good+ on all | Excellent majority |
| QS (top spend keywords) | ≥ 6 average | ≥ 7 average |

---

## 5. What NOT to run in paid search

- Domestic private ambulance / hospital discharge Israel-only
- Medical tourism / cosmetic / dental travel
- Jobs, EMT school, volunteer, salary
- MDA, 911, municipal EMS
- Free / DIY / definitional queries
- Government / NGO tender language

These stay in **negatives** and off landing-page H1s used by Ads.
