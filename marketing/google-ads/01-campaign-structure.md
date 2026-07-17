# Campaign Structure — Search Rebuild

Network: **Google Search only** at launch (no Display/Performance Max until Search CPQL is stable).  
Languages: English primary; FR/DE/IT/ES/EL as separate campaigns only when LP + ads exist in that language.  
Conversion goal: Phone / WhatsApp / Form (qualified private lead).

---

## 1. Campaign list (13 Search campaigns + Brand)

| # | Campaign | Priority | Landing path (recommended) | Notes |
|---|----------|----------|----------------------------|-------|
| 1 | `IAA \| Search \| Air Ambulance TO Israel` | P0 | `/air-ambulance-to-israel` | Largest private demand |
| 2 | `IAA \| Search \| Air Ambulance FROM Israel` | P0 | `/air-ambulance-from-israel` | Israelis/foreigners leaving |
| 3 | `IAA \| Search \| Medical Repatriation` | P0 | `/medical-repatriation-israel` | High intent families |
| 4 | `IAA \| Search \| International Patient Transfer` | P1 | `/international-patient-transfer` | Broader transfer language |
| 5 | `IAA \| Search \| ICU Air Ambulance` | P0 | `/icu-air-ambulance` | High AOV |
| 6 | `IAA \| Search \| Emergency Medical Flight` | P0 | `/emergency-medical-flight` | Urgency terms |
| 7 | `IAA \| Search \| Private Air Ambulance` | P1 | `/private-air-ambulance` | “Private/pay” intent |
| 8 | `IAA \| Search \| Medical Escort Flights` | P1 | `/medical-escort` | Mid-ticket |
| 9 | `IAA \| Search \| Commercial Flight Medical Escort` | P1 | `/commercial-medical-escort` | Cost-sensitive clinical cases |
| 10 | `IAA \| Search \| Stretcher Flights` | P2 | `/stretcher-flight` | Niche but high intent |
| 11 | `IAA \| Search \| Bed to Bed Medical Transport` | P2 | `/bed-to-bed` | Differentiation |
| 12 | `IAA \| Search \| Fly Patient Home` | P0 | `/fly-patient-home` | Emotional high-intent |
| 13 | `IAA \| Search \| Emergency Patient Return` | P0 | `/emergency-patient-return` | Urgency + repatriation |

**Plus (required):**  
`IAA \| Search \| Brand` — exact/phrase: israel air ambulance, israel air & ambulance, ambulancenter.

Detailed budgets: `02-budget-optimization.md`.

---

## 2. Ad group architecture (per campaign)

### Layer A — Core High Intent
Ad group: `Core — High Intent`  
Keywords: campaign theme Exact + Phrase (from CSV `ad_group = Core High Intent`).

### Layer B — Country themes (Priority countries)
Ad groups: `Country — {Country}`  
Targeting: that country (or multi-country campaign with country ad groups + location bid modifiers).  
Keywords: “air ambulance from {country} to israel”, etc.

**Launch countries (Priority 1):**  
United States, Canada, United Kingdom, France, Germany, Switzerland, Italy, Greece, Cyprus, United Arab Emirates, Thailand.

**Wave 2:** Spain, Portugal, Netherlands, Belgium, Austria, Ireland, Poland, Czech Republic, Hungary, Romania, Bulgaria, Croatia, Serbia, Montenegro, Georgia, Japan, Singapore, Australia, South Africa, Morocco.

**Wave 3:** Slovenia + remaining listed geos after CPQL proof.

### Layer C — City themes (high-traffic destinations)
Ad groups: `City — {City}` for cities in `data/geo.json`.  
Start with: New York, Miami, London, Paris, Berlin, Zurich, Rome, Athens, Heraklion, Rhodes, Santorini, Larnaca, Dubai, Bangkok, Toronto, Los Angeles, Boston, Barcelona, Amsterdam, Vienna, Chicago, Houston, Manchester.

Israel cities (Tel Aviv, Jerusalem, Haifa) appear in **ad copy & LP**, not as origin geo targeting for TO Israel campaigns.

---

## 3. Location targeting rules

| Setting | Value |
|---------|--------|
| Location options | **Presence: People in or regularly in your targeted locations** (not “interested in”) |
| Exclude | Low private-pay likelihood + conflict/sanction risk list in `geo.json` |
| Israel targeting | Allowed for FROM Israel + Brand; carefully limited for TO Israel (avoid domestic ground) |
| Radius | Optional 50–80km around major airports later; not at launch |

---

## 4. Budget framework (relative shares)

See **`02-budget-optimization.md`** for full plan. Summary share of monthly B:

| Campaign group | Share of B | Rationale |
|----------------|------------|-----------|
| TO + Repatriation + Emergency + Fly Home + Patient Return | 35% | Core demand |
| ICU + Private Air Ambulance | 18% | High value |
| FROM Israel | 14% | Distinct intent |
| Escort + Commercial Escort + Stretcher | 14% | Volume / mid-ticket |
| Bed-to-bed + Intl Transfer | 6% | Support themes |
| Brand | 5% | Protect brand |
| Testing reserve | 8% | Cities / Wave-2 |

**Daily cap rule:** No single non-brand campaign > 25% of daily budget until it proves lowest CPQL.

---

## 5. Bidding

| Stage | Strategy |
|-------|----------|
| Launch (0–30 conversions) | Maximize Conversions **or** Manual CPC with Enhanced CPC |
| Stable (≥30 conv / 30 days account) | tCPA set at 110–120% of current CPA, then tighten |
| Brand | Target Impression Share 90%+ on Exact brand |

Device: start 0% adjustments; after 14 days, +10–20% Mobile if call CVR higher.

---

## 6. Devices, schedules, audiences

- **Devices:** All; monitor Tablet separately.
- **Ad schedule:** 24/7 (emergency). Optional bid +15% evenings/weekends in US/EU.
- **Audiences (observation):** In-market Travel; Custom segments: “air ambulance”, “medical repatriation”, “icu transport”; remarketing site visitors 30d.
- **Do not** restrict to hospitals/NGOs.

---

## 7. Match type policy

- Launch: **Exact + Phrase only**
- Broad Match: only after strong negatives + Smart Bidding with reliable conversion data
- Weekly search-term mining → Exact harvest / Negative prune

---

## 8. Shared lists

| List | File |
|------|------|
| Account negatives | `negative-keywords.csv` |
| Keywords master | `keywords-database.csv` |
| Geo master | `../data/geo.json` |
| Budgets | `02-budget-optimization.md` |

---

## 9. Naming conventions

```
IAA | Search | {Campaign Theme}
  └ Ad group: Core — High Intent | Country — France | City — Paris
RSA: RSA | {Theme} | EN | v1
```
