# Advertising — Google Ads (separate from dispatch)

חבילת פרסום **נפרדת** ממערכת השיבוץ. מייצרת קמפייני Search עם **Exact + Phrase בלבד** (בלי Broad) כדי לא לבזבז תקציב.

## מה נוצר אוטומטית

| קובץ | שימוש |
|------|--------|
| `google-ads/out/google-ads-editor-import.csv` | ייבוא ל־Google Ads Editor |
| `google-ads/out/keywords.csv` | כל מילות המפתח + match type |
| `google-ads/out/negative-keywords.csv` | Negatives ברמת חשבון/קמפיין |
| `google-ads/out/responsive-search-ads.csv` | מודעות RSA ממוקדות לידים (חייגו/WhatsApp/הצעת מחיר) |
| `google-ads/out/lead-assets.json` | Callouts + Sitelinks + נוסחת לידים |
| `google-ads/out/lead-research.md` | סיכום מחקר מתחרים → החלטות מודעה |
| `google-ads/out/keywords-paste-*.txt` | הדבקה ידנית מהירה |
| `google-ads/out/weekly-search-terms-audit.md` | ביקורת שבועית ל־Search terms |
| `google-ads/out/summary.json` | סיכום כמויות |


## קמפיינים

1. **אמבולנס פרטי טבריה והצפון** (עברית) — Exact ליישובים + Phrase מבוקר
2. **הטסות רפואיות לישראל** (עברית)
3. **Air Ambulance TO Israel** (אנגלית)

## הרצה

```bash
# אופציונלי — כתובות נחיתה ומספר אמיתיים
export ADS_LANDING_AMBULANCE_URL="https://YOUR-DOMAIN/ambulance-tiberias"
export ADS_LANDING_FLIGHT_URL="https://YOUR-DOMAIN/air-ambulance-to-israel"
export ADS_PHONE="+972-XX-XXX-XXXX"

npm run ads:generate
```

## ייבוא ל־Google Ads (צעד אחד אחרי generate)

1. התקן [Google Ads Editor](https://ads.google.com/home/tools/ads-editor/)
2. Account → Import → From file → `advertising/google-ads/out/google-ads-editor-import.csv`
3. בדוק URL + טלפון במודעות
4. החל Shared negative list מה־Account negatives (שורות עם `__ACCOUNT_NEGATIVES_APPLY_MANUALLY__`)
5. Post / Enable קמפיינים אחרי QA

הקמפיינים מיוצאים במצב **Paused** בכוונה.

## מה זה לא עושה (במכוון)

- לא לוחץ על מודעות מתחרים
- לא משתמש ב־Broad match
- לא מתחבר ל־Google Ads API בלי credentials נפרדים
- לא נוגע בקוד השיבוץ (`src/`)

## ביקורת שבועית

עקוב אחרי `out/weekly-search-terms-audit.md`: ממיר → Exact, לא רלוונטי → Negative.
