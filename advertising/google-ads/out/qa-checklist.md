# QA Checklist — Lead Ads (fill PASS/FAIL)

Generated for Cursor + human review before enabling campaigns.

## A. Files & script
- [ ] A1 generate.mjs exists
- [ ] A2 `npm run ads:generate` succeeds
- [ ] A3 all out/ files present
- [ ] A4 summary.json matches counts
- [ ] A5 no Broad match

## B. Campaign structure
- [ ] B1 exactly 3 Search campaigns
- [ ] B2 all Paused in export
- [ ] B3 Manual CPC
- [ ] B4 Google Search only
- [ ] B5 lead ad groups present (Poria/price/dialysis + quote/bed-to-bed)

## C. Lead keywords
- [ ] C1 Exact: פוריה / שחרור / דיאליזה / מחיר / הזמנה
- [ ] C2 Exact: הצעת מחיר / bed to bed / ליווי / quote / escort
- [ ] C3 North locality Exact expansion
- [ ] C4 no duplicate keyword+match in same ad group
- [ ] C5 lead Exact CPC > Phrase CPC

## D. Negatives
- [ ] D1 account junk/jobs/courses blocked
- [ ] D2 ambulance campaign blocks flight terms
- [ ] D3 flight campaigns block local taxi/Tiberias leakage
- [ ] D4 account negatives marked for manual shared list

## E. Ads = leads
- [ ] E1 ≥3 call/quote CTA headlines per RSA
- [ ] E2 phone from ADS_PHONE in every RSA description set
- [ ] E3 WhatsApp mentioned per campaign
- [ ] E4 24/7 in every ad group
- [ ] E5 ambulance ads mention Poria/discharge/dialysis/price
- [ ] E6 flight ads mention quote/Bed-to-Bed/case review
- [ ] E7 no unverified medical claims
- [ ] E8 valid path1/path2
- [ ] E9 final_url not example.com when env set

## F. Lead assets
- [ ] F1 callouts HE+EN in lead-assets.json
- [ ] F2 sitelinks for book/quote/Poria or Quote/Escort/WhatsApp
- [ ] F3 lead-research.md present
- [ ] F4 this checklist present

## G. Conversions & landing (must configure in Google Ads / site)
- [ ] G1 calls >60s conversion
- [ ] G2 WhatsApp click conversion
- [ ] G3 booking form conversion
- [ ] G4 mobile sticky phone + WhatsApp above fold
- [ ] G5 dedicated LPs preferred (ambulance vs flights)

## H. Editor go-live
- [ ] H1 CSV import clean
- [ ] H2 account shared negatives applied
- [ ] H3 call asset live
- [ ] H4 sitelinks/callouts uploaded
- [ ] H5 location targeting correct
- [ ] H6 language correct
- [ ] H7 conversions live before Enable
- [ ] H8 enable Exact lead groups first

## I. Day-7 optimization
- [ ] I1 converters → Exact
- [ ] I2 junk → Negative
- [ ] I3 expensive Phrase 0-lead → pause
- [ ] I4 weak CTA ads → rewrite
- [ ] I5 short calls → check LP/hours
- [ ] I6 high CPL → keep hot Exact only
