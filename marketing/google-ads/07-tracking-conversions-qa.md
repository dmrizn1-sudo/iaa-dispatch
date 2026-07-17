# Tracking, Conversions, Quality Score & Optimization Cadence

## 1. Conversion taxonomy

| Conversion | Platform | Priority | Counting | Window |
|------------|----------|----------|----------|--------|
| Phone call ≥ 60 seconds | Google Ads call reporting + GA4 | **Primary** | One per lead | 30d click / 1d view |
| WhatsApp click-to-chat + reply intent | GTM + GA4 | Primary/Secondary | One | 30d |
| Website lead form submit | GTM + GA4 | Primary | One | 30d |
| Click-to-call button | GA4 event | Secondary | — | — |
| LP scroll 50% | GA4 | Observation only | — | — |

**Do not** mark bounce/page_view as conversions.

## 2. GA4 recommended events

```
phone_click
call_confirmed_60s   (from call tracking provider if used)
whatsapp_click
generate_lead        (form success)
file_download        (medical questionnaire if any)
```

Parameters: `service_type` (to_israel|from_israel|icu|escort|repatriation), `page_type`, `geo_hint`.

## 3. Google Tag Manager containers

1. **Config:** GA4 Configuration tag on all pages.  
2. **Google Ads:** Conversion linker + conversion tags for form + WhatsApp + call.  
3. **Triggers:** Click URL contains `wa.me` / `whatsapp`; Click tel:; Form success thank-you or dataLayer `formSubmit`.  
4. **Consent:** Implement Consent Mode v2 if serving EU traffic (mandatory for many Priority-1 geos).

## 4. Call tracking notes

- Prefer Google forwarding numbers on Search ads **plus** site number for organic.  
- Minimum call duration threshold: **60 seconds**.  
- Train coordinators to tag: Qualified / Not qualified / Wrong service (domestic) / Spam.

## 5. Quality Score improvement loop

| QS lever | Action |
|----------|--------|
| Expected CTR | Stronger RSA CTAs; align keyword in H1/path |
| Ad relevance | 1 theme per ad group; no mixed TO+FROM keywords |
| Landing experience | Mobile speed, clear CTA, message match, HTTPS, trust |

Weekly: pull keywords with QS ≤ 5 and spend > threshold → fix or pause.

## 6. Optimization cadence

### Daily (first 21 days)
- Search terms → negatives  
- Broken URLs / zero impression ads  
- Budget pacing on P0 campaigns  

### Weekly
- CPQL by campaign / country / device  
- RSA asset report (add winners, remove weak)  
- LP conversion rate  
- Add Exact keywords from converting queries  

### Monthly
- Geo expand/cut Wave 2–3  
- Bidding strategy review (tCPA readiness)  
- Creative refresh (new image assets, new sitelinks)  
- SEO + Ads query alignment  

## 7. Baseline dashboard (track weekly)

CTR · Avg CPC · Conv. rate · CPA · **CPQL** · Call % · WhatsApp % · Form % · QS avg · Impression share (lost IS budget/rank) · Search lost IS (rank).
