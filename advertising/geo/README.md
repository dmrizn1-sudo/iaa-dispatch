# GEO / Gemini — איך מגיעים לציטוט כמו המתחרים

## מה בנינו
דפי כוונה **answer-first** מוכנים להעלאה ל־Hostinger (ambulancenter.com):

| קובץ | מטרה |
|------|------|
| `publish/ambulance-tiberias.html` | מחליף את הדף החלש/הומפייג׳ — מוביל ל־"אמבולנס פרטי טבריה" |
| `publish/ambulance-poria.html` | שחרור מפוריה / לידים חמים |
| `publish/air-ambulance-to-israel.html` | EN — "air ambulance to Israel" לציטוטי Gemini בינלאומיים |
| `publish/robots.txt` | מאפשר Google-Extended |
| `publish/sitemap-additions.xml` | להוסיף ל־sitemap |
| `schema/organization.json` | ישות מותג אחידה |
| `monitor/gemini-weekly-queries.md` | מדידת ציטוטים |

## העלאה ל־Hostinger (חובה כדי שגוגל יראה)
1. העלה את 3 קבצי ה־HTML ל־public_html של ambulancenter.com  
2. החלף `robots.txt`  
3. עדכן `sitemap.xml` עם ה־URLs החדשים  
4. ב־Google Search Console: Request indexing לכל URL  
5. ודא GBP (Google Business) עם אותם שם/טלפון/כתובת: העמקים 102 טבריה, 079-6709999  

## למה זה אמור להביא ציטוט ב־Gemini
- תשובה ישירה בפסקה הראשונה ("מי מספק…")
- FAQ + Service + MedicalBusiness schema
- דפים ייעודיים לשאילתות ליד (לא הומפייג׳ כללי)
- עברית לאמבולנסים + אנגלית להטסות

## מגבלה כנה
אי אפשר לכפות על Gemini לצטט. אפשר לבנות את הנכסים שגורמים לו לבחור בכם — ואז למדוד שבועית.

## אחרי העלאה
הרץ את השאלות ב־`monitor/gemini-weekly-queries.md` ובדוק אם מופיע chip של `ambulancenter.com`.
