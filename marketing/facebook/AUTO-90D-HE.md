# פרסום אוטומטי 90 יום — פייסבוק + אינסטגרם + רילס + אמבולנס קרקעי

**אישור מראש:** 3 חודשים · **2 פוסטי אוויר/יום + 2 פוסטי אמבולנס קרקעי/יום + 1 Reel/יום** · כל תוכן **אנגלית + עברית**.

שעות (שעון ישראל):
- **10:00 · 18:00** — אמבולנס אווירי (בינלאומי)
- **12:00 · 16:00** — אמבולנס קרקעי / אבטחה רפואית / העברות
- **20:00** — Reel באיכות גבוהה

**אמבולנס קרקעי — נושאים:** אבטחה רפואית לאירועים · שירותי פראמדיק · אמבולנסים פריים · צי חדש ברמה גבוהה · מיטות חשמליות · ציוד מתקדם · 20+ שנות ניסיון פראמדיק טיפול נמרץ · חובשים ונהגים מוסמכים · דגש **פוריה / צפת / הצפון** לכל הארץ.

**וואטסאפ בכל פוסט:** `053-232-1101` · טלפון `+972-79-670-9999` · https://ambulancenter.com

---

## מה רץ אוטומטית

| פלטפורמה | איך |
|----------|-----|
| **Facebook** | תור 90 יום + תזמון Meta (~30 יום) + הרחבת חלון ב־Action |
| **Instagram תמונות** | פרסום בזמן מהתור (אוויר + קרקע) |
| **Instagram Reels** | ריל יומי ב־20:00 (רינדור + העלאה) |

תור: `marketing/data/publish-queue-90d.json`  
תוכן קרקע: `marketing/data/ground-posts.json` · `add-daily-ground.mjs`  
תמונות: `marketing/assets/ai-images/` (כולל צי קרקעי חדש)  
Workflow: `.github/workflows/iaa-social-autopublish.yml`

### איכות הרילס
- אנכי **1080×1920**, H.264, CRF 16
- Ken Burns + כיתוב EN+HE · **בלי מוזיקה**

---

## חובה (טוקן ארוך טווח)

1. Business Manager → System User token עם `pages_manage_posts` + `instagram_content_publish`
2. GitHub Secret: `FACEBOOK_PAGE_ACCESS_TOKEN`
3. מיזוג PR ל־`main` (Cron רץ רק מ־main)

```
FACEBOOK_PAGE_ACCESS_TOKEN=<טוקן ארוך>
FACEBOOK_PAGE_ID=111799957012811
INSTAGRAM_USER_ID=17841428066112189
```

---

## פקודות מקומיות

```bash
node marketing/tools/schedule-90-days.mjs --build
node marketing/tools/generate-ground-posts.mjs
node marketing/tools/add-daily-ground.mjs
node marketing/tools/add-daily-reels.mjs

FACEBOOK_PAGE_ACCESS_TOKEN=EAA... \
  node marketing/tools/publish-due.mjs --instagram --roll-facebook

# פרסום מיידי של סלוטים שעבר זמנם (תמונות)
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... LOOKBACK_MIN=600 \
  node marketing/tools/publish-due.mjs --instagram --facebook
```

---

## היקף יומי

- 2 פוסטי אוויר (FB+IG)
- 2 פוסטי אמבולנס קרקעי (FB+IG)
- 1 Reel (IG)
