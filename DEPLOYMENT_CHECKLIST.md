## צ'ק ליסט לפריסה (Ambulance Dispatch)

1. התקנת כלים מקומיים
   - התקן/י Node.js 20+
   - התקן/י Git

2. הורדת הקוד והרצה מקומית
   - לפתוח טרמינל בתיקיית `iaa-dispatch`
   - להריץ:
     - `npm install`
     - `cp .env.example .env.local`
   - למלא את כל משתני הסביבה ב־`.env.local`
   - להריץ:
     - `npm run dev`
   - לפתוח דפדפן ב־`http://localhost:3000`

3. יצירת פרויקט Supabase
   - להתחבר ל־https://supabase.com
   - ליצור פרויקט חדש
   - להעתיק:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - service role key → `SUPABASE_SERVICE_ROLE_KEY`
   - ב־SQL Editor:
     - לפתוח את קובץ `supabase/schema.sql`
     - להעתיק ולהריץ

4. הגדרת Supabase Auth
   - ב־Authentication → URL Configuration:
     - Site URL = ה־URL של Vercel (אח"כ) או `http://localhost:3000` לפיתוח
   - ליצור משתמש אדמין ראשון:
     - Authentication → Users → Add user
     - לבחור אימייל+סיסמה
   - להריץ עדכון ב־SQL כדי לסמן אותו כ־`admin` + `approved` בטבלת `app_users`

5. הגדרת משתני סביבה (Env)
   - בקובץ `.env.local` למלא:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `AUTH_SECRET`
     - `NEXT_PUBLIC_SITE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NATIONAL_ID_ENCRYPTION_KEY`
     - `INTERNAL_WEBHOOK_SECRET`
     - `WHATSAPP_WEBHOOK_URL` / `GOOGLE_SHEETS_WEBHOOK_URL` (אם רוצים אינטגרציות)

6. בדיקת Build מקומי
   - להריץ:
     - `npm run lint`
     - `npm run build`
   - לוודא שאין שגיאות

7. GitHub
   - בטרמינל:
     - `git init`
     - `git add .`
     - `git commit -m "Initial ambulance dispatch system"`
   - ליצור ריפו חדש ב־GitHub ולהגדיר origin
   - לדוגמה:
     - `git remote add origin https://github.com/YOUR_USER/iaa-dispatch.git`
     - `git push -u origin main`

8. פריסה ב־Vercel
   - להתחבר ל־https://vercel.com
   - ללחוץ "New Project" → לבחור את ריפו GitHub
   - ב־Environment Variables:
     - להכניס את אותם ערכים מ־`.env.local`
   - ללחוץ Deploy

9. הגדרת כתובת אתר (Production)
   - לאחר פריסה, להעתיק את ה־URL של Vercel (למשל `https://your-app.vercel.app`)
   - לעדכן:
     - `NEXT_PUBLIC_SITE_URL` ב־Vercel Env
     - Site URL ב־Supabase Auth → URL Configuration
   - לבצע Redeploy ב־Vercel

10. בדיקות סופיות
   - להתחבר כ־admin
   - לבדוק:
     - התחברות/התנתקות
     - אישור משתמש חדש
     - יצירת קריאה + שיבוץ + מסך נהג
     - סגירה פיננסית
     - בדיקת ציוד + דשבורד ציוד
     - בדיקת שה־webhooks (WhatsApp/Sheets) עובדים (אם מוגדרים)

