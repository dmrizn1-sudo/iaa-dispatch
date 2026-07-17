# הוראות מדויקות ל־Cursor — הכנה + בדיקות (לידים)

העתק את כל בלוק ה־PROMPT למטה והדבק ב־Cursor (Agent mode).

---

## PROMPT — להדבקה ב־Cursor

```
אתה Agent בריפו iaa-dispatch (Israel Air & Ambulance).
מטרה: להכין מערכת פרסום Google Ads שמביאה לידים (שיחה / WhatsApp / טופס), לא רק קליקים.
עבוד רק תחת advertising/ — אל תיגע ב־src/ של מערכת השיבוץ.
אסור Broad match. אסור אוטומציה שלוחצת על מודעות מתחרים.

==================================================
חלק א׳ — מה להכין (BUILD)
==================================================

### 1) מבנה קבצים חובה
צור/עדכן:
advertising/
  README.md
  CURSOR-INSTRUCTIONS-LEADS.md   (העתק של ההוראות האלה)
  google-ads/
    generate.mjs
    out/
      google-ads-editor-import.csv
      keywords.csv
      negative-keywords.csv
      responsive-search-ads.csv
      lead-assets.json
      lead-research.md
      weekly-search-terms-audit.md
      keywords-paste-ambulance.txt
      keywords-paste-flights.txt
      summary.json
      qa-checklist.md            # צור לפי חלק ב׳

### 2) package.json + env
- הוסף: "ads:generate": "node advertising/google-ads/generate.mjs"
- ב־.env.example:
  ADS_LANDING_AMBULANCE_URL=
  ADS_LANDING_FLIGHT_URL=
  ADS_PHONE=
  ADS_WHATSAPP_URL=   (אופציונלי, קישור wa.me)
- ב־.gitignore: השתמש ב־/out (לא out גלובלי) כדי ש־advertising/google-ads/out יישמר בגיט

### 3) 3 קמפיינים Search בלבד (Paused, Manual CPC)
1. IAA | Search | אמבולנס פרטי טבריה והצפון
2. IAA | Search | הטסות רפואיות לישראל HE
3. IAA | Search | Air Ambulance TO Israel EN

תקציב יומי ברירת מחדל: 150 / 200 / 250 (ניתן לשינוי ב־env אם תרצה).

### 4) Ad Groups חובה
אמבולנס:
- Exact — ליבה מקומית
- Exact — לידים חמים פוריה/מחיר/דיאליזה
- Phrase — הרחבה מבוקרת

הטסות HE:
- Exact — הטסות לישראל
- Exact — לידים הצעת מחיר/חילוץ
- Phrase — הטסות לישראל

הטסות EN:
- Exact — TO Israel
- Exact — Lead Quote/Bed-to-Bed
- Phrase — TO Israel

### 5) מילות מפתח — Exact + Phrase בלבד

#### אמבולנס Exact ליבה + יישובים
לכל יישוב צור:
[אמבולנס פרטי {יישוב}]
[פינוי רפואי פרטי {יישוב}]
יישובים: טבריה, מגדל, גינוסר, יבנאל, כפר תבור, כפר כנא, רמת ישי, עפולה, בית שאן, צפת, ראש פינה, חצור הגלילית, קצרין, חיספין, פוריה, טבריה עילית, מנחמיה, כנרת, עמק הירדן, גליל תחתון

ליבה נוספת:
אמבולנס פרטי טבריה/בצפון/כנרת/עמק הירדן, פינוי רפואי פרטי טבריה,
העברה בין בתי חולים טבריה, אמבולנס פרטי דחוף/24 שעות/מחיר/הזמנה טבריה,
שינוע חולה פרטי טבריה, ALS/BLS פרטי טבריה,
טלפון אמבולנס פרטי טבריה, הזמנת אמבולנס פרטי עכשיו, אמבולנס פרטי וואטסאפ

#### אמבולנס Exact לידים חמים (חובה — זה מה שממיר לפי מחקר)
אמבולנס פרטי פוריה
אמבולנס מבית חולים פוריה
שחרור מבית חולים טבריה אמבולנס
העברה מפוריה לבית
העברה בין בתי חולים פוריה
אמבולנס לדיאליזה טבריה
הסעת דיאליזה טבריה
אמבולנס לאונקולוגיה טבריה
העברת חולה מטבריה לתל אביב
אמבולנס פרטי מטבריה לחיפה
הצעת מחיר אמבולנס פרטי טבריה
מחיר אמבולנס פרטי טבריה
אמבולנס פרטי זמין עכשיו טבריה
הזמנת אמבולנס לפוריה

#### אמבולנס Phrase
אמבולנס פרטי טבריה/בצפון/כנרת, פינוי רפואי פרטי, העברה רפואית פרטית,
אמבולנס פרטי זמין עכשיו/לבית חולים/דחוף, ALS/BLS פרטי, שינוע חולה פרטי,
העברה בין בתי חולים, הזמנת אמבולנס פרטי, אמבולנס פרטי מחיר,
שחרור מבית חולים אמבולנס, הסעת דיאליזה אמבולנס, אמבולנס פרטי פוריה,
הצעת מחיר אמבולנס פרטי

#### הטסות HE Exact
הטסה רפואית לישראל, פינוי רפואי לישראל, מטוס אמבולנס לישראל,
הטסה רפואית מחו״ל לישראל, העברה רפואית בטיסה, הטסת חולה לישראל,
פינוי אווירי רפואי, הטסה רפואית דחופה, שינוע רפואי בינלאומי לישראל,
מטוס אמבולנס פרטי לישראל,
הצעת מחיר הטסה רפואית, מחיר מטוס אמבולנס לישראל,
ליווי רפואי בטיסה לישראל, bed to bed לישראל,
חילוץ רפואי מחו״ל לישראל, קרוב משפחה חולה בחו״ל הטסה

#### הטסות HE Phrase
הטסה רפואית, פינוי רפואי לישראל, מטוס אמבולנס, העברה רפואית מחו״ל,
פינוי אווירי, הטסת חולה, הטסה רפואית דחופה, שינוע רפואי בינלאומי,
הצעת מחיר הטסה רפואית, ליווי רפואי בטיסה, מטוס אמבולנס מחיר, חילוץ רפואי מחו״ל

#### הטסות EN Exact
air ambulance to israel, medical flight to israel, medical evacuation to israel,
medevac to israel, private air ambulance israel, icu air ambulance to israel,
patient transfer to israel, medical repatriation to israel,
emergency medical flight to israel, international air ambulance israel,
air ambulance quote israel, bed to bed air ambulance israel,
medical escort to israel, medical flight cost to israel,
fly patient home to israel, air ambulance tel aviv

#### הטסות EN Phrase
air ambulance to israel, medical flight to israel, medical evacuation to israel,
air ambulance israel, medical repatriation israel, patient transfer to israel,
private air ambulance, icu air ambulance, emergency medical flight,
air ambulance quote, bed to bed medical transport, medical escort flight,
medical flight cost

### 6) Negatives

Account (HE+EN):
חינם, עבודה, דרושים, משרה, קורס/ים, לימודים, מתנדב/התנדבות, מדא/מד״א,
צעצוע, משחק, סימולטור, ויקיפדיה, חדשות, כתבה, משכורת, שכר, מכרז/ים, הורדה, pdf,
job/s, career/s, hiring, salary, course/s, training, volunteer, free(Exact),
toy, wikipedia, news, download, reddit

קמפיין אמבולנס בלבד:
טיסה, מטוס, הטסה, air ambulance, medical flight, חו״ל, חול, abroad

קמפייני הטסות בלבד:
טבריה, צפת, עפולה, מונית, הסעה רגילה, taxi, ground ambulance only

Account negatives בייצוא Editor: סמן campaign=__ACCOUNT_NEGATIVES_APPLY_MANUALLY__

### 7) מודעות RSA — חובה לידים (לפי מחקר מתחרים)
לכל Ad Group צור RSA עם 12–15 כותרות + 4 תיאורים.

נוסחת ליד חובה בכל מודעה:
1. CTA ראשי = חייגו עכשיו / Call now (עם מספר מ־ADS_PHONE בתיאור)
2. CTA משני = WhatsApp
3. 24/7 + מענה אנושי
4. כוונת שירות ספציפית (פוריה/שחרור/דיאליזה או Quote/Bed-to-Bed/Escort)
5. הבטחת תוצאה בשיחה אחת: הזמנה או הצעת מחיר

דוגמאות כותרות אמבולנס (חובה לשלב בסגנון הזה):
- חייגו עכשיו — אמבולנס טבריה
- אמבולנס מפוריה — חייגו
- שחרור מבית חולים עכשיו
- הצעת מחיר בטלפון
- WhatsApp להזמנה מהירה
- הזמנה בטלפון 24/7

דוגמאות כותרות הטסות:
- הטסה רפואית — חייגו עכשיו
- הצעת מחיר הטסה רפואית
- Call Now — Flight to Israel
- Get a Quote in Minutes
- Bed-to-Bed Medical Flight
- Air Ambulance Quote Israel

תיאורים חייבים לכלול מספר טלפון אמיתי מ־env ולדחוף לשיחה/וואטסאפ, לא רק "מידע".

### 8) lead-assets.json — חובה
כלול:
- callouts_he / callouts_en
- sitelinks_he / sitelinks_en (הזמנה, הצעת מחיר, פוריה, הטסה / Get a Quote, Air Ambulance, Medical Escort, WhatsApp)
- lead_formula
- conversion_setup
- research_sources

### 9) Conversion setup לתעד ב־lead-research.md
חובה לרשום ולוודא שהמשתמש יגדיר בחשבון:
- Phone calls from ads > 60 seconds = conversion
- WhatsApp click = conversion (GTM/event)
- Form submit בדף הזמנה = conversion ראשי
- עד שיש 30+ המרות/חודש: Manual CPC + Exact; אחר כך אפשר Maximize Conversions
- בדף נחיתה: טלפון דביק במובייל + כפתור WhatsApp מעל הקפל

### 10) הרצה
הרץ:
export ADS_LANDING_AMBULANCE_URL="https://ambulancenter.com/"   # או דף ייעודי אם קיים
export ADS_LANDING_FLIGHT_URL="https://ambulancenter.com/"
export ADS_PHONE="+972-79-6709999"   # או המספר העדכני מהעסק
npm run ads:generate

יעד מינימלי אחרי generate:
- keywords >= 130
- negatives >= 60
- ads >= 9
- campaigns = 3
- כל המודעות עם CTA טלפון/WhatsApp

Commit + push + PR ל־main.

==================================================
חלק ב׳ — מה לבדוק (QA CHECKLIST)
==================================================

צור את הקובץ advertising/google-ads/out/qa-checklist.md ועבור עליו אחד־אחד.
סמן PASS/FAIL לכל סעיף. אם FAIL — תקן לפני סיום.

### A. קבצים וסקריפט
[ ] A1 קיים advertising/google-ads/generate.mjs
[ ] A2 npm run ads:generate רץ בלי שגיאה
[ ] A3 נוצרים כל קבצי out/ הרשומים למעלה
[ ] A4 summary.json משקף את הכמויות בפועל
[ ] A5 אין Broad match באף keyword (רק Exact/Phrase)

### B. מבנה קמפיינים
[ ] B1 בדיוק 3 קמפיינים Search
[ ] B2 כולם Paused בייצוא
[ ] B3 Manual CPC
[ ] B4 Networks = Google search only (בלי Display)
[ ] B5 Ad groups לפי הרשימה בחלק א׳ (כולל לידים חמים)

### C. מילות מפתח לידים
[ ] C1 יש Exact לפוריה / שחרור / דיאליזה / מחיר / הזמנה
[ ] C2 יש Exact להצעת מחיר הטסה / bed to bed / ליווי רפואי / quote / escort
[ ] C3 יש הרחבת Exact ליישובי צפון
[ ] C4 אין כפילויות מיותרות באותו ad group+match
[ ] C5 CPC ללידים חמים גבוה יותר מ־Phrase הרגיל

### D. Negatives
[ ] D1 Account negatives כוללים עבודה/דרושים/קורס/מד״א/job/salary
[ ] D2 קמפיין אמבולנס חוסם טיסה/מטוס/הטסה
[ ] D3 קמפייני הטסות חוסמים טבריה/מונית/taxi
[ ] D4 Account negatives מסומנים ליישום ידני ברמת חשבון

### E. מודעות = לידים (הכי חשוב)
[ ] E1 בכל RSA יש לפחות 3 כותרות עם CTA שיחה/הזמנה/Quote
[ ] E2 בכל תיאורי RSA מופיע מספר טלפון מ־ADS_PHONE
[ ] E3 יש אזכור WhatsApp בלפחות מודעה אחת לכל קמפיין
[ ] E4 יש אזכור 24/7 בכל קבוצת מודעות
[ ] E5 מודעות אמבולנס מזכירות פוריה או שחרור או דיאליזה או מחיר
[ ] E6 מודעות הטסה מזכירות הצעת מחיר או Bed-to-Bed או case review
[ ] E7 אין הבטחות רפואיות אסורות / טענות רגולטוריות לא מאומתות
[ ] E8 path1/path2 קצרים ותקינים
[ ] E9 final_url לא example.com אחרי שהוגדר env אמיתי

### F. נכסי לידים (Assets)
[ ] F1 lead-assets.json כולל callouts HE+EN
[ ] F2 sitelinks להזמנה / הצעת מחיר / פוריה או Quote / Escort / WhatsApp
[ ] F3 lead-research.md מסביר נוסחת ליד + מקורות
[ ] F4 qa-checklist.md קיים וממולא

### G. המרות ודף נחיתה (בדיקה לוגית + הנחיות למשתמש)
[ ] G1 מתועד: שיחות >60 שנ׳ = conversion
[ ] G2 מתועד: WhatsApp click = conversion
[ ] G3 מתועד: שליחת טופס הזמנה = conversion
[ ] G4 מתועד: במובייל חייב טלפון דביק + WhatsApp מעל הקפל
[ ] G5 מומלץ URL ייעודי לאמבולנס טבריה ו־URL ייעודי להטסות (לא רק הומפייג׳ אם אפשר)

### H. ייבוא Google Ads Editor — צ׳קליסט הפעלה
כתוב למשתמש לבדוק ידנית אחרי Import:
[ ] H1 Import של google-ads-editor-import.csv עבר בלי שגיאות קריטיות
[ ] H2 Shared negative list ברמת Account הוחל על 3 הקמפיינים
[ ] H3 Call asset / Phone extension מחובר למספר העסקי
[ ] H4 Sitelinks + Callouts הועלו מה־lead-assets.json
[ ] H5 Location targeting נכון:
     - אמבולנס: ישראל / צפון / רדיוס טבריה
     - הטסות EN: מדינות מקור רלוונטיות (לא רק ישראל) לפי אסטרטגיה
[ ] H6 Language: HE לקמפיינים עבריים, EN לאנגלי
[ ] H7 Conversion tracking פעיל לפני Enable
[ ] H8 רק אחרי כל PASS → Enable קמפיין אחד־אחד (קודם Exact לידים חמים)

### I. בדיקת איכות אחרי 7 ימים (לכתוב ב־weekly-search-terms-audit.md)
[ ] I1 Search terms: ממיר → Exact
[ ] I2 לא רלוונטי → Negative
[ ] I3 Phrase עם הוצאה בלי לידים 14 יום → השהה/הדק
[ ] I4 CTR נמוך במודעה → החלף כותרות CTA
[ ] I5 שיחות קצרות (<30 שנ׳) → בדוק התאמת מודעה/דף/שעות מוקד
[ ] I6 Cost/lead גבוה → שמור רק Exact לידים חמים + הורד Phrase

==================================================
חלק ג׳ — סדר עבודה מומלץ ל־Cursor
==================================================
1. בנה/עדכן generate.mjs לפי חלק א׳
2. הרץ ads:generate
3. מלא qa-checklist.md (חלק ב׳) — כל סעיף PASS/FAIL
4. אם FAIL — תקן ו־generate שוב
5. Commit + Push + PR
6. בסיכום למשתמש: מה הוכן, כמה keywords/ads, ואילו בדיקות H/G הוא חייב לעשות ידנית בחשבון Google Ads

התחל עכשיו. אל תעצור אחרי יצירת קבצים — חובה גם generate וגם qa-checklist ממולא.
```

---

## שימוש מהיר

1. פתח Cursor → Agent  
2. הדבק את כל ה־PROMPT  
3. אחרי שהוא מסיים — בדוק את `advertising/google-ads/out/qa-checklist.md`  
4. רק אם הכל PASS → ייבוא ל־Google Ads Editor לפי סעיף H  
