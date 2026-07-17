# QA Checklist — fully automated pipeline

Updated: 2026-07-17T16:54:15.263Z

## Automated locally (this run)
- [x] Generate keywords/ads/negatives/RSA
- [x] ads:all orchestrator executed
- [ ] API deploy to Google Ads
- [ ] API search-terms audit

## Deploy status
```json
{
  "status": "blocked_missing_credentials",
  "missing_env": [
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID"
  ],
  "warnings": []
}
```

## What replaces manual Editor (H1–H8)
`npm run ads:deploy` creates via API:
conversion actions, shared negatives, campaigns, ad groups, keywords, RSA, call/sitelink/callout assets, geo+language.

## Credentials required once (env/secrets — not Editor clicks)
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_REFRESH_TOKEN
GOOGLE_ADS_CUSTOMER_ID
GOOGLE_ADS_LOGIN_CUSTOMER_ID (optional MCC)
ADS_PHONE / ADS_LANDING_* / ADS_ENABLE

Then: `npm run ads:all`
