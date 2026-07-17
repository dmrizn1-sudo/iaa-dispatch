# Weekly Search Terms Audit (automation checklist)

Run every week (Sunday recommended):

1. Google Ads → Insights and reports → Search terms
2. Filter last 7 days, cost > 0
3. For each converting term not yet Exact → add as Exact in the matching ad group
4. For each irrelevant term → add as Negative (Phrase unless brand collision risk → Exact)
5. Pause Phrase keywords with spend and 0 conversions after 14+ days (if Exact covers intent)
6. Export search terms CSV into `advertising/google-ads/out/search-terms-YYYY-MM-DD.csv` for history

## Decision rules
| Signal | Action |
|--------|--------|
| Conversions ≥ 1 | Promote to Exact |
| Irrelevant intent | Campaign/Account Negative |
| High cost, 0 conv, 14d+ | Pause or tighten match |
| Competitor brand queries | Skip unless legal/brand strategy approved |

## Do NOT
- Use Broad match at launch
- Click competitor ads
- Add Display/PMax until Search CPQL is stable
