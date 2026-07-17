# הוראות מדויקות ל־Cursor — Google Ads Automation (IAA)

העתק את כל הבלוק למטה והדבק כ־Prompt ב־Cursor (Agent mode).

---

## PROMPT להדבקה ב־Cursor

```
אתה עובד על הריפו iaa-dispatch (Israel Air & Ambulance).

## מטרה
צור חבילת פרסום נפרדת ממערכת השיבוץ שמכינה קמפייני Google Search חוקיים בלבד:
- Exact + Phrase בלבד (בלי Broad)
- בלי שום לחיצות על מודעות מתחרים / בזבוז תקציב של אחרים
- לא לגעת ב־src/ של מערכת השיבוץ

## קמפיינים לבנות
1) IAA | Search | אמבולנס פרטי טבריה והצפון (עברית)
2) IAA | Search | הטסות רפואיות לישראל HE (עברית)
3) IAA | Search | Air Ambulance TO Israel EN (אנגלית)

## מבנה קבצים ליצור
advertising/
  README.md
  google-ads/
    generate.mjs          # סקריפט Node שמייצר את כל ה־CSV
    out/                  # פלט שנוצר אחרי הרצה
      google-ads-editor-import.csv
      keywords.csv
      negative-keywords.csv
      responsive-search-ads.csv
      keywords-paste-ambulance.txt
      keywords-paste-flights.txt
      weekly-search-terms-audit.md
      summary.json

## עדכונים נדרשים
1) ב־package.json הוסף סקריפט:
   "ads:generate": "node advertising/google-ads/generate.mjs"
2) ב־.env.example הוסף:
   ADS_LANDING_AMBULANCE_URL=https://example.com/ambulance-tiberias
   ADS_LANDING_FLIGHT_URL=https://example.com/air-ambulance-to-israel
   ADS_PHONE=+972-XX-XXX-XXXX
3) ב־.gitignore שנה `out` ל־`/out` כדי שלא ייחסם advertising/google-ads/out

## תוכן generate.mjs חייב לכלול

### אמבולנס — Exact ליבה
אמבולנס פרטי טבריה, אמבולנס פרטי בצפון, אמבולנס פרטי כנרת, אמבולנס פרטי עמק הירדן,
פינוי רפואי פרטי טבריה, העברה בין בתי חולים טבריה, אמבולנס פרטי דחוף טבריה,
אמבולנס פרטי 24 שעות טבריה, הזמנת אמבולנס פרטי טבריה, אמבולנס פרטי מחיר טבריה,
שינוע חולה פרטי טבריה, אמבולנס ALS פרטי טבריה, אמבולנס BLS פרטי טבריה

### אמבולנס — הרחבת Exact ליישובים
לכל יישוב צור Exact:
"אמבולנס פרטי {יישוב}" ו־"פינוי רפואי פרטי {יישוב}"
יישובים: טבריה, מגדל, גינוסר, יבנאל, כפר תבור, כפר כנא, רמת ישי, עפולה,
בית שאן, צפת, ראש פינה, חצור הגלילית, קצרין, חיספין, פוריה, טבריה עילית,
מנחמיה, כנרת, עמק הירדן, גליל תחתון

### אמבולנס — Phrase
"אמבולנס פרטי טבריה", "אמבולנס פרטי בצפון", "אמבולנס פרטי כנרת",
"פינוי רפואי פרטי", "העברה רפואית פרטית", "אמבולנס פרטי זמין עכשיו",
"אמבולנס פרטי לבית חולים", "אמבולנס ALS פרטי", "אמבולנס BLS פרטי",
"שינוע חולה פרטי", "העברה בין בתי חולים", "אמבולנס פרטי דחוף"

### הטסות — Exact HE
הטסה רפואית לישראל, פינוי רפואי לישראל, מטוס אמבולנס לישראל,
הטסה רפואית מחו״ל לישראל, העברה רפואית בטיסה, הטסת חולה לישראל,
פינוי אווירי רפואי, הטסה רפואית דחופה, שינוע רפואי בינלאומי לישראל,
מטוס אמבולנס פרטי לישראל

### הטסות — Phrase HE
"הטסה רפואית", "פינוי רפואי לישראל", "מטוס אמבולנס",
"העברה רפואית מחו״ל", "פינוי אווירי", "הטסת חולה",
"הטסה רפואית דחופה", "שינוע רפואי בינלאומי"

### הטסות — Exact EN
air ambulance to israel, medical flight to israel, medical evacuation to israel,
medevac to israel, private air ambulance israel, icu air ambulance to israel,
patient transfer to israel, medical repatriation to israel,
emergency medical flight to israel, international air ambulance israel

### הטסות — Phrase EN
"air ambulance to israel", "medical flight to israel", "medical evacuation to israel",
"air ambulance israel", "medical repatriation israel", "patient transfer to israel",
"private air ambulance", "icu air ambulance", "emergency medical flight"

### Negatives — Account (HE+EN)
חינם, עבודה, דרושים, משרה, קורס, קורסים, לימודים, מתנדב, התנדבות,
מדא, מד״א, צעצוע, משחק, סימולטור, ויקיפדיה, חדשות, כתבה, משכורת, שכר,
מכרז, מכרזים, הורדה, pdf,
job, jobs, career, careers, hiring, salary, course, courses, training,
volunteer, free, toy, wikipedia, news, download, reddit

### Negatives — קמפיין אמבולנס בלבד
טיסה, מטוס, הטסה, air ambulance, medical flight, חו״ל, חול, abroad

### Negatives — קמפייני הטסות בלבד
טבריה, צפת, עפולה, מונית, הסעה רגילה, taxi, ground ambulance only

### מודעות RSA
צור 5 Responsive Search Ads (כותרות + תיאורים) לקבוצות המודעות הרלוונטיות,
עם final URL מ־env וטלפון מ־env.

### פלט Editor
CSV אחד לייבוא Google Ads Editor שכולל:
Campaign (Paused, Search only, Manual CPC, budget יומי),
Ad groups, Keywords (Exact/Phrase), Ads, Campaign negatives.
Account negatives סמן עם campaign=__ACCOUNT_NEGATIVES_APPLY_MANUALLY__

### תקציבים ברירת מחדל (יומי, ניתן לשינוי)
אמבולנס: 150
הטסות HE: 200
הטסות EN: 250

## אחרי יצירת הקבצים
1) הרץ: npm run ads:generate
2) ודא שנוצרים ~98 keywords, ~62 negatives, 5 ads, 3 campaigns
3) Commit + Push בבראנץ cursor/... ופתח PR ל־main

## אסור
- Broad match
- אוטומציה שלוחצת על מודעות מתחרים
- שילוב מערכת שיווק חברתית מלאה בתוך dispatch (רק advertising/google-ads)
```

---

## הוראות שימוש אחרי שהקוד כבר קיים (במחשב שלך)

### 1) משוך את הבראנץ / ה־PR
```bash
git fetch origin
git checkout cursor/google-ads-campaign-automation-e87f
# או מזג את PR #4
```

PR קיים: https://github.com/dmrizn1-sudo/iaa-dispatch/pull/4

### 2) הגדר URL + טלפון אמיתיים
```bash
export ADS_LANDING_AMBULANCE_URL="https://YOUR-DOMAIN/ambulance-tiberias"
export ADS_LANDING_FLIGHT_URL="https://YOUR-DOMAIN/air-ambulance-to-israel"
export ADS_PHONE="+972-5X-XXXXXXX"
```

### 3) ייצר מחדש את קבצי הייבוא
```bash
npm run ads:generate
```

### 4) ייבוא ל־Google Ads Editor (מדויק)
1. הורד והתקן Google Ads Editor  
2. התחבר לחשבון Google Ads של IAA  
3. Download the account  
4. Account → Import → From file  
5. בחר: `advertising/google-ads/out/google-ads-editor-import.csv`  
6. Review changes  
7. תקן URL/טלפון אם צריך  
8. צור Shared negative keyword list מהשורות עם  
   `__ACCOUNT_NEGATIVES_APPLY_MANUALLY__`  
   ושייך לכל 3 הקמפיינים  
9. Post changes לשרת  
10. רק אחרי QA: Enable לקמפיינים (הם מגיעים כ־Paused)

### 5) ביקורת שבועית (חובה)
קובץ: `advertising/google-ads/out/weekly-search-terms-audit.md`
- ממיר → הוסף Exact  
- לא רלוונטי → Negative  
- Phrase יקר בלי המרות 14+ יום → השהה

---

## סיכום מה שכבר נבנה בפועל

| פריט | ערך |
|------|-----|
| בראנץ | `cursor/google-ads-campaign-automation-e87f` |
| PR | https://github.com/dmrizn1-sudo/iaa-dispatch/pull/4 |
| סקריפט | `advertising/google-ads/generate.mjs` |
| פקודה | `npm run ads:generate` |
| Keywords | 98 (Exact+Phrase) |
| Negatives | 62 |
| Ads | 5 RSA |
| Campaigns | 3 (Paused) |
