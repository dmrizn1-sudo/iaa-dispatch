# QA Checklist — Lead Ads (filled 2026-07-17)

Status: **BUILD PASS** — ready for Google Ads Editor import after human H/G setup.

## A. Files & script
- [x] A1 PASS — generate.mjs exists
- [x] A2 PASS — `npm run ads:generate` succeeds
- [x] A3 PASS — all out/ files present
- [x] A4 PASS — summary.json matches counts (142 kw / 62 neg / 9 ads / 3 camps)
- [x] A5 PASS — Exact/Phrase only (no Broad)

## B. Campaign structure
- [x] B1 PASS — 3 Search campaigns
- [x] B2 PASS — all Paused
- [x] B3 PASS — Manual CPC
- [x] B4 PASS — Google Search only
- [x] B5 PASS — lead ad groups present (Poria/price/dialysis + quote/bed-to-bed)

## C. Lead keywords
- [x] C1 PASS — Exact: פוריה / שחרור / דיאליזה / מחיר / הזמנה
- [x] C2 PASS — Exact: הצעת מחיר / bed to bed / ליווי / quote / escort
- [x] C3 PASS — North locality Exact expansion
- [x] C4 PASS — no duplicate keyword+match in same ad group
- [x] C5 PASS — lead Exact CPC (min 40) > Phrase CPC (max 34)

## D. Negatives
- [x] D1 PASS — account junk/jobs/courses blocked
- [x] D2 PASS — ambulance campaign blocks flight terms
- [x] D3 PASS — flight campaigns block local taxi/Tiberias leakage
- [x] D4 PASS — account negatives marked `__ACCOUNT_NEGATIVES_APPLY_MANUALLY__`

## E. Ads = leads
- [x] E1 PASS — ≥3 call/quote CTA headlines per RSA
- [x] E2 PASS — phone `+972-79-6709999` in every RSA description set
- [x] E3 PASS — WhatsApp mentioned per campaign
- [x] E4 PASS — 24/7 in every ad group
- [x] E5 PASS — ambulance ads mention Poria/discharge/dialysis/price
- [x] E6 PASS — flight ads mention quote/Bed-to-Bed/case review
- [x] E7 PASS — no unverified medical cure claims in copy
- [x] E8 PASS — valid path1/path2
- [x] E9 PASS — final_url = https://ambulancenter.com/ (not example.com)

## F. Lead assets
- [x] F1 PASS — callouts HE+EN in lead-assets.json
- [x] F2 PASS — sitelinks for book/quote/Poria + Quote/Escort/WhatsApp
- [x] F3 PASS — lead-research.md present
- [x] F4 PASS — this checklist filled

## G. Conversions & landing — **HUMAN ACTION REQUIRED**
- [ ] G1 TODO in Google Ads — calls >60s conversion
- [ ] G2 TODO on site/GTM — WhatsApp click conversion
- [ ] G3 TODO — booking form conversion
- [ ] G4 TODO on LP — mobile sticky phone + WhatsApp above fold
- [ ] G5 RECOMMENDED — dedicated LPs (ambulance vs flights) instead of homepage only

Documented in `lead-research.md` / `lead-assets.json`.

## H. Editor go-live — **HUMAN ACTION REQUIRED**
- [ ] H1 Import `google-ads-editor-import.csv`
- [ ] H2 Apply account shared negatives
- [ ] H3 Connect call asset to business phone
- [ ] H4 Upload sitelinks/callouts from lead-assets.json
- [ ] H5 Location targeting (North for ambulance; origin countries for EN flights)
- [ ] H6 Language HE/EN
- [ ] H7 Conversions live before Enable
- [ ] H8 Enable Exact lead groups first

## I. Day-7 optimization — **AFTER LIVE**
- [ ] I1 converters → Exact
- [ ] I2 junk → Negative
- [ ] I3 expensive Phrase 0-lead → pause
- [ ] I4 weak CTA ads → rewrite
- [ ] I5 short calls → check LP/hours
- [ ] I6 high CPL → keep hot Exact only

## Generate command used
```bash
export ADS_LANDING_AMBULANCE_URL="https://ambulancenter.com/"
export ADS_LANDING_FLIGHT_URL="https://ambulancenter.com/"
export ADS_PHONE="+972-79-6709999"
npm run ads:generate
```
