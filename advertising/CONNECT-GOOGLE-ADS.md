# חיבור Google Ads אליי (Cursor) — ואז אני מתקן את הקמפיינים

בלי 5 המפתחות האלה **אי אפשר** להתחבר לחשבון שלך.  
ברגע שתשים אותם ב־Secrets — אני מריץ `npm run ads:all` ומעלה/מתקן קמפיינים.

---

## שלב 1 — Developer Token (Google Ads)

1. היכנס ל־[ads.google.com](https://ads.google.com) עם החשבון של IAA  
2. Tools & settings → **API Center** (או Setup → API Center)  
3. אם אין — לחץ Apply / Create token  
4. העתק את ה־**Developer token**  
   - אם הסטטוס `Test` — אפשר לפרוס לחשבונות טסט בלבד  
   - לפרודקשן צריך אישור Google (Basic/Standard). בינתיים Test עובד על חשבון טסט / חלק מהפעולות

שמור כ:
```bash
GOOGLE_ADS_DEVELOPER_TOKEN=...
```

---

## שלב 2 — OAuth Client (Google Cloud)

1. היכנס ל־[Google Cloud Console](https://console.cloud.google.com/)  
2. צור פרויקט (או בחר קיים) בשם למשל `iaa-ads-api`  
3. **APIs & Services → Enable APIs** → חפש **Google Ads API** → Enable  
4. **APIs & Services → OAuth consent screen**  
   - User type: External (או Internal אם Workspace)  
   - App name: IAA Ads  
   - הוסף את המייל שלך כ־Test user  
5. **Credentials → Create credentials → OAuth client ID**  
   - Application type: **Desktop app** (הכי פשוט)  
   - או Web application עם redirect: `http://127.0.0.1:3456/oauth2callback`  
6. העתק:
```bash
GOOGLE_ADS_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=...
```

---

## שלב 3 — Refresh Token (פעם אחת)

במחשב שלך / בסביבה עם דפדפן:
```bash
export GOOGLE_ADS_CLIENT_ID="..."
export GOOGLE_ADS_CLIENT_SECRET="..."
node advertising/google-ads/oauth-setup.mjs
```
- ייפתח קישור Google → התחבר עם **אותו יוזר** של Google Ads  
- אשר גישה ל־AdWords API  
- בטרמינל יופיע:
```bash
GOOGLE_ADS_REFRESH_TOKEN=1//...
```

---

## שלב 4 — Customer ID

ב־Google Ads למעלה ליד שם החשבון — מספר כמו `123-456-7890`.

```bash
GOOGLE_ADS_CUSTOMER_ID=1234567890   # בלי מקפים
```

אם אתה נכנס דרך MCC (חשבון מנהל):
```bash
GOOGLE_ADS_LOGIN_CUSTOMER_ID=9999999999
```

---

## שלב 5 — שים Secrets אצלי (Cursor Cloud)

בסביבת ה־Cloud Agent / Environment Secrets הוסף:

| Key | Value |
|-----|--------|
| `GOOGLE_ADS_CLIENT_ID` | מ־Cloud Console |
| `GOOGLE_ADS_CLIENT_SECRET` | מ־Cloud Console |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | מ־API Center |
| `GOOGLE_ADS_REFRESH_TOKEN` | מ־oauth-setup |
| `GOOGLE_ADS_CUSTOMER_ID` | מזהה חשבון (בלי מקפים) |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | רק אם MCC |
| `ADS_PHONE` | `+972796709999` |
| `ADS_LANDING_AMBULANCE_URL` | `https://ambulancenter.com/ambulance-tiberias.html` |
| `ADS_LANDING_FLIGHT_URL` | `https://ambulancenter.com/air-ambulance-to-israel.html` |
| `ADS_ENABLE` | `true` (להפעלה חיה) או `false` (Paused) |

---

## שלב 6 — תגיד לי "מחובר"

אחרי שה־Secrets שמורים, כתוב לי כאן **מחובר**.  
אני אריץ:
```bash
npm run ads:all
```
וזה יעלה/יתקן:
- 3 קמפייני Search (טבריה · הטסות HE · Air Ambulance EN)
- Exact/Phrase + Negatives + RSA לידים
- Call / Sitelinks / Callouts
- Conversion actions (שיחות / WhatsApp / טופס)

---

## חשוב
- אל תשלח את המפתחות בצ׳אט ציבורי — רק ב־Secrets  
- אם Developer Token בסטטוס Test ויש שגיאת `DEVELOPER_TOKEN_NOT_APPROVED` — צריך להגיש בקשה ל־Basic access ב־API Center
