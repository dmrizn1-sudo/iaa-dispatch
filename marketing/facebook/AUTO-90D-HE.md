# פרסום אוטומטי 90 יום — פייסבוק + אינסטגרם

**אישור מראש:** 3 חודשים · **2 פוסטים ביום** · כל פוסט **אנגלית + עברית** · פלטפורמות: Facebook + Instagram.

שעות ברירת מחדל (שעון ישראל): **10:00** ו־**18:00**.

---

## מה רץ אוטומטית

| פלטפורמה | איך |
|----------|-----|
| **Facebook** | תור 90 יום. Meta מאפשרת תזמון ~30 יום קדימה — לכן **58 פוסטים הראשונים כבר תוזמנו**, וה־GitHub Action מרחיב את החלון כל יום (`--roll-facebook`). |
| **Instagram** | אין תזמון מובנה ב־API. אותו Action מפרסם בזמן מהתור (`--instagram`). |

תור: `marketing/data/publish-queue-90d.json`  
האשטגים באינסטגרם: חובה EN + HE בסוף כל כיתוב (לא נחתכים בפרסום).  
תמונות AI: `marketing/assets/ai-images/` (מטוסים / אמבולנס אווירי / ICU / מסירה)  
סקריפטים: `marketing/tools/schedule-90-days.mjs`, `marketing/tools/publish-due.mjs`  
Workflow: `.github/workflows/iaa-social-autopublish.yml`

---

## חובה לאינסטגרם (טוקן ארוך טווח)

הטוקן מ־Graph Explorer פג תוך שעות. ל־90 יום צריך **System User token** שלא פג:

1. https://business.facebook.com/settings → התיק `217437055935244`
2. **משתמשי מערכת** → צור / בחר `IAA Publisher`
3. שייך את הדף **Israel air&ambulance** + חשבון Instagram
4. **Generate token** לאפליקציה **IAA Publisher** עם:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
   - `instagram_basic`
   - `instagram_content_publish`
5. ב־GitHub → Repo → **Settings → Secrets and variables → Actions** הוסף:

```
FACEBOOK_PAGE_ACCESS_TOKEN=<הטוקן הארוך>
FACEBOOK_PAGE_ID=111799957012811
INSTAGRAM_USER_ID=17841428066112189
IMAGE_URL=https://ambulancenter.com/logo.png
```

(מומלץ `IMAGE_URL` יציב של תמונת מותג ציבורית — לא CDN זמני של פייסבוק.)

6. Actions → **IAA Social Auto-Publish** → **Run workflow** (בדיקה).

**חשוב:** GitHub Scheduled Actions רצים רק מ־**ענף ברירת המחדל (`main`)**. אחרי מיזוג ה־PR האוטומציה של אינסטגרם + הרחבת חלון הפייסבוק תתחיל.  
פייסבוק ל־~29 הימים הקרובים **כבר מתוזמן בשרתי Meta** (58 פוסטים) — עובד גם לפני המיזוג.

בלי הסוד הזה, **פייסבוק המתוזמן ימשיך**; אינסטגרם והרחבת החלון ייעצרו בלי טוקן ארוך.

---

## פקודות מקומיות

```bash
# בניית תור 90 יום × 2/יום
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... \
  node marketing/tools/schedule-90-days.mjs --build

# תזמון כל פייסבוק עכשיו
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... \
  node marketing/tools/schedule-90-days.mjs --schedule-facebook

# פרסום פריטי IG שמגיע זמנם
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... \
  node marketing/tools/publish-due.mjs --instagram
```

---

## היקף

- תוכן דו-לשוני מ־`marketing/data/posts.json`
- בלי פרסום ללינקדאין באוטומציה הזו (אין טוקן LinkedIn)
- בלי Google Business / Threads באוטומציה הזו
