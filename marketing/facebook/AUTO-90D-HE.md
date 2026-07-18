# פרסום אוטומטי 90 יום — פייסבוק + אינסטגרם + רילס + אמבולנס קרקעי

**אישור מראש (פוסטים 1–22):** 3 חודשים · **5 פוסטים/יום** · אמבולנסים קרקעיים + הטסות רפואיות + אבטחת אירועים + מכבי טבריה · **אנגלית + עברית**.

שעות (שעון ישראל):
- **10:00** — הטסה רפואית / אקמו / השבה לארץ
- **12:00** — אמבולנס קרקעי (צפת / גליל / העברות)
- **14:00** — צי / צוות / מכבי טבריה והסביבה
- **16:00** — אבטחה רפואית לאירועים **או** העברה קרקעית
- **18:00** — הטסה רפואית (סוגי טיסות / Bed to Bed / תהליך)

ספריית תוכן: `marketing/data/approved-posts.json`  
בנייה מחדש: `node marketing/tools/build-approved-5x90.mjs --build --schedule-facebook`

**וואטסאפ בכל פוסט:** `053-232-1101` · טלפון `+972-79-670-9999` · https://ambulancenter.com

---

## תזמון 90 יום מראש

| שכבה | מה קורה |
|------|---------|
| **תור מלא 90 יום** | כל הפוסטים/רילס כתובים ב־`publish-queue-90d.json` |
| **Facebook** | Meta מאפשרת תזמון עד ~**30 יום** קדימה. ממלאים את החלון עכשיו, וה־Action מרחיב כל יום עד סוף ה־90 |
| **Instagram** | אין תזמון API — פרסום בזמן מהתור (דורש טוקן חי) |

**חשוב:** פוסטים שכבר תוזמנו בפייסבוק **ממשיכים להתפרסם גם אחרי שפג הטוקן**. אינסטגרם + הרחבת החלון דורשים טוקן תקף.

---

## התראת דחיפה לפני פקיעת טוקן

Workflow: `.github/workflows/iaa-token-watch.yml` · סקריפט: `marketing/tools/check-token-expiry.mjs`

### התקנה בטלפון (30 שניות)
1. התקן את האפליקציה **ntfy** (iOS / Android)
2. Subscribe לנושא: **`iaa-meta-token-alerts`**
3. או פתח: https://ntfy.sh/iaa-meta-token-alerts

תקבל דחיפה ב־**14 / 7 / 3 / 1 ימים** ולפני **6 שעות** מפקיעה.

אופציונלי ב־GitHub Secrets:
```
NOTIFY_NTFY_TOPIC=iaa-meta-token-alerts
NOTIFY_WEBHOOK_URL=<Make/Zapier → WhatsApp>
FACEBOOK_PAGE_ACCESS_TOKEN=<System User / Page token ארוך>
```

בדיקה ידנית:
```bash
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... \
  node marketing/tools/check-token-expiry.mjs --force-notify
```

---

## מה רץ אוטומטית

| פלטפורמה | איך |
|----------|-----|
| **Facebook** | תור 90 יום + תזמון Meta (~30 יום) + הרחבת חלון יומית |
| **Instagram תמונות** | פרסום בזמן (אוויר + קרקע) |
| **Instagram Reels** | ריל יומי ב־20:00 |
| **Token Watch** | בדיקה כל 6 שעות + דחיפה לפני פקיעה |

---

## חובה — טוקן שלא פג (System User)

הטוקן מ־Graph Explorer פג תוך שעות. ל־90 יום:

1. https://business.facebook.com/settings → תיק `217437055935244`
2. **משתמשי מערכת** → `IAA Publisher` → Generate token
3. הרשאות: `pages_manage_posts` + `instagram_content_publish` (+ בסיסיות)
4. GitHub → Secrets → `FACEBOOK_PAGE_ACCESS_TOKEN`
5. מיזוג PR ל־`main` (Cron רץ רק מ־main)

```
FACEBOOK_PAGE_ACCESS_TOKEN=<טוקן ארוך / System User>
FACEBOOK_PAGE_ID=111799957012811
INSTAGRAM_USER_ID=17841428066112189
NOTIFY_NTFY_TOPIC=iaa-meta-token-alerts
```

---

## פקודות מקומיות

```bash
node marketing/tools/schedule-90-days.mjs --build
node marketing/tools/generate-ground-posts.mjs
node marketing/tools/add-daily-ground.mjs
node marketing/tools/add-daily-reels.mjs

# מילוי מקסימום חלון FB (~29 יום)
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... FB_MAX_DAYS_AHEAD=29 \
  node marketing/tools/publish-due.mjs --roll-facebook

# פרסום IG + הרחבת חלון
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... \
  node marketing/tools/publish-due.mjs --instagram --roll-facebook

# בדיקת פקיעה + דחיפה
FACEBOOK_PAGE_ACCESS_TOKEN=EAA... \
  node marketing/tools/check-token-expiry.mjs --notify
```

---

## היקף יומי

- 2 פוסטי אוויר (FB+IG)
- 2 פוסטי אמבולנס קרקעי (FB+IG)
- 1 Reel (IG)
