#!/usr/bin/env node
/**
 * Generates Google Ads Search campaign assets for Israel Air & Ambulance:
 * - Private ground ambulance: Tiberias + North region (HE)
 * - Medical flights / air ambulance to Israel (HE + EN)
 *
 * Outputs Google Ads Editor–compatible CSVs under ./out
 * Match types: Exact + Phrase only (no Broad) to protect budget.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "out");

const BRAND = "Israel Air & Ambulance";
const FINAL_URL_AMBULANCE =
  process.env.ADS_LANDING_AMBULANCE_URL || "https://example.com/ambulance-tiberias";
const FINAL_URL_FLIGHT =
  process.env.ADS_LANDING_FLIGHT_URL || "https://example.com/air-ambulance-to-israel";
const PHONE = process.env.ADS_PHONE || "+972-XX-XXX-XXXX";

/** Settlements / areas around Tiberias for local Exact expansion */
const NORTH_LOCALITIES = [
  "טבריה",
  "מגדל",
  "גינוסר",
  "יבנאל",
  "כפר תבור",
  "כפר כנא",
  "רמת ישי",
  "עפולה",
  "בית שאן",
  "צפת",
  "ראש פינה",
  "חצור הגלילית",
  "קצרין",
  "חיספין",
  "פוריה",
  "טבריה עילית",
  "מנחמיה",
  "כנרת",
  "עמק הירדן",
  "גליל תחתון",
];

/** Lead-intent Exact — research: phone/WhatsApp CTAs convert on price + book now queries */
const AMBULANCE_CORE_EXACT = [
  "אמבולנס פרטי טבריה",
  "אמבולנס פרטי בצפון",
  "אמבולנס פרטי כנרת",
  "אמבולנס פרטי עמק הירדן",
  "פינוי רפואי פרטי טבריה",
  "העברה בין בתי חולים טבריה",
  "אמבולנס פרטי דחוף טבריה",
  "אמבולנס פרטי 24 שעות טבריה",
  "הזמנת אמבולנס פרטי טבריה",
  "אמבולנס פרטי מחיר טבריה",
  "שינוע חולה פרטי טבריה",
  "אמבולנס ALS פרטי טבריה",
  "אמבולנס BLS פרטי טבריה",
  "טלפון אמבולנס פרטי טבריה",
  "הזמנת אמבולנס פרטי עכשיו",
  "אמבולנס פרטי וואטסאפ",
];

/** High-converting local intents (competitors rank on these): Poria, discharge, dialysis */
const AMBULANCE_LEAD_EXACT = [
  "אמבולנס פרטי פוריה",
  "אמבולנס מבית חולים פוריה",
  "שחרור מבית חולים טבריה אמבולנס",
  "העברה מפוריה לבית",
  "העברה בין בתי חולים פוריה",
  "אמבולנס לדיאליזה טבריה",
  "הסעת דיאליזה טבריה",
  "אמבולנס לאונקולוגיה טבריה",
  "העברת חולה מטבריה לתל אביב",
  "אמבולנס פרטי מטבריה לחיפה",
  "הצעת מחיר אמבולנס פרטי טבריה",
  "מחיר אמבולנס פרטי טבריה",
  "אמבולנס פרטי זמין עכשיו טבריה",
  "הזמנת אמבולנס לפוריה",
  "הזמנה אמבולנס פרטי טבריה",
];

const AMBULANCE_PHRASE = [
  "אמבולנס פרטי טבריה",
  "אמבולנס פרטי בצפון",
  "אמבולנס פרטי כנרת",
  "פינוי רפואי פרטי",
  "העברה רפואית פרטית",
  "אמבולנס פרטי זמין עכשיו",
  "אמבולנס פרטי לבית חולים",
  "אמבולנס ALS פרטי",
  "אמבולנס BLS פרטי",
  "שינוע חולה פרטי",
  "העברה בין בתי חולים",
  "אמבולנס פרטי דחוף",
  "הזמנת אמבולנס פרטי",
  "אמבולנס פרטי מחיר",
  "שחרור מבית חולים אמבולנס",
  "הסעת דיאליזה אמבולנס",
  "אמבולנס פרטי פוריה",
  "הצעת מחיר אמבולנס פרטי",
];

const FLIGHT_EXACT_HE = [
  "הטסה רפואית לישראל",
  "פינוי רפואי לישראל",
  "מטוס אמבולנס לישראל",
  "הטסה רפואית מחו״ל לישראל",
  "העברה רפואית בטיסה",
  "הטסת חולה לישראל",
  "פינוי אווירי רפואי",
  "הטסה רפואית דחופה",
  "שינוע רפואי בינלאומי לישראל",
  "מטוס אמבולנס פרטי לישראל",
  "הצעת מחיר הטסה רפואית",
  "מחיר מטוס אמבולנס לישראל",
  "ליווי רפואי בטיסה לישראל",
  "bed to bed לישראל",
  "חילוץ רפואי מחו״ל לישראל",
  "קרוב משפחה חולה בחו״ל הטסה",
];

const FLIGHT_PHRASE_HE = [
  "הטסה רפואית",
  "פינוי רפואי לישראל",
  "מטוס אמבולנס",
  "העברה רפואית מחו״ל",
  "פינוי אווירי",
  "הטסת חולה",
  "הטסה רפואית דחופה",
  "שינוע רפואי בינלאומי",
  "הצעת מחיר הטסה רפואית",
  "ליווי רפואי בטיסה",
  "מטוס אמבולנס מחיר",
  "חילוץ רפואי מחו״ל",
];

const FLIGHT_EXACT_EN = [
  "air ambulance to israel",
  "medical flight to israel",
  "medical evacuation to israel",
  "medevac to israel",
  "private air ambulance israel",
  "icu air ambulance to israel",
  "patient transfer to israel",
  "medical repatriation to israel",
  "emergency medical flight to israel",
  "international air ambulance israel",
  "air ambulance quote israel",
  "bed to bed air ambulance israel",
  "medical escort to israel",
  "medical flight cost to israel",
  "fly patient home to israel",
  "air ambulance tel aviv",
];

const FLIGHT_PHRASE_EN = [
  "air ambulance to israel",
  "medical flight to israel",
  "medical evacuation to israel",
  "air ambulance israel",
  "medical repatriation israel",
  "patient transfer to israel",
  "private air ambulance",
  "icu air ambulance",
  "emergency medical flight",
  "air ambulance quote",
  "bed to bed medical transport",
  "medical escort flight",
  "medical flight cost",
];

/** Account-level negatives (waste reduction) — HE + EN */
const ACCOUNT_NEGATIVES = [
  // HE
  ["חינם", "Phrase"],
  ["עבודה", "Phrase"],
  ["דרושים", "Phrase"],
  ["משרה", "Phrase"],
  ["קורס", "Phrase"],
  ["קורסים", "Phrase"],
  ["לימודים", "Phrase"],
  ["מתנדב", "Phrase"],
  ["התנדבות", "Phrase"],
  ["מדא", "Exact"],
  ["מד״א", "Exact"],
  ["צעצוע", "Phrase"],
  ["משחק", "Phrase"],
  ["סימולטור", "Phrase"],
  ["ויקיפדיה", "Phrase"],
  ["חדשות", "Phrase"],
  ["כתבה", "Phrase"],
  ["משכורת", "Phrase"],
  ["שכר", "Phrase"],
  ["מכרז", "Phrase"],
  ["מכרזים", "Phrase"],
  ["הורדה", "Phrase"],
  ["pdf", "Phrase"],
  // EN
  ["job", "Phrase"],
  ["jobs", "Phrase"],
  ["career", "Phrase"],
  ["careers", "Phrase"],
  ["hiring", "Phrase"],
  ["salary", "Phrase"],
  ["course", "Phrase"],
  ["courses", "Phrase"],
  ["training", "Phrase"],
  ["volunteer", "Phrase"],
  ["free", "Exact"],
  ["toy", "Phrase"],
  ["wikipedia", "Phrase"],
  ["news", "Phrase"],
  ["pdf", "Exact"],
  ["download", "Phrase"],
  ["reddit", "Phrase"],
];

/** Campaign-specific negatives */
const AMBULANCE_CAMPAIGN_NEGATIVES = [
  ["טיסה", "Phrase"],
  ["מטוס", "Phrase"],
  ["הטסה", "Phrase"],
  ["air ambulance", "Phrase"],
  ["medical flight", "Phrase"],
  ["חו״ל", "Phrase"],
  ["חול", "Exact"],
  ["abroad", "Phrase"],
];

const FLIGHT_CAMPAIGN_NEGATIVES = [
  ["טבריה", "Phrase"],
  ["צפת", "Phrase"],
  ["עפולה", "Phrase"],
  ["מונית", "Phrase"],
  ["הסעה רגילה", "Phrase"],
  ["taxi", "Phrase"],
  ["ground ambulance only", "Phrase"],
];

const CAMPAIGNS = {
  ambulance: {
    name: "IAA | Search | אמבולנס פרטי טבריה והצפון",
    budgetDaily: 150,
    language: "he",
    finalUrl: FINAL_URL_AMBULANCE,
  },
  flightHe: {
    name: "IAA | Search | הטסות רפואיות לישראל HE",
    budgetDaily: 200,
    language: "he",
    finalUrl: FINAL_URL_FLIGHT,
  },
  flightEn: {
    name: "IAA | Search | Air Ambulance TO Israel EN",
    budgetDaily: 250,
    language: "en",
    finalUrl: FINAL_URL_FLIGHT,
  },
};

function unique(arr) {
  return [...new Set(arr)];
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h] ?? "")).join(","));
  }
  return lines.join("\n") + "\n";
}

function write(file, content) {
  fs.writeFileSync(path.join(OUT, file), content, "utf8");
}

function buildAmbulanceKeywords() {
  const rows = [];
  const exactCore = unique([
    ...AMBULANCE_CORE_EXACT,
    ...NORTH_LOCALITIES.map((place) => `אמבולנס פרטי ${place}`),
    ...NORTH_LOCALITIES.map((place) => `פינוי רפואי פרטי ${place}`),
  ]);

  for (const kw of exactCore) {
    rows.push({
      campaign: CAMPAIGNS.ambulance.name,
      ad_group: "Exact — ליבה מקומית",
      keyword: kw,
      match_type: "Exact",
      max_cpc: "28",
    });
  }
  for (const kw of unique(AMBULANCE_LEAD_EXACT)) {
    rows.push({
      campaign: CAMPAIGNS.ambulance.name,
      ad_group: "Exact — לידים חמים פוריה/מחיר/דיאליזה",
      keyword: kw,
      match_type: "Exact",
      max_cpc: "40",
    });
  }
  for (const kw of unique(AMBULANCE_PHRASE)) {
    rows.push({
      campaign: CAMPAIGNS.ambulance.name,
      ad_group: "Phrase — הרחבה מבוקרת",
      keyword: kw,
      match_type: "Phrase",
      max_cpc: "20",
    });
  }
  return rows;
}

function buildFlightKeywords() {
  const rows = [];
  for (const kw of unique(FLIGHT_EXACT_HE)) {
    const isLead =
      /הצעת מחיר|מחיר|ליווי|bed to bed|חילוץ|קרוב משפחה/i.test(kw);
    rows.push({
      campaign: CAMPAIGNS.flightHe.name,
      ad_group: isLead ? "Exact — לידים הצעת מחיר/חילוץ" : "Exact — הטסות לישראל",
      keyword: kw,
      match_type: "Exact",
      max_cpc: isLead ? "55" : "45",
    });
  }
  for (const kw of unique(FLIGHT_PHRASE_HE)) {
    rows.push({
      campaign: CAMPAIGNS.flightHe.name,
      ad_group: "Phrase — הטסות לישראל",
      keyword: kw,
      match_type: "Phrase",
      max_cpc: "32",
    });
  }
  for (const kw of unique(FLIGHT_EXACT_EN)) {
    const isLead = /quote|cost|bed to bed|escort|fly patient/i.test(kw);
    rows.push({
      campaign: CAMPAIGNS.flightEn.name,
      ad_group: isLead ? "Exact — Lead Quote/Bed-to-Bed" : "Exact — TO Israel",
      keyword: kw,
      match_type: "Exact",
      max_cpc: isLead ? "60" : "48",
    });
  }
  for (const kw of unique(FLIGHT_PHRASE_EN)) {
    rows.push({
      campaign: CAMPAIGNS.flightEn.name,
      ad_group: "Phrase — TO Israel",
      keyword: kw,
      match_type: "Phrase",
      max_cpc: "34",
    });
  }
  return rows;
}

function buildNegatives() {
  const rows = [];
  for (const [keyword, match_type] of ACCOUNT_NEGATIVES) {
    rows.push({
      level: "Account",
      campaign: "",
      keyword,
      match_type,
      category: "waste_reduction",
    });
  }
  for (const [keyword, match_type] of AMBULANCE_CAMPAIGN_NEGATIVES) {
    rows.push({
      level: "Campaign",
      campaign: CAMPAIGNS.ambulance.name,
      keyword,
      match_type,
      category: "cross_service_exclusion",
    });
  }
  for (const [keyword, match_type] of FLIGHT_CAMPAIGN_NEGATIVES) {
    for (const campaign of [CAMPAIGNS.flightHe.name, CAMPAIGNS.flightEn.name]) {
      rows.push({
        level: "Campaign",
        campaign,
        keyword,
        match_type,
        category: "cross_service_exclusion",
      });
    }
  }
  return rows;
}

function buildAds() {
  // Lead formula from competitor SERP research (IL + EN):
  // 1) Click-to-call CTA in H1/H2  2) 24/7  3) Specific service intent
  // 4) Quote / WhatsApp  5) Local hospital / bed-to-bed proof
  return [
    {
      campaign: CAMPAIGNS.ambulance.name,
      ad_group: "Exact — ליבה מקומית",
      type: "Responsive search ad",
      final_url: FINAL_URL_AMBULANCE,
      path1: "טבריה",
      path2: "הזמנה",
      headlines: [
        "חייגו עכשיו — אמבולנס טבריה",
        `${BRAND}`,
        "הזמנה בטלפון 24/7",
        "אמבולנס פרטי זמין עכשיו",
        "מענה אנושי תוך דקות",
        "העברה מ/אל בית חולים",
        "כיסוי טבריה והכנרת",
        "WhatsApp להזמנה מהירה",
        "צוות מוסמך בשטח",
        "בלי המתנה מיותרת",
        "שינוע לכל רחבי הארץ",
        "קבעו העברה עכשיו",
        "פוריה · טבריה · צפון",
        "מחיר שקוף בשיחה",
        "מוקד הזמנות פעיל",
      ].join(" | "),
      descriptions: [
        `צריכים אמבולנס פרטי בטבריה? חייגו ${PHONE} — מוקד 24/7 עם מענה אנושי.`,
        "העברות שחרור, בין בתי חולים, ושינוע לכל הארץ. הזמנה בטלפון או WhatsApp.",
        "זמינים לטבריה, פוריה, כנרת ועמק הירדן — הגעה מהירה וליווי מקצועי.",
        "קבלו הצעת מחיר בשיחה אחת והזמינו שירות מיידי כשצריך עכשיו.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.ambulance.name,
      ad_group: "Exact — לידים חמים פוריה/מחיר/דיאליזה",
      type: "Responsive search ad",
      final_url: FINAL_URL_AMBULANCE,
      path1: "פוריה",
      path2: "הזמנה",
      headlines: [
        "אמבולנס מפוריה — חייגו",
        `${BRAND}`,
        "שחרור מבית חולים עכשיו",
        "העברה מפוריה לבית",
        "הסעת דיאליזה בצפון",
        "הצעת מחיר בטלפון",
        "הזמנה מיידית 24/7",
        "בין בתי חולים בצפון",
        "מטבריה לחיפה/מרכז",
        "WhatsApp לתיאום מהיר",
        "מוקד הזמנות פעיל",
        "מחיר ברור לפני יציאה",
        "צוות מקצועי ואדיב",
        "זמינים באזור פוריה",
        "קבעו העברה היום",
      ].join(" | "),
      descriptions: [
        `שחרור מפוריה / העברה רפואית? חייגו ${PHONE} לקביעת אמבולנס עכשיו.`,
        "דיאליזה, אונקולוגיה, שחרור לבית והעברות בין מוסדות — תיאום בשיחה אחת.",
        "מחפשים מחיר? קבלו הצעה מהירה בטלפון או WhatsApp לפני היציאה.",
        "שירות פרטי לטבריה והסביבה עם דגש על זמינות ומענה אנושי.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.ambulance.name,
      ad_group: "Phrase — הרחבה מבוקרת",
      type: "Responsive search ad",
      final_url: FINAL_URL_AMBULANCE,
      path1: "צפון",
      path2: "חייגו",
      headlines: [
        "אמבולנס פרטי בצפון",
        `${BRAND}`,
        "חייגו להזמנה מיידית",
        "זמין 24/7 באזורכם",
        "הצעת מחיר בשיחה",
        "פינוי והעברה פרטית",
        "שחרור מבית חולים",
        "WhatsApp — מענה מהיר",
        "צוות מיומן בשטח",
        "כיסוי יישובי הגליל",
        "בלי תורים מיותרים",
        "הזמנה אונליין/טלפון",
        "שינוע חולה מקצועי",
        "מוקד אנושי פעיל",
        "הזמינו עכשיו",
      ].join(" | "),
      descriptions: [
        `אמבולנס פרטי בצפון — חייגו ${PHONE} או שלחו WhatsApp להזמנה מהירה.`,
        "העברות שגרתיות ודחופות, שחרורים, ודיאליזה. מחיר ברור בשיחה.",
        "טבריה, פוריה, צפת, עפולה והסביבה — זמינות גבוהה ומענה אישי.",
        "רוצים ליד מהיר? השאירו טלפון בדף או התקשרו עכשיו למוקד.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.flightHe.name,
      ad_group: "Exact — הטסות לישראל",
      type: "Responsive search ad",
      final_url: FINAL_URL_FLIGHT,
      path1: "הטסה",
      path2: "לידים",
      headlines: [
        "הטסה רפואית — חייגו עכשיו",
        `${BRAND}`,
        "הצעת מחיר תוך דקות",
        "חייגו לתיאום מיידי",
        "הזמנה בטלפון 24/7",
        "מטוס אמבולנס לישראל",
        "Bed-to-Bed מלא",
        "מוקד משפחות 24/7",
        "חילוץ רפואי מחו״ל",
        "תיאום בית חולים ביעד",
        "ליווי רפואי בטיסה",
        "WhatsApp לתיאום דחוף",
        "ICU בטיסה לפי צורך",
        "פינוי אווירי מאורגן",
        "התחילו תיאום היום",
      ].join(" | "),
      descriptions: [
        `קרוב משפחה צריך לחזור לישראל? חייגו ${PHONE} להערכת מקרה והצעת מחיר.`,
        "מטוס אמבולנס או ליווי בטיסה מסחרית — נתאים פתרון לפי מצב המטופל.",
        "Bed-to-Bed: אמבולנס בחו״ל → טיסה → בית חולים בישראל. מוקד 24/7.",
        "ליד חם = שיחה אחת. קבלו אפשרויות, לו״ז ומחיר משוער בטלפון.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.flightHe.name,
      ad_group: "Exact — לידים הצעת מחיר/חילוץ",
      type: "Responsive search ad",
      final_url: FINAL_URL_FLIGHT,
      path1: "מחיר",
      path2: "הטסה",
      headlines: [
        "הצעת מחיר הטסה רפואית",
        `${BRAND}`,
        "חייגו לקבלת הצעה",
        "הזמנה / הצעת מחיר עכשיו",
        "מחיר מטוס אמבולנס",
        "חילוץ מחו״ל לישראל",
        "ייעוץ מקרה ללא עיכוב",
        "ליווי רפואי בטיסה",
        "השוו אפשרויות בשיחה",
        "מוקד 24/7 למשפחות",
        "Bed-to-Bed לישראל",
        "WhatsApp — תיאום מהיר",
        "פינוי דחוף מאורגן",
        "התחילו בשיחה אחת",
        "מענה אנושי מיידי",
      ].join(" | "),
      descriptions: [
        `רוצים הצעת מחיר להטסה רפואית? חייגו ${PHONE} — נאסוף פרטים ונחזור עם אופציות.`,
        "מחיר תלוי ביעד, מצב רפואי וסוג המטוס/ליווי. שקיפות מלאה לפני אישור.",
        "משפחות בחו״ל מקבלות מענה 24/7 לתיאום חילוץ והחזרה לישראל.",
        "השאירו טלפון בדף או התקשרו עכשיו — המטרה ליד + תיאום מהיר.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.flightHe.name,
      ad_group: "Phrase — הטסות לישראל",
      type: "Responsive search ad",
      final_url: FINAL_URL_FLIGHT,
      path1: "פינוי",
      path2: "אווירי",
      headlines: [
        "פינוי אווירי לישראל",
        `${BRAND}`,
        "חייגו לתיאום מיידי",
        "הצעת מחיר בטלפון",
        "הזמנה עכשיו — חייגו",
        "הטסת חולה מחו״ל",
        "צוות רפואי בטיסה",
        "מוקד בינלאומי 24/7",
        "מטוס אמבולנס פרטי",
        "ליווי בטיסה מסחרית",
        "WhatsApp למשפחות",
        "תיאום עד בית החולים",
        "התחילו הערכה עכשיו",
        "פתרון לפי מצב רפואי",
        "שירות מלא למשפחה",
      ].join(" | "),
      descriptions: [
        `הטסה רפואית לישראל — התקשרו ${PHONE} לקבלת הצעה ותיאום מהיר.`,
        "נתאים מטוס אמבולנס או ליווי רפואי לפי דחיפות ותקציב.",
        "מוקד למשפחות: הסבר תהליך, מסמכים, וקבלת מטופל בישראל.",
        "כל קליק אמור להוביל לשיחה או WhatsApp — זה הליד.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.flightEn.name,
      ad_group: "Exact — TO Israel",
      type: "Responsive search ad",
      final_url: FINAL_URL_FLIGHT,
      path1: "Call",
      path2: "Now",
      headlines: [
        "Call Now — Flight to Israel",
        `${BRAND}`,
        "Get a Quote in Minutes",
        "Request Quote by Phone",
        "24/7 Family Coordination",
        "Air Ambulance to Israel",
        "Bed-to-Bed Medical Flight",
        "ICU Air Transport Ready",
        "Speak to a Coordinator",
        "WhatsApp Case Intake",
        "Medical Repatriation Help",
        "Hospital Handoff in Israel",
        "Urgent Medevac Planning",
        "Fast Response for Families",
        "Start Case Review Today",
      ].join(" | "),
      descriptions: [
        `Need an air ambulance to Israel? Call ${PHONE} for a case review and quote.`,
        "Bed-to-bed: ground ambulance + medical flight + receiving hospital coordination.",
        "ICU aircraft or commercial medical escort — matched to patient condition.",
        "Every ad click should become a phone/WhatsApp lead. We answer 24/7.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.flightEn.name,
      ad_group: "Exact — Lead Quote/Bed-to-Bed",
      type: "Responsive search ad",
      final_url: FINAL_URL_FLIGHT,
      path1: "Quote",
      path2: "Israel",
      headlines: [
        "Air Ambulance Quote Israel",
        `${BRAND}`,
        "Call for Pricing Options",
        "Bed-to-Bed Cost Estimate",
        "Medical Escort Alternative",
        "Fly Patient Home to Israel",
        "Itemized Quote by Phone",
        "24/7 Quote Desk",
        "WhatsApp for Fast Intake",
        "No-Obligation Case Review",
        "Transparent Flight Pricing",
        "Coordinator On The Line",
        "Urgent Quote Available",
        "Tel Aviv Hospital Transfer",
        "Start With One Call",
      ].join(" | "),
      descriptions: [
        `Want pricing for a medical flight to Israel? Call ${PHONE} — quote desk 24/7.`,
        "We compare air ambulance vs medical escort and explain cost drivers clearly.",
        "Share patient location + condition; receive options and next steps on the call.",
        "Lead goal: phone or WhatsApp within the first interaction — not just a page view.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.flightEn.name,
      ad_group: "Phrase — TO Israel",
      type: "Responsive search ad",
      final_url: FINAL_URL_FLIGHT,
      path1: "Medevac",
      path2: "Israel",
      headlines: [
        "Medevac to Israel — Call",
        `${BRAND}`,
        "Request Quote Now",
        "Call for Flight Options",
        "Get a Quote Today",
        "Family Help Line 24/7",
        "Medical Flight Options",
        "Private Air Ambulance",
        "Escort on Commercial Flight",
        "Critical Care Transfer",
        "WhatsApp Us to Start",
        "Clear Next Steps Today",
        "Israel Hospital Intake",
        "Fast International Desk",
        "Talk to Coordination Now",
      ].join(" | "),
      descriptions: [
        `Searching medical flight to Israel? Call ${PHONE} or WhatsApp for immediate intake.`,
        "We coordinate aircraft/escort, permits, and bedside continuity end to end.",
        "Built for families abroad who need a clear quote and a real human now.",
        "Conversion focus: click → call → qualified lead with case details captured.",
      ].join(" | "),
    },
  ];
}

function buildLeadAssets() {
  return {
    research_sources: [
      "https://www.levadeer.org/ambulance-tiberias",
      "https://www.ambulance24.net/",
      "https://ambulancenter.com/",
      "https://ambulancenter.com/booking.html",
      "https://arrowaviation.biz/flights/medical-flights/",
      "https://airmedical.com/air-ambulance-in-israel/",
      "https://www.medical-air-service.com/medical-evacuation-flights/israel_il.html",
      "https://medjets.com/medical-plane-cost/",
    ],
    lead_formula: [
      "Primary CTA = phone call (click-to-call)",
      "Secondary CTA = WhatsApp",
      "Promise = 24/7 human answer + quote/booking in one conversation",
      "Local proof = Poria/Tiberias/North hospitals for ground",
      "Flight proof = Bed-to-Bed + case review + itemized quote",
    ],
    callouts_he: [
      "זמינים 24/7",
      "מענה אנושי מהיר",
      "הצעת מחיר בשיחה",
      "WhatsApp פעיל",
      "העברות מפוריה",
      "שינוע לכל הארץ",
      "Bed-to-Bed",
      "צוות מוסמך",
    ],
    callouts_en: [
      "24/7 Coordination Desk",
      "Call for Quote",
      "WhatsApp Intake",
      "Bed-to-Bed Service",
      "ICU Aircraft Options",
      "Medical Escort Alternative",
      "Hospital Handoff Israel",
      "Family Support Line",
    ],
    sitelinks_he: [
      { text: "הזמנת אמבולנס עכשיו", desc1: "מוקד 24/7", desc2: "טלפון או WhatsApp" },
      { text: "הצעת מחיר מהירה", desc1: "שיחה אחת", desc2: "מחיר לפני יציאה" },
      { text: "העברה מפוריה", desc1: "שחרור / העברה", desc2: "תיאום מיידי" },
      { text: "הטסה רפואית לישראל", desc1: "מטוס / ליווי", desc2: "Bed-to-Bed" },
    ],
    sitelinks_en: [
      { text: "Get a Quote", desc1: "Call 24/7", desc2: "Case review now" },
      { text: "Air Ambulance", desc1: "ICU options", desc2: "To Israel" },
      { text: "Medical Escort", desc1: "Commercial flight", desc2: "Lower-cost path" },
      { text: "WhatsApp Intake", desc1: "Send case details", desc2: "Fast response" },
    ],
    conversion_setup: [
      "Import phone-call conversions (calls from ads > 60s)",
      "Track WhatsApp click as conversion (GTM/event)",
      "Track form submit on booking page as primary lead",
      "Use Maximize Conversions only after 30+ conv/month; until then Manual CPC + Exact",
      "Landing pages must show phone sticky on mobile + WhatsApp button above the fold",
    ],
  };
}

/** Google Ads Editor bulk import (campaigns + ad groups + keywords + ads + negatives) */
function buildEditorImport(keywordRows, negativeRows, adRows) {
  const rows = [];

  for (const c of Object.values(CAMPAIGNS)) {
    rows.push({
      row_type: "Campaign",
      campaign: c.name,
      campaign_type: "Search",
      campaign_status: "Paused",
      budget: String(c.budgetDaily),
      budget_type: "Daily",
      networks: "Google search",
      bid_strategy_type: "Manual CPC",
      ad_group: "",
      ad_group_status: "",
      max_cpc: "",
      keyword: "",
      criterion_type: "",
      keyword_status: "",
      final_url: "",
      path1: "",
      path2: "",
      headline_1: "",
      description_1: "",
      negative: "",
    });
  }

  const adGroups = new Map();
  for (const kw of keywordRows) {
    const key = `${kw.campaign}||${kw.ad_group}`;
    if (!adGroups.has(key)) {
      adGroups.set(key, kw);
      rows.push({
        row_type: "Ad group",
        campaign: kw.campaign,
        campaign_type: "",
        campaign_status: "",
        budget: "",
        budget_type: "",
        networks: "",
        bid_strategy_type: "",
        ad_group: kw.ad_group,
        ad_group_status: "Enabled",
        max_cpc: kw.max_cpc,
        keyword: "",
        criterion_type: "",
        keyword_status: "",
        final_url: "",
        path1: "",
        path2: "",
        headline_1: "",
        description_1: "",
        negative: "",
      });
    }
  }

  for (const kw of keywordRows) {
    rows.push({
      row_type: "Keyword",
      campaign: kw.campaign,
      campaign_type: "",
      campaign_status: "",
      budget: "",
      budget_type: "",
      networks: "",
      bid_strategy_type: "",
      ad_group: kw.ad_group,
      ad_group_status: "",
      max_cpc: kw.max_cpc,
      keyword: kw.keyword,
      criterion_type: kw.match_type,
      keyword_status: "Enabled",
      final_url: "",
      path1: "",
      path2: "",
      headline_1: "",
      description_1: "",
      negative: "",
    });
  }

  for (const ad of adRows) {
    const headlines = ad.headlines.split(" | ");
    const descriptions = ad.descriptions.split(" | ");
    rows.push({
      row_type: "Ad",
      campaign: ad.campaign,
      campaign_type: "",
      campaign_status: "",
      budget: "",
      budget_type: "",
      networks: "",
      bid_strategy_type: "",
      ad_group: ad.ad_group,
      ad_group_status: "",
      max_cpc: "",
      keyword: "",
      criterion_type: "",
      keyword_status: "",
      final_url: ad.final_url,
      path1: ad.path1,
      path2: ad.path2,
      headline_1: headlines.slice(0, 15).join(" | "),
      description_1: descriptions.slice(0, 4).join(" | "),
      negative: "",
    });
  }

  for (const n of negativeRows) {
    if (n.level === "Account") {
      rows.push({
        row_type: "Campaign negative",
        campaign: "__ACCOUNT_NEGATIVES_APPLY_MANUALLY__",
        campaign_type: "",
        campaign_status: "",
        budget: "",
        budget_type: "",
        networks: "",
        bid_strategy_type: "",
        ad_group: "",
        ad_group_status: "",
        max_cpc: "",
        keyword: n.keyword,
        criterion_type: n.match_type,
        keyword_status: "",
        final_url: "",
        path1: "",
        path2: "",
        headline_1: "",
        description_1: "",
        negative: "Yes",
      });
    } else {
      rows.push({
        row_type: "Campaign negative",
        campaign: n.campaign,
        campaign_type: "",
        campaign_status: "",
        budget: "",
        budget_type: "",
        networks: "",
        bid_strategy_type: "",
        ad_group: "",
        ad_group_status: "",
        max_cpc: "",
        keyword: n.keyword,
        criterion_type: n.match_type,
        keyword_status: "",
        final_url: "",
        path1: "",
        path2: "",
        headline_1: "",
        description_1: "",
        negative: "Yes",
      });
    }
  }

  return rows;
}

function buildWeeklyAuditChecklist() {
  return `# Weekly Search Terms Audit (automation checklist)

Run every week (Sunday recommended):

1. Google Ads → Insights and reports → Search terms
2. Filter last 7 days, cost > 0
3. For each converting term not yet Exact → add as Exact in the matching ad group
4. For each irrelevant term → add as Negative (Phrase unless brand collision risk → Exact)
5. Pause Phrase keywords with spend and 0 conversions after 14+ days (if Exact covers intent)
6. Export search terms CSV into \`advertising/google-ads/out/search-terms-YYYY-MM-DD.csv\` for history

## Decision rules
| Signal | Action |
|--------|--------|
| Conversions ≥ 1 | Promote to Exact |
| Irrelevant intent | Campaign/Account Negative |
| High cost, 0 conv, 14d+ | Pause or tighten match |
| Competitor brand queries | Skip unless legal/brand strategy approved |

## Do NOT
- Use Broad match at launch
- Click competitor ads
- Add Display/PMax until Search CPQL is stable
`;
}

function buildSummary(keywordRows, negativeRows, adRows) {
  const byCampaign = {};
  for (const kw of keywordRows) {
    byCampaign[kw.campaign] ??= { exact: 0, phrase: 0 };
    if (kw.match_type === "Exact") byCampaign[kw.campaign].exact += 1;
    else byCampaign[kw.campaign].phrase += 1;
  }
  return {
    generated_at: new Date().toISOString(),
    brand: BRAND,
    landing_urls: {
      ambulance: FINAL_URL_AMBULANCE,
      flight: FINAL_URL_FLIGHT,
    },
    phone_placeholder: PHONE,
    totals: {
      keywords: keywordRows.length,
      negatives: negativeRows.length,
      ads: adRows.length,
      campaigns: Object.keys(CAMPAIGNS).length,
    },
    by_campaign: byCampaign,
    notes: [
      "Campaigns are exported as Paused — enable after URL/phone review in Google Ads Editor.",
      "Replace ADS_LANDING_* and ADS_PHONE env vars before production import.",
      "Account-level negatives are listed with campaign=__ACCOUNT_NEGATIVES_APPLY_MANUALLY__ — apply once at account shared list.",
    ],
  };
}

/**
 * Enforce Google Ads Responsive Search Ad limits so we never emit assets that
 * Google would truncate or disapprove. Counts characters by code points so
 * Hebrew/RTL text is measured correctly. Throws with a full list of problems.
 */
const RSA_LIMITS = { headlineMax: 30, descriptionMax: 90, pathMax: 15, headlinesMax: 15, descriptionsMax: 4 };

function validateAds(adRows) {
  const len = (s) => [...String(s).trim()].length;
  const problems = [];
  for (const ad of adRows) {
    const where = `${ad.campaign} › ${ad.ad_group}`;
    const headlines = String(ad.headlines).split(" | ").map((s) => s.trim());
    const descriptions = String(ad.descriptions).split(" | ").map((s) => s.trim());

    if (headlines.length > RSA_LIMITS.headlinesMax)
      problems.push(`${where}: ${headlines.length} headlines (max ${RSA_LIMITS.headlinesMax})`);
    if (headlines.length < 3) problems.push(`${where}: only ${headlines.length} headlines (min 3)`);
    if (descriptions.length > RSA_LIMITS.descriptionsMax)
      problems.push(`${where}: ${descriptions.length} descriptions (max ${RSA_LIMITS.descriptionsMax})`);
    if (descriptions.length < 2) problems.push(`${where}: only ${descriptions.length} descriptions (min 2)`);

    for (const h of headlines)
      if (len(h) > RSA_LIMITS.headlineMax) problems.push(`${where}: headline ${len(h)}/${RSA_LIMITS.headlineMax} "${h}"`);
    for (const d of descriptions)
      if (len(d) > RSA_LIMITS.descriptionMax) problems.push(`${where}: description ${len(d)}/${RSA_LIMITS.descriptionMax} "${d}"`);
    for (const p of [ad.path1, ad.path2])
      if (p && len(p) > RSA_LIMITS.pathMax) problems.push(`${where}: path ${len(p)}/${RSA_LIMITS.pathMax} "${p}"`);
  }
  if (problems.length) {
    throw new Error(`RSA validation failed (${problems.length} issue(s)):\n- ${problems.join("\n- ")}`);
  }
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const keywordRows = [...buildAmbulanceKeywords(), ...buildFlightKeywords()];
  const negativeRows = buildNegatives();
  const adRows = buildAds();
  validateAds(adRows);
  const leadAssets = buildLeadAssets();
  const editorRows = buildEditorImport(keywordRows, negativeRows, adRows);
  const summary = buildSummary(keywordRows, negativeRows, adRows);
  summary.lead_formula = leadAssets.lead_formula;
  summary.conversion_setup = leadAssets.conversion_setup;

  write(
    "keywords.csv",
    toCsv(["campaign", "ad_group", "keyword", "match_type", "max_cpc"], keywordRows)
  );
  write(
    "negative-keywords.csv",
    toCsv(["level", "campaign", "keyword", "match_type", "category"], negativeRows)
  );
  write(
    "responsive-search-ads.csv",
    toCsv(
      ["campaign", "ad_group", "type", "final_url", "path1", "path2", "headlines", "descriptions"],
      adRows
    )
  );
  write(
    "google-ads-editor-import.csv",
    toCsv(
      [
        "row_type",
        "campaign",
        "campaign_type",
        "campaign_status",
        "budget",
        "budget_type",
        "networks",
        "bid_strategy_type",
        "ad_group",
        "ad_group_status",
        "max_cpc",
        "keyword",
        "criterion_type",
        "keyword_status",
        "final_url",
        "path1",
        "path2",
        "headline_1",
        "description_1",
        "negative",
      ],
      editorRows
    )
  );
  write("weekly-search-terms-audit.md", buildWeeklyAuditChecklist());
  write("lead-assets.json", JSON.stringify(leadAssets, null, 2) + "\n");
  write(
    "lead-research.md",
    `# Lead research → ad decisions

## What converting competitors do
- Phone number / **חייגו עכשיו** as primary CTA (Tiberias private ambulance SERPs)
- WhatsApp as secondary CTA (IAA + local competitors)
- **24/7** in every headline set
- Local hospital intents: **פוריה**, שחרור, דיאליזה, העברה בין בתי חולים
- Flight: **הצעת מחיר**, Bed-to-Bed, case review, medical escort alternative

## Our lead formula
${leadAssets.lead_formula.map((x) => `- ${x}`).join("\n")}

## Conversion tracking (required for lead ads to optimize)
${leadAssets.conversion_setup.map((x) => `- ${x}`).join("\n")}

## Sources
${leadAssets.research_sources.map((x) => `- ${x}`).join("\n")}
`
  );
  write("summary.json", JSON.stringify(summary, null, 2) + "\n");

  // Human-readable keyword lists for quick paste
  const exactAmbulance = keywordRows
    .filter((r) => r.campaign === CAMPAIGNS.ambulance.name && r.match_type === "Exact")
    .map((r) => `[${r.keyword}]`);
  const phraseAmbulance = keywordRows
    .filter((r) => r.campaign === CAMPAIGNS.ambulance.name && r.match_type === "Phrase")
    .map((r) => `"${r.keyword}"`);
  write(
    "keywords-paste-ambulance.txt",
    ["# Exact", ...exactAmbulance, "", "# Phrase", ...phraseAmbulance].join("\n") + "\n"
  );

  const exactFlight = keywordRows
    .filter(
      (r) =>
        (r.campaign === CAMPAIGNS.flightHe.name || r.campaign === CAMPAIGNS.flightEn.name) &&
        r.match_type === "Exact"
    )
    .map((r) => `[${r.keyword}]`);
  const phraseFlight = keywordRows
    .filter(
      (r) =>
        (r.campaign === CAMPAIGNS.flightHe.name || r.campaign === CAMPAIGNS.flightEn.name) &&
        r.match_type === "Phrase"
    )
    .map((r) => `"${r.keyword}"`);
  write(
    "keywords-paste-flights.txt",
    ["# Exact", ...exactFlight, "", "# Phrase", ...phraseFlight].join("\n") + "\n"
  );

  console.log(`Generated advertising assets in ${OUT}`);
  console.log(JSON.stringify(summary.totals, null, 2));
}

main();
