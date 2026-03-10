# Israel Air & Ambulance — מערכת שיבוץ (RTL)

אפליקציית שיבוץ קריאות בעברית (RTL) למפעילי מוקד, בנויה עם **Next.js (App Router) + Supabase**.

## UX למפעילים (מהיר למגע)

- **שדות גדולים וכפתורים גדולים** (נוח ל‑iPad)
- **כפתור שמירה דביק בתחתית** (+ “תצוגה מקדימה”)
- **Dropdowns ניתנים לחיפוש** (קומבובוקס)
- **תצוגה מקדימה לפני אישור סופי**
- **לאחר שמירה** חוזר לדשבורד עם הודעת הצלחה ומספר קריאה

## דרישות מקדימות

- Node.js 20+ (מומלץ להתקין עם Homebrew)
- חשבון Supabase

### התקנת Node.js (macOS)

```bash
brew install node
node -v
npm -v
```

## התקנה והרצה

```bash
cd iaa-dispatch
npm install
cp .env.example .env.local
```

מלא/י ב־`.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

ואז:

```bash
npm run dev
```

האפליקציה תרוץ על `http://localhost:3000`.

## Supabase — יצירת DB

1. צור/י פרויקט Supabase חדש
2. פתח/י SQL Editor
3. הדבק/י והריץ/י את הקובץ `supabase/schema.sql`

## ניהול צי ונהגים (Admin)

- נהגים: `/admin/drivers`
  - הוספה/עריכה/הפעלה/השבתה + חיפוש
- רכבים/אמבולנסים: `/admin/vehicles`
  - הוספה/עריכה/סטטוס (פנוי/במשימה/תחזוקה) + חיפוש
  - ניהול ציוד לאמבולנס: `/admin/vehicles/[id]/equipment`

## ניהול ציוד (Equipment)

- רשימת אב ציוד: `/admin/equipment`
  - יצירה/עריכה/מחיקה של פריטי ציוד לפי קטגוריה (airway/breathing/…)
  - הגדרת סוג ציוד: BLS / ALS / both
- שיוך ציוד לאמבולנסים: `/admin/vehicles/[id]/equipment`
  - בחירת כמויות נדרשות לכל פריט לאותו רכב
- דשבורד ציוד: `/equipment`
  - בדיקה אחרונה לכל אמבולנס
  - חוסרי ציוד פעילים
  - אמבולנסים שלא נבדקו היום
- בדיקת ציוד משמרת: `/equipment/check`
  - בחירת אמבולנס + משמרת (בוקר/ערב/לילה)
  - מילוי כמויות בפועל + סימון מצב (תקין/חסר/פגום)
  - שמירת דוח בדיקת ציוד

## Supabase — אימות (Username/Password)

האפליקציה משתמשת ב‑Supabase Auth, אבל **התחברות מתבצעת עם מספר טלפון + סיסמה**.
טכנית, מספר הטלפון ממופה לאימייל פנימי בפורמט: `PHONE@phone.local`.

1. Supabase Dashboard → Authentication → Users → Add user
2. צור/י משתמש (אימייל+סיסמה)
3. התחבר/י במסך `/login`

### בקרת גישה (אישור אדמין)

- כל משתמש חדש מוגדר ב־`app_users` עם סטטוס **`pending`**
- **רק `approved`** יכולים לגשת למערכת (גם ברמת ה־UI וגם ברמת RLS בטבלאות)
- מסך אדמין: `/admin/users`

## זרימת עבודה מלאה (Dispatch)

1. **יצירת קריאה**: `/calls/new` (נוצר סטטוס `חדשה`)
2. **שיבוץ נהג+רכב**: פתח/י קריאה מתוך הדשבורד → `/calls/[id]` → “שיבוץ”
   - הסטטוס הופך ל־`שובצה`
   - הרכב מקבל סטטוס `במשימה`
   - נשלחת הודעת WhatsApp (אם הוגדר webhook)
3. **פעולות נהג**: `/driver`
   - “בדרך” → `בדרך`
   - “הגיע” → `הגיע`
   - “הסתיים” → המערכת מעבירה ל־`ממתין חשבונית` ומחזירה את הרכב ל־`פנוי`
4. **סגירה פיננסית**: `/calls/[id]/finance`
   - חובה להזין **מספר חשבונית** וגם **מספר קבלה**
   - אחרת תוצג הודעה: **"לא ניתן לסגור קריאה ללא הזנת חשבונית וקבלה"**
   - לאחר סגירה: סטטוס `נסגר`

## Audit Log

במסך הקריאה (`/calls/[id]`) מוצג Audit Log של אירועים כמו:
- `call.assigned`
- `call.status_change`
- `call.finance_updated`
- `call.closed`

### משתני סביבה הכרחיים (אדמין + הצפנת ת״ז)

בקובץ `.env.local` / ב־Vercel Environment Variables:

- `SUPABASE_SERVICE_ROLE_KEY` — נדרש ליצירת משתמשים ידנית ע״י אדמין
- `NATIONAL_ID_ENCRYPTION_KEY` — נדרש כדי לשמור תעודת זהות בצורה מוצפנת (AES‑256‑GCM)

### יצירת אדמין ראשוני (Bootstrap)

בשלב ראשון, צור/י משתמש אדמין באמצעות `/admin/users` (דורש `SUPABASE_SERVICE_ROLE_KEY`), ואז עדכן/י ב‑Supabase SQL Editor את המשתמש להיות `admin` + `approved` בתוך `app_users`.
לאחר מכן, מסך `/admin/users` מאפשר ניהול מלא.

## פריסה (Production)

מומלץ לפרוס ל‑Vercel:

- Environment Variables: אותם ערכים כמו `.env.local`
- ודא/י שב‑Supabase Authentication → URL Configuration מוגדר Site URL ל‑URL של הפריסה

---

## מדריך פריסה מלא (למשתמש לא טכני)

### A. הרצה מקומית

1. התקנת Node.js (אם עדיין לא מותקן):
   ```bash
   brew install node
   node -v
   npm -v
   ```
2. פתיחת טרמינל בתיקיית הפרויקט:
   ```bash
   cd iaa-dispatch
   npm install
   cp .env.example .env.local
   ```
3. למלא את כל הערכים הדרושים בקובץ `.env.local` (ראו סעיף C. למטה).
4. להריץ את האפליקציה:
   ```bash
   npm run dev
   ```
5. לפתוח דפדפן על `http://localhost:3000` ולוודא:
   - מסך התחברות (`/login`) נטען.
   - לאחר התחברות כאדמין, ניתן לראות את `/dashboard`.

### B. הכנת Supabase

1. להתחבר ל‑[`https://supabase.com`](https://supabase.com) וליצור פרויקט חדש.
2. אחרי יצירת הפרויקט:
   - ב‑Project Settings → API:
     - להעתיק:
       - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
       - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
       - **service role key** → `SUPABASE_SERVICE_ROLE_KEY`
3. הגדרת מסד הנתונים:
   - בתפריט הצד → **SQL Editor**
   - לפתוח את הקובץ `supabase/schema.sql` מהפרויקט.
   - להעתיק את התוכן לחלון ה‑SQL ולהריץ (Run).
4. הגדרת Auth ו‑Redirects:
   - בתפריט הצד → **Authentication → URL Configuration**
   - בשלב הפיתוח:
     - Site URL: `http://localhost:3000`
   - לאחר הפריסה ל‑Vercel (Production):
     - Site URL: `https://ה‑דומיין‑שלך.vercel.app`
5. יצירת משתמש אדמין ראשון (בטוח):
   - בתפריט הצד → **Authentication → Users → Add user**
   - ליצור משתמש עם אימייל+סיסמה (זה ישמש להתחברות הראשונה).
   - ב‑SQL Editor, להריץ שאילתה כדי לסמן אותו כ‑admin+approved בטבלת `app_users` (דוגמה בסיסית, להתאים את ה‑UUID):
     ```sql
     update app_users
     set role = 'admin', status = 'approved'
     where auth_user_id = 'UUID_של_המשתמש';
     ```
   - לאחר מכן ניתן להתחבר דרך `/login` ולנהל משתמשים נוספים דרך `/admin/users`.

### C. משתני סביבה (Environment Variables)

הקובץ `.env.example` מכיל את כל המשתנים. יש להעתיק אותו ל‑`.env.local` ולמלא ערכים אמיתיים.

המשתנים העיקריים:

- `NEXT_PUBLIC_SUPABASE_URL`  
  כתובת ה‑API של Supabase (Project URL).

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
  המפתח הציבורי (anon) של Supabase.

- `SUPABASE_SERVICE_ROLE_KEY`  
  מפתח service role (סודי!) – משמש בצד שרת בלבד ליצירת משתמשים ופעולות אדמין.

- `AUTH_SECRET`  
  מחרוזת אקראית ארוכה לחתימת סשנים/עוגיות. אפשר לייצר בעזרת:
  ```bash
  openssl rand -hex 32
  ```

- `NEXT_PUBLIC_SITE_URL`  
  ב‑Development: `http://localhost:3000`  
  ב‑Production: ה‑URL של Vercel (למשל `https://your-app.vercel.app`).

- `NATIONAL_ID_ENCRYPTION_KEY`  
  מפתח הצפנה לתעודות זהות (מומלץ 32 bytes ב‑base64).

- `INTERNAL_WEBHOOK_SECRET`  
  סוד פנימי לשליחת קריאות אל `/api/webhooks/*` (למניעת שימוש לא מורשה).

- `WHATSAPP_WEBHOOK_URL`  
  ה‑URL אליו יישלחו JSONs עבור WhatsApp (Make/Zapier/שרת חיצוני אחר).

- `WHATSAPP_WEBHOOK_SECRET`  
  סוד שנשלח בכותרת `x-iaa-webhook-secret` ל‑webhook החיצוני (אופציונלי).

- `GOOGLE_SHEETS_WEBHOOK_URL`  
  ה‑URL אליו יישלחו נתונים לעדכון Google Sheets (שרת חיצוני).

- `GOOGLE_SHEETS_WEBHOOK_SECRET`  
  סוד שנשלח בכותרת `x-iaa-webhook-secret` ל‑Google Sheets webhook (אופציונלי).

- ערכים נוספים אופציונליים (שימוש מחוץ לאפליקציה, לדוגמה ב‑Make/Zapier):
  - `WHATSAPP_TARGET_PHONE` – מספר טלפון יעד ב‑פורמט בינ״ל, לדוגמה: `+972532321101`
  - `WHATSAPP_PROVIDER` – לדוגמה: `twilio` / `360dialog` / `other`
  - `WHATSAPP_API_KEY` – מפתח סיפריית WhatsApp אם קיים.
  - `MAPS_API_KEY` – מפתח לנותן שירות מפות (Google Maps / Mapbox וכו׳), אם תבחר/י לשלב מפה חיה.

ב‑Vercel: כל משתני הסביבה מוגדרים ב‑**Project → Settings → Environment Variables** (יש לשכפל את אותם ערכים מ‑`.env.local`).

### D. העלאה ל‑GitHub (פקודות להעתקה)

בפעם הראשונה:

```bash
cd iaa-dispatch
git init
git add .
git commit -m "Initial ambulance dispatch system"
```

יצירת ריפו ב‑GitHub:
1. להיכנס ל‑GitHub → New Repository.
2. לתת שם, למשל: `iaa-dispatch`.
3. לא לסמן Initialize with README (יש כבר README בפרויקט).
4. לאחר יצירה, GitHub יציג פקודות:

```bash
git remote add origin https://github.com/YOUR_USER/iaa-dispatch.git
git branch -M main
git push -u origin main
```

להחליף `YOUR_USER` בשם המשתמש שלך.

### E. פריסה ל‑Vercel (שלב אחר שלב)

1. להתחבר ל‑[`https://vercel.com`](https://vercel.com) עם GitHub.
2. ללחוץ **"New Project"**.
3. לבחור את הריפו `iaa-dispatch` מרשימת הריפואים.
4. Vercel מזהה אוטומטית שזה פרויקט Next.js (App Router) – לא צריך לשנות הגדרות ברירת מחדל.
5. ללחוץ על לשונית **Environment Variables** לפני Deploy:
   - להוסיף את כל המשתנים שהוגדרו ב‑`.env.local` (העתקה אחד לאחד).
6. ללחוץ **Deploy**.
7. בסיום הפריסה Vercel יציג URL (למשל `https://your-app.vercel.app`).

### F. הגדרת Production סופית ובדיקות

1. לעדכן `NEXT_PUBLIC_SITE_URL` ב‑Vercel:
   - Project → Settings → Environment Variables.
   - לוודא שהערך הוא ה‑URL המלא, לדוגמה: `https://your-app.vercel.app`.
2. לעדכן ב‑Supabase:
   - Authentication → URL Configuration → Site URL = אותו URL של Vercel.
3. לבצע Redeploy:
   - ב‑Vercel → Deployments → ללחוץ Redeploy כדי לטעון את ערכי ה‑Env החדשים.

בדיקות סופיות (Production):

- **התחברות ואישורים**:
  - להתחבר כאדמין.
  - ליצור משתמש חדש דרך `/admin/users` או דרך טופס בקשה `‎/request-access`.
  - לוודא שרק משתמשים `approved` יכולים להיכנס.

- **שיבוץ וזרימת קריאה**:
  - ליצור קריאה ב־`/calls/new`.
  - לשבץ נהג+רכב מתוך `/calls/[id]`.
  - לוודא שהנהג רואה את הקריאה ב־`/driver` ומסוגל לעדכן סטטוסים.

- **סגירה פיננסית**:
  - לפתוח `/calls/[id]/finance`.
  - לוודא שלא ניתן לסגור ללא חשבונית+קבלה.

- **ציוד ותרופות**:
  - להגדיר רשימת ציוד ב־`/admin/equipment` ולשייך בצי ב־`/admin/vehicles/[id]/equipment`.
  - לבצע בדיקת ציוד ב־`/equipment/check` ולראות את התוצאה ב־`/equipment`.
  - (אם מופעל מודול תרופות) לבצע בדיקת תרופות דומה ב־`/medications/check` ולראות דשבורד ב־`/medications`.

- **מפה / GPS**:
  - אם שילבת/ה מפה חיה עם `MAPS_API_KEY`, לבדוק את תצוגת המפה (בדרך כלל בראוט `/map` או בווידג׳ט במרכז הבקרה).

- **WhatsApp / Webhooks**:
  - להגדיר `WHATSAPP_WEBHOOK_URL` בשירות חיצוני (Make/Zapier/שרת פרטי) שמטפל בשליחת הודעות.
  - ליצור קריאה חדשה או לשבץ נהג ולוודא שה־webhook החיצוני מקבל את ה‑JSON מהמערכת.

### G. פתרון תקלות (Troubleshooting) – בקצרה

- **ה‑Build נכשל (`npm run build`)**:
  - בדוק/י שאין שגיאות בקונסול (בדרך כלל TypeScript או חסר Env).
  - ודא/י ש־Node.js בגרסה 20+.

- **חסרים משתני סביבה**:
  - הודעות כמו `Missing env var` אומרות שצריך למלא ערכים ב־`.env.local` או ב‑Vercel Env.
  - השווה מול `.env.example`.

- **שגיאת חיבור ל‑Supabase**:
  - ודא/י ש־`NEXT_PUBLIC_SUPABASE_URL` ו־`NEXT_PUBLIC_SUPABASE_ANON_KEY` נכונים (לא kopi/ה חלקית).
  - ודא/י ש‑Database לא ב־paused (ב‑Supabase).

- **בעיית Redirect / התחברות**:
  - בדוק/י:
    - Site URL ב‑Supabase Auth = ה‑URL של האפליקציה.
    - `NEXT_PUBLIC_SITE_URL` ב‑Env.

- **Webhook לא עובד (WhatsApp / Sheets)**:
  - בדוק/י בשרת החיצוני את הלוגים (Make/Zapier וכו׳).
  - ודא/י ש־`WHATSAPP_WEBHOOK_URL` / `GOOGLE_SHEETS_WEBHOOK_URL` לא ריקים.
  - ודא/י שה‑`INTERNAL_WEBHOOK_SECRET` תואם גם בצד המקבל (אם משתמשים בו).

- **מפה לא מוצגת**:
  - ודא/י שיש מפתח `MAPS_API_KEY` ושנטען נכון בסקריפט המפה.
  - בדוק/י בקונסול הדפדפן שגיאות מטעינת ספריית המפות.

- **חסימת הרשאות מיקום (GPS)**:
  - בדפדפן / ב‑iOS יש לאפשר גישה למיקום.
  - אם המערכת לא מקבלת מיקום, תוצג מפה כללית בלבד ללא pinpoint מדויק.


## נקודות אינטגרציה מוכנות

### Webhooks (Outgoing) — WhatsApp + Google Sheets

בעת “אישור ושמירה” של קריאה חדשה, השרת שולח **את כל פרטי הקריאה** לשני Webhook URLs חיצוניים (למשל Make/Zapier/שרת פנימי).

#### איפה לשים את ה־Webhook URLs (בדיוק)

שים/י את ה־URLs בתוך משתני הסביבה:

- **בפיתוח מקומי**: בקובץ `.env.local` (באותה תיקייה כמו `package.json`)
- **בפרודקשן (Vercel)**: Project Settings → Environment Variables

המשתנים:

- `WHATSAPP_WEBHOOK_URL` — ה־URL שיקבל JSON ויטפל בשליחת WhatsApp
- `WHATSAPP_WEBHOOK_SECRET` — סוד אופציונלי; אם מוגדר נשלח ככותרת `x-iaa-webhook-secret`
- `GOOGLE_SHEETS_WEBHOOK_URL` — ה־URL שיסנכרן ל‑Google Sheets
- `GOOGLE_SHEETS_WEBHOOK_SECRET` — סוד אופציונלי; אם מוגדר נשלח ככותרת `x-iaa-webhook-secret`
- `NEXT_PUBLIC_SITE_URL` — כתובת האתר (למשל `http://localhost:3000` או דומיין הפרודקשן), נדרש כדי שהשרת יקרא ל־endpoints פנימיים
- `INTERNAL_WEBHOOK_SECRET` — מומלץ: סוד פנימי שנשלח בכותרת `x-iaa-internal-secret` ל־`/api/webhooks/*`

אם `*_WEBHOOK_URL` לא מוגדר/ריק — האינטגרציה **תידלג** (לא תישלח בקשה).

#### איפה ה־endpoints באפליקציה

האפליקציה כוללת endpoints פנימיים שמקבלים את פרטי הקריאה ומעבירים אותם ל‑webhook החיצוני:

- WhatsApp forwarder: `POST /api/webhooks/whatsapp`
- Google Sheets forwarder: `POST /api/webhooks/google-sheets`

#### Payload שנשלח

בכל אינטגרציה נשלח JSON בפורמט:

```json
{
  "event": "call.approved",
  "sent_at": "2026-03-10T12:34:56.789Z",
  "call": {
    "call_no": 123,
    "status": "חדשה",
    "date": "2026-03-10",
    "time": "12:34",
    "call_type": "העברת חולה חירום",
    "first_name": "ישראל",
    "last_name": "ישראלי",
    "national_id": "123456789",
    "from_place": "איכילוב",
    "to_place": "שיבא"
  }
}
```

הקוד ששולח את ה־webhooks נמצא ב־`src/lib/integrations/webhookOut.ts`, ונקרא מתוך `src/app/api/calls/route.ts`.

בנוסף, בעת שיבוץ נהג+רכב נשלח אירוע:
- `event: "call.assigned"` מתוך `src/app/api/calls/[id]/assign/route.ts`

