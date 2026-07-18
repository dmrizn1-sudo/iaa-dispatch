# חיבור פייסבוק לפרסום — Israel Air & Ambulance

תיק עסקי: `217437055935244`  
דף: **Israel air&ambulance**

יש **3 דרכים**. מומלץ להתחיל ב־**דרך 1** (System User) — הכי מתאימה לתיק עסקי.

**התראת דחיפה לפני פקיעה:** אחרי שמוסיפים את הטוקן ל־GitHub Secret, מערכת `IAA Meta Token Watch` שולחת דחיפה לטלפון (ntfy) ב־14/7/3/1 ימים ולפני 6 שעות.  
הרשמה: https://ntfy.sh/iaa-meta-token-alerts · פירוט ב־[AUTO-90D-HE.md](./AUTO-90D-HE.md)

---

## דרך 1 — System User בתיק העסקי (מומלץ)

זו הדרך הנכונה לעסקים. לא צריך Graph API Explorer.

### שלב א׳ — יצירת משתמש מערכת
1. היכנס ל־https://business.facebook.com/settings  
2. בחר את התיק העסקי (מזהה `217437055935244`)  
3. בתפריט השמאלי: **משתמשים** → **משתמשי מערכת** (Users → System users)  
4. **הוסף** → צור משתמש מערכת  
   - שם: `IAA Publisher`  
   - תפקיד: **Admin** (או Employee עם הרשאות תוכן)

### שלב ב׳ — שיוך הדף
1. על המשתמש החדש → **הוסף נכסים** (Add assets)  
2. בחר **דפים** → סמן **Israel air&ambulance**  
3. הרשאה: **שליטה מלאה** או לפחות ניהול תוכן / פרסום

### שלב ג׳ — שיוך אינסטגרם (אם קיים)
1. אותו מסך → **חשבונות Instagram**  
2. סמן את חשבון ה־IG המקושר לדף  
3. תן הרשאת תוכן

### שלב ד׳ — יצירת טוקן
1. על המשתמש → **Generate token** / **צור אסימון**  
2. בחר את האפליקציה (אם אין — צור App מסוג Business ב־developers.facebook.com ושייך לתיק)  
3. סמן הרשאות:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
   - `instagram_basic` (אם IG)
   - `instagram_content_publish` (אם IG)
4. **Generate** → העתק את הטוקן (מתחיל ב־`EAA...`)

### שלב ה׳ — מציאת Page ID
באותו מסך נכסים, או ב־פייסבוק → הדף → אודות → שקיפות בדף → **מזהה דף**.

### שלב ו׳ — שליחה לסוכן
הדבק בצ'אט:

```
FACEBOOK_PAGE_ID=...
FACEBOOK_PAGE_ACCESS_TOKEN=EAA...
INSTAGRAM_USER_ID=...   (אופציונלי)
```

אחרי זה הסוכן מפרסם עם הסקריפט `marketing/tools/publish-facebook.mjs`.

---

## דרך 2 — דף חיבור מקומי (לחיצה אחת)

1. צור App ב־https://developers.facebook.com → Other → Business  
2. הוסף מוצר **Facebook Login**  
3. ב־App settings → הוסף `http://localhost:8787` ל־Valid OAuth Redirect URIs / App Domains  
4. העתק את **App ID**  
5. הרץ:

```bash
npm run marketing:facebook-connect
```

6. פתח בדפדפן: http://localhost:8787/connect.html?appId=YOUR_APP_ID  
7. לחץ **התחבר לפייסבוק** → בחר את הדף → העתק את הטוקן שמוצג

---

## דרך 3 — פרסום ידני היום (בלי טוקן)

אם צריך לפרסם עכשיו בלי API:

1. https://business.facebook.com/  
2. **תוכן** / Creator Studio / הדף → **צור פוסט**  
3. העתק טקסט מ־`marketing/social/facebook-posts.md`  
4. פרסם / תזמן

---

## בדיקת טוקן

https://developers.facebook.com/tools/debug/accesstoken/

| שדה | חייב להיות |
|-----|------------|
| Type | **PAGE** או System User עם גישה לדף |
| Scopes | `pages_manage_posts` לפחות |
| Expires | כמה שיותר ארוך |

---

## אבטחה

- אל תיתן לסוכן "שליטה מלאה" על התיק — רק טוקן פרסום  
- אחרי השימוש אפשר לבטל טוקן וליצור חדש  
- אל תעלה טוקנים ל־Git
