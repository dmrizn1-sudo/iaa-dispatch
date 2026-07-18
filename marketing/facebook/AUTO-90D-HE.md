# פרסום אוטומטי 90 יום — פייסבוק + אינסטגרם + רילס

**אישור מראש:** 3 חודשים · **2 פוסטים ביום + 1 Reel ביום** · כל תוכן **אנגלית + עברית** · פלטפורמות: Facebook + Instagram.

שעות ברירת מחדל (שעון ישראל): **10:00** ו־**18:00** (תמונות) · **20:00** (Reel באיכות גבוהה).

**יעדים + SEO:** כל פוסט/ריל מתויג ליעד ספציפי (עיר/מדינה) עם האשטגים וביטויי חיפוש כמו `Air ambulance {City} to Israel` / `אמבולנס אווירי {עיר} לישראל`.
**וואטסאפ בכל פוסט:** `053-232-1101` (+972-53-232-1101) + טלפון `+972-79-670-9999`.

---

## מה רץ אוטומטית

| פלטפורמה | איך |
|----------|-----|
| **Facebook** | תור 90 יום. Meta מאפשרת תזמון ~30 יום קדימה — פוסטים ראשונים כבר תוזמנו, וה־GitHub Action מרחיב את החלון כל יום (`--roll-facebook`). |
| **Instagram תמונות** | אין תזמון מובנה ב־API. אותו Action מפרסם בזמן מהתור (`--instagram`). |
| **Instagram Reels** | ריל יומי ב־20:00. רינדור 1080×1920 (Ken Burns + כיתוב דו-לשוני, בלי מוזיקת סטוק) ואז העלאה resumable ל־Meta. |

תור: `marketing/data/publish-queue-90d.json`  
האשטגים באינסטגרם: חובה EN + HE בסוף כל כיתוב (מקסימום 30).  
תמונות AI: `marketing/assets/ai-images/`  
רילס: `marketing/tools/render-reel.py` + `add-daily-reels.mjs`  
סקריפטים: `marketing/tools/schedule-90-days.mjs`, `marketing/tools/publish-due.mjs`  
Workflow: `.github/workflows/iaa-social-autopublish.yml`

### איכות הרילס
- אנכי **1080×1920**, H.264, CRF 16, preset slow
- תנועת Ken Burns על 2–3 תמונות תעופה רפואיות
- כיתוב EN+HE על המסך + CTA וואטסאפ
- **בלי מוזיקה** (מונע חסימות זכויות)

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

6. Actions → **IAA Social Auto-Publish** → **Run workflow** (בדיקה).

**חשוב:** GitHub Scheduled Actions רצים רק מ־**ענף ברירת המחדל (`main`)**. אחרי מיזוג ה־PR האוטומציה של אינסטגרם + רילס + הרחבת חלון הפייסבוק תתחיל.

בלי הסוד הזה, **פייסבוק המתוזמן ימשיך**; אינסטגרם/רילס והרחבת החלון ייעצרו בלי טוקן ארוך.

---

## פקודות מקומיות

```bash
# בניית תור 90 יום × 2/יום (תמונות)
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... \
  node marketing/tools/schedule-90-days.mjs --build

# הוספת ריל יומי ב־20:00 (לא מוחק סטטוס FB/IG קיים)
node marketing/tools/add-daily-reels.mjs

# רינדור ריל לבדיקה
node marketing/tools/render-due-reels.mjs --id d001-reel-day-001

# תזמון כל פייסבוק עכשיו
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... \
  node marketing/tools/schedule-90-days.mjs --schedule-facebook

# פרסום פריטי IG (תמונות + רילס) שמגיע זמנם
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... \
  node marketing/tools/publish-due.mjs --instagram
```

---

## היקף

- תוכן דו-לשוני מ־`marketing/data/posts.json`
- 2 פוסטי תמונה/יום + 1 Reel/יום × 90 יום
- בלי פרסום ללינקדאין באוטומציה הזו (אין טוקן LinkedIn)
- בלי Google Business / Threads באוטומציה הזו
