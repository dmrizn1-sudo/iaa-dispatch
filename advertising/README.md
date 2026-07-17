# Advertising — Google Ads (API, zero Editor)

אוטומציה מלאה ב־API. **אין Google Ads Editor. אין שלבים ידניים בקמפיין.**

## פקודה אחת
```bash
export ADS_LANDING_AMBULANCE_URL="https://ambulancenter.com/"
export ADS_LANDING_FLIGHT_URL="https://ambulancenter.com/"
export ADS_PHONE="+972-79-6709999"
export ADS_ENABLE=true   # או false להשאיר Paused אחרי יצירה

# חובה לפריסה לחשבון החי:
export GOOGLE_ADS_CLIENT_ID="..."
export GOOGLE_ADS_CLIENT_SECRET="..."
export GOOGLE_ADS_DEVELOPER_TOKEN="..."
export GOOGLE_ADS_REFRESH_TOKEN="..."
export GOOGLE_ADS_CUSTOMER_ID="1234567890"
# export GOOGLE_ADS_LOGIN_CUSTOMER_ID="..."  # אם MCC

npm run ads:all
```

`ads:all` = generate → deploy (API) → audit (search terms).

## מה ה־API יוצר אוטומטית
- Conversion actions: שיחות>60ש׳, WhatsApp click, טופס הזמנה
- Shared negative list ברמת חשבון
- 3 קמפייני Search + Exact/Phrase + RSA
- Call asset + Callouts + Sitelinks
- שפה + מיקום (ישראל)
- Audit שבועי: ממיר→Exact, זבל→Negative

## סקריפטים
| פקודה | תפקיד |
|--------|--------|
| `npm run ads:generate` | בניית CSV/JSON מקומי |
| `npm run ads:deploy` | העלאה לחשבון Google Ads |
| `npm run ads:audit` | ביקורת Search Terms אוטומטית |
| `npm run ads:all` | הכול ברצף |

## דוחות
- `out/deploy-report.json`
- `out/run-all-report.json`
- `out/qa-checklist.md`
