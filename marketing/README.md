# Israel Air Ambulance — International Marketing System

Complete Google Ads, SEO, landing-page, CRO, and social content system optimized for **private emergency leads**: phone calls, WhatsApp, and website form submissions for **Air Ambulance TO Israel** and **Air Ambulance FROM Israel**.

> Scope lock: do **not** advertise domestic ground ambulance, medical tourism, jobs, training, MDA/911, or B2B hospital/government tenders unless they produce private family referrals.
>
> This package lives under `/marketing` only and does **not** modify the dispatch application.

## Brand & contacts

| Field | Value |
|--------|--------|
| Brand | Israel Air Ambulance / Israel Air & Ambulance |
| Website | https://ambulancenter.com |
| Phone | 079-6709999 / +972-79-670-9999 |
| WhatsApp | **053-232-1101** / +972-53-232-1101 |
| Availability | 24/7 worldwide coordination |

## Deliverables index

### Google Ads
| File | Purpose |
|------|---------|
| [google-ads/RELAUNCH-HE.md](google-ads/RELAUNCH-HE.md) | **השקה מחדש ספט׳ 2026** — Soft Launch בעברית |
| [google-ads/relaunch-2026-09/](google-ads/relaunch-2026-09/) | Soft-launch CSVs + RSA paste + checklist |
| [google-ads/00-audit-and-rebuild-plan.md](google-ads/00-audit-and-rebuild-plan.md) | Full account audit + rebuild decision |
| [google-ads/01-campaign-structure.md](google-ads/01-campaign-structure.md) | 13 Search campaigns + Brand, geo, bidding |
| [google-ads/02-budget-optimization.md](google-ads/02-budget-optimization.md) | Budget shares, pacing, 90-day phases |
| [google-ads/keywords-database.csv](google-ads/keywords-database.csv) | Full keyword database (importable) |
| [google-ads/keywords-unique.txt](google-ads/keywords-unique.txt) | Deduped keyword list |
| [google-ads/negative-keywords.csv](google-ads/negative-keywords.csv) | Account-level negatives |
| [google-ads/negative-keywords.md](google-ads/negative-keywords.md) | Negative taxonomy + hygiene |
| [google-ads/04-responsive-search-ads.md](google-ads/04-responsive-search-ads.md) | 30 headlines · 20 descriptions · assets |
| [google-ads/05-extensions-and-assets.md](google-ads/05-extensions-and-assets.md) | Sitelinks, callouts, snippets, images, logos |
| [google-ads/07-tracking-conversions-qa.md](google-ads/07-tracking-conversions-qa.md) | GA4, GTM, calls, WhatsApp, Quality Score |

### SEO & Landing
| File | Purpose |
|------|---------|
| [seo/landing-page-recommendations.md](seo/landing-page-recommendations.md) | LP audit + CRO for emergency private leads |
| [seo/seo-roadmap.md](seo/seo-roadmap.md) | Keyword clusters, IA, 90-day SEO plan |
| [seo/country-seo-plan.md](seo/country-seo-plan.md) | Country route page strategy |
| [seo/city-seo-plan.md](seo/city-seo-plan.md) | City page tiers + templates |
| [seo/meta-titles-descriptions.md](seo/meta-titles-descriptions.md) | Titles, metas, image ALT |
| [seo/schema-recommendations.md](seo/schema-recommendations.md) | JSON-LD schema pack |
| [seo/faq-pages.md](seo/faq-pages.md) | FAQ copy for LPs + schema |
| [seo/blog-articles.md](seo/blog-articles.md) | SEO article drafts |
| [seo/emergency-guides.md](seo/emergency-guides.md) | Emergency guide outlines |

### CRO
| File | Purpose |
|------|---------|
| [cro/conversion-optimization-report.md](cro/conversion-optimization-report.md) | Funnel, UX, trust, 30-day CRO sprint |

### Social & content
| File | Purpose |
|------|---------|
| [facebook/AUTO-90D-HE.md](facebook/AUTO-90D-HE.md) | **90-day auto-publish** — 2 air + 2 ground + 1 Reel/day · token push alerts |
| [social/90-day-content-calendar.md](social/90-day-content-calendar.md) | 90-day multi-platform calendar |
| [social/weekly-posting-strategy.md](social/weekly-posting-strategy.md) | Weekly cadence + approval workflow |
| [social/monthly-growth-strategy.md](social/monthly-growth-strategy.md) | Monthly growth scorecard |
| [social/instagram-carousels.md](social/instagram-carousels.md) | Premium carousel scripts (**EN + HE**) |
| [social/facebook-posts.md](social/facebook-posts.md) | Long-form Facebook posts (**EN + HE**) |
| [social/linkedin-posts.md](social/linkedin-posts.md) | LinkedIn professional posts (**EN + HE**) |
| [social/google-business-posts.md](social/google-business-posts.md) | GBP post drafts |
| [social/hashtag-library.md](social/hashtag-library.md) | Rotating hashtag database |
| [data/posts.json](data/posts.json) | Machine-readable posts for review UI |
| [data/publish-queue-90d.json](data/publish-queue-90d.json) | 90-day publish queue (status tracked) |
| [assets/ai-images/](assets/ai-images/) | AI air-ambulance / medical aircraft images |
| [review/index.html](review/index.html) | Review desk (manual copy) |

### Data
| File | Purpose |
|------|---------|
| [data/geo.json](data/geo.json) | Priority countries + cities |
| [data/country-city-keyword-database.csv](data/country-city-keyword-database.csv) | Geo keyword matrix |
| [data/hashtags.json](data/hashtags.json) | Structured hashtag rotation |

## Primary KPI

**Qualified emergency lead** = private family / patient needing air ambulance or medical escort **to or from Israel**, measured as:

1. Phone call ≥ 60s (or key conversation)
2. WhatsApp conversation with clinical/logistics intent
3. Website lead with route + contact + urgency

Optimize for **Cost Per Qualified Lead (CPQL)**, not raw clicks.

## Regenerate assets

```bash
node marketing/tools/generate-marketing-assets.mjs
node marketing/tools/export-social-markdown.mjs
```

## Review UI (no auto-publish)

Open locally:

```bash
open marketing/review/index.html
# or serve statically
npx --yes serve marketing/review
```

Copy platform-specific copy for Instagram, Facebook, or LinkedIn after human review.

## Facebook / Instagram publishing connection

**90-day automation (pre-approved):** [facebook/AUTO-90D-HE.md](facebook/AUTO-90D-HE.md)

Hebrew step-by-step (System User — required for Instagram auto-publish):

- [facebook/CONNECT-HE.md](facebook/CONNECT-HE.md)

Local one-click helper (needs Meta App ID):

```bash
npm run marketing:facebook-connect
# open http://localhost:8787/connect.html?appId=YOUR_APP_ID
```

Publish once tokens are available (never commit tokens):

```bash
FACEBOOK_PAGE_ID=... FACEBOOK_PAGE_ACCESS_TOKEN=... \
MESSAGE="$(cat marketing/facebook/first-post-ready.txt)" \
npm run marketing:publish-facebook -- --platform facebook
```

Ready-to-paste first post (manual Business Suite fallback): [facebook/first-post-ready.txt](facebook/first-post-ready.txt)
