# Google Business Profile API — חיבור לאוטומציה
**פרסום אוטומטי מתור 90 יום** (`gbp-queue-90d.json`)

כרגע אין ב־repo מפתחות Google Business — לכן הפרסום הוא **ידני** מהחבילה `PUBLISH-TODAY-HE.md`.  
אחרי החיבור למטה אפשר להריץ:

```bash
node marketing/tools/build-gbp-90d.mjs --start 2026-07-30
node marketing/tools/publish-gbp-due.mjs --dry-run
node marketing/tools/publish-gbp-due.mjs
```

---

## 1) מה צריך מגוגל

1. פרויקט ב־[Google Cloud Console](https://console.cloud.google.com)
2. הפעלת **Google Business Profile API** / My Business Account Management + Local Posts (לפי מה שזמין בחשבון)
3. OAuth Client (Desktop או Web) — Client ID + Client Secret
4. Scope: `https://www.googleapis.com/auth/business.manage`
5. משתמש בעל הרשאת מנהל על הפרופיל מאשר גישה → **Refresh Token**

### מציאת Account ID + Location ID
אחרי OAuth, קראו:

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://mybusinessaccountmanagement.googleapis.com/v1/accounts

curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://mybusinessbusinessinformation.googleapis.com/v1/$ACCOUNT_NAME/locations?readMask=name,title"
```

שמרו את המספרים מ־`accounts/{ACCOUNT_ID}` ו־`locations/{LOCATION_ID}`.

---

## 2) Secrets / Env

| משתנה | תיאור |
|--------|--------|
| `GOOGLE_BUSINESS_ACCESS_TOKEN` | Access token קצר (אופציונלי אם יש refresh) |
| `GOOGLE_BUSINESS_REFRESH_TOKEN` | Refresh token קבוע |
| `GOOGLE_OAUTH_CLIENT_ID` | Client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Client Secret |
| `GOOGLE_BUSINESS_ACCOUNT_ID` | למשל `1234567890` או `accounts/123…` |
| `GOOGLE_BUSINESS_LOCATION_ID` | למשל `9876543210` או `locations/987…` |

ב־GitHub (אופציונלי): אותם שמות תחת **Settings → Secrets**.

---

## 3) פרסום

```bash
# מה ממתין
node marketing/tools/publish-gbp-due.mjs --dry-run

# פרסם due
node marketing/tools/publish-gbp-due.mjs

# דחוף את הבא בתור (בדיקה)
node marketing/tools/publish-gbp-due.mjs --force-next --limit 1
```

Endpoint בשימוש:
`POST https://mybusiness.googleapis.com/v4/accounts/{id}/locations/{id}/localPosts`

---

## 4) מה לשלוח לי כדי לחבר מהר

1. קישור Maps / Place ID של הפרופיל  
2. (אופציונלי) Refresh token + Client ID/Secret + Account/Location IDs — **בצ׳אט בלבד, לא ב־commit**

עד אז — המשיכו עם העתק-הדבק מ־`PUBLISH-TODAY-HE.md` + `CALENDAR-90D-HE.md`.
