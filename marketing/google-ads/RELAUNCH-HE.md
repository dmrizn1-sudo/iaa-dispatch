# השקה מחדש — Google Ads · ספטמבר 2026

**מותג:** Israel Air & Ambulance · https://ambulancenter.com  
**טלפון:** +972-79-670-9999 · **וואטסאפ:** 053-232-1101  
**מטרה:** לידים פרטיים להטסה רפואית **לישראל** ו־**מישראל** (שיחה ≥60ש׳ / וואטסאפ / טופס)

---

## מה יש מוכן

| קובץ | שימוש |
|------|--------|
| [relaunch-2026-09/](./relaunch-2026-09/) | **חבילת Soft Launch** — קמפיינים + מילות מפתח + תקציבים |
| [01-campaign-structure.md](./01-campaign-structure.md) | מבנה מלא: 13 Search + Brand |
| [02-budget-optimization.md](./02-budget-optimization.md) | חלוקת תקציב חודשי |
| [04-responsive-search-ads.md](./04-responsive-search-ads.md) | 30 כותרות + 20 תיאורים |
| [05-extensions-and-assets.md](./05-extensions-and-assets.md) | Call / Sitelinks / Callouts |
| [07-tracking-conversions-qa.md](./07-tracking-conversions-qa.md) | מעקב המרות |
| [negative-keywords.csv](./negative-keywords.csv) | נגטיבים לחשבון (~172) |
| [keywords-database.csv](./keywords-database.csv) | מאגר מלא (~3,414) |

---

## Soft Launch — מה מפעילים עכשיו

**8 קמפיינים Search (Enabled):**

1. `IAA | Search | Air Ambulance TO Israel`
2. `IAA | Search | Air Ambulance FROM Israel`
3. `IAA | Search | Medical Repatriation`
4. `IAA | Search | ICU Air Ambulance`
5. `IAA | Search | Emergency Medical Flight`
6. `IAA | Search | Fly Patient Home`
7. `IAA | Search | Emergency Patient Return`
8. `IAA | Search | Brand`

**שאר הקמפיינים (P1/P2)** — נשארים **Paused** עד שיש CPQL יציב.

### מדינות בעדיפות 1
US · CA · GB · FR · DE · CH · IT · GR · CY · AE · **TH (תאילנד)**

### הגדרות חובה
- רשת: **Search only** (בלי Display / PMax בהשקה)
- מיקום: **Presence** (אנשים במדינה) — לא “interested in”
- התאמה: **Exact + Phrase בלבד**
- הצעות מחיר: **Maximize Conversions** (או Manual CPC אם <15 המרות/חודש)
- נכס שיחה: חובה בכל קמפיין (`+972-79-670-9999`)

---

## תקציב לדוגמה ($10,000 / חודש)

| קמפיין | % | חודשי | יומי ~ |
|--------|---|--------|--------|
| TO Israel | 12% | $1,200 | $39 |
| FROM Israel | 14% | $1,400 | $46 |
| Medical Repatriation | 8% | $800 | $26 |
| ICU | 10% | $1,000 | $33 |
| Emergency Medical Flight | 8% | $800 | $26 |
| Fly Patient Home | 7% | $700 | $23 |
| Emergency Patient Return | 7% | $700 | $23 |
| Brand | 5% | $500 | $16 |
| רזרבה / Paused / בדיקות | ~29% | ~$2,900 | — |

קבצי מספרים: `relaunch-2026-09/soft-launch-budgets.csv` (גם ל־$5K ו־$20K).

---

## סדר עבודה (14 יום)

### ימים 1–2 — מעקב + ניקוי
1. GA4 + GTM: `phone_click`, `whatsapp_click`, `generate_lead`, שיחות ≥60ש׳
2. ייבוא `negative-keywords.csv` לרמת חשבון
3. ייצוא Search Terms 90 יום אחרונים → נגטיבים נוספים

### ימים 3–5 — מבנה
1. ליצור 8 קמפיינים מהרשימה למעלה (Paused)
2. לייבא מילות מפתח: `relaunch-2026-09/soft-launch-keywords.csv` (~991 שורות)
3. לחבר Shared Negatives

### ימים 6–8 — מודעות ונכסים
1. RSA מתוך `04-responsive-search-ads.md` (15+ כותרות, 4 תיאורים)
2. Call + Sitelinks + Callouts + לוגו
3. Final URL זמני: `https://ambulancenter.com/`  
   (כשיש LP ייעודי — לעדכן לפי `soft-launch-campaigns.csv`)

### ימים 9–10 — הפעלה
1. להפעיל רק Soft Launch + Priority-1 geos
2. ביקורת Search Terms כל יום

### ימים 11–14 — אופטימיזציה
1. להשהות שאילתות יקרות בלי ליד מוסמך
2. לחזק קמפיינים עם CPQL טוב (+15–25% תקציב)

---

## CTA בכל מודעה / נכס

- Call: `+972-79-670-9999`
- WhatsApp: `https://wa.me/972532321101`
- Site: `https://ambulancenter.com`

---

## מה לא לפרסם (Scope lock)

לא לכלול בקמפיינים הבינלאומיים: אמבולנס קרקעי מקומי, תיירות מרפא, משרות/הכשרות, מד״א/911, מכרזי בתי חולים — אלא אם מייצרים הפניות משפחתיות פרטיות.

---

## אחרי Soft Launch

כש־CPQL יציב (≥30 המרות/30 יום רצוי):
1. להפעיל P1: Private / Escort / Commercial Escort / Intl Transfer
2. Wave-2 geos (עד 15% מהתקציב)
3. לשקול tCPA
4. PMax רק אחרי Search יציב + LP בינלאומיים

פירוט מלא: `00-audit-and-rebuild-plan.md` · `01-campaign-structure.md` · `02-budget-optimization.md`
