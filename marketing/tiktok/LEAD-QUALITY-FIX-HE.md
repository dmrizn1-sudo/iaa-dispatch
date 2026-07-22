# תיקון איכות לידים — TikTok (מחפשי עבודה מאיטליה)

**תאריך:** 2026-07-22  
**בעיה שדווחה:** במקום לידים להטסות רפואיות — המון הודעות מאיטליה על חיפוש עבודה (כנראה מטיקטוק).

> אין בריפו גישה ל־TikTok Ads API. התיקון נעשה ב־TikTok Ads Manager + חסימות מילים כאן.

---

## מה כנראה קרה

1. קמפיין TikTok עם יעד **Messages / Traffic** רחב מדי  
2. קהל Interest / Broad (ambulance, medical, Israel, travel) מושך גם **מחפשי עבודה**  
3. כפתור WhatsApp פתוח → מגיעים שואלים על משרה / lavoro / assunzione  
4. טירגוט גיאוגרפי כולל איטליה (או Worldwide) בלי סינון כוונה

זה **לא** ליד הטסה — זה spam תעסוקתי.

---

## פעולות מיידיות (עכשיו בטיקטוק)

### 1) עצירה / צמצום
- [ ] **Pause** קמפיינים שמביאים Messages מאיטליה / מחפשי עבודה  
- [ ] בדוק **Breakdown → Country** ו־**Placement** להיום  
- [ ] כבה זמנית **Italy** מטירגוט המיקומים (או הגבל ל־IL + מדינות יעד אמיתיות בלבד)

### 2) טירגוט מומלץ ללידי הטסה
| הגדרה | המלצה |
|--------|--------|
| Location | ישראל + מדינות יעד משפחה (US, UK, FR, DE, AE, TH…) — **לא Broad Worldwide** |
| Exclude | Italy זמנית אם ממשיך spam; או השאר רק אם יש קריאייטיב השבה מאיטליה |
| Age | 30–65+ (משפחות / מקבלי החלטה) |
| Interests | Medical travel / insurance / family care — **לא** Jobs, Career, HR |
| Optimization | Prefer **Lead form** או **Website conversion** על פני סתם Messages |
| Language | Hebrew + English (לא Italian בלבד) |

### 3) קריאייטיב / טקסט — חסום כוונת עבודה
בכל מודעה וב־WhatsApp greeting:

**HE**  
«שירות הטסה רפואית והעברת חולים בלבד. לא מגייסים עובדים.»

**EN**  
«Medical flight / patient transfer inquiries only. We are not hiring.»

**IT** (לסינון מהיר)  
«Solo voli medici / trasferimenti pazienti. Non assumiamo.»

### 4) רשימת חסימות / Negative (TikTok + Google)

העתק ל־TikTok keyword exclude / comment filter / interest exclude:

```
job, jobs, work, working, hiring, hire, career, careers, vacancy, CV, resume,
employment, salary, wage, apply, recruitment, linkedin, indeed,
lavoro, lavori, assunzione, assunzioni, stipendio, curriculum, candidatura,
offerta di lavoro, cerco lavoro, posti di lavoro, paramedico lavoro,
משרה, משרות, דרושים, עבודה, גיוס, שכר, קו״ח, קורות חיים, דרוש פרמדיק
```

רשימה מורחבת גם ב־`marketing/google-ads/negative-keywords.csv` (קטגוריית jobs + IT).

### 5) WhatsApp Business
- [ ] הודעת פתיחה: «הטסות רפואיות / העברות בלבד — לא מגייסים»  
- [ ] תווית **Spam / Job seeker** + ארכיון מהיר  
- [ ] אל תשיבו באריכות למחפשי עבודה (מחזק את האלגוריתם)

---

## מה לא לעשות

- לא לפתוח קמפיין «Boost» על סרטון צי עם כפתור Message לכל העולם  
- לא להשתמש ב־Spark Ads / Broad ללא exclude ל־Jobs  
- לא לערבב מודעת גיוס ומודעת הטסה באותו אדסט

---

## אחרי התיקון — מדדי הצלחה (7 ימים)

| מדד | יעד |
|------|-----|
| % הודעות «עבודה/lavoro» | ירידה חדה (<10%) |
| לידים עם מטופל + יעד + ביטוח/משפחה | עלייה |
| מדינות מובילות | IL + יעדי הטסה (לא IT spam) |

---

## קשר לתוכן האורגני (FB/IG)

בתור האורגני יש פוסטים Rome/Milan → Israel (השבה רפואית לגיטימית).  
אם גם משם מגיעים מחפשי עבודה — הגבלת Italy בטיקטוק מספיקה בדרך כלל; האורגני לא אמור להציף כמו מודעת Message.
