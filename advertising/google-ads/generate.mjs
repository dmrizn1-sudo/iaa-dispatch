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
  const exactSet = unique([
    ...AMBULANCE_CORE_EXACT,
    ...NORTH_LOCALITIES.map((place) => `אמבולנס פרטי ${place}`),
    ...NORTH_LOCALITIES.map((place) => `פינוי רפואי פרטי ${place}`),
  ]);

  for (const kw of exactSet) {
    rows.push({
      campaign: CAMPAIGNS.ambulance.name,
      ad_group: "Exact — ליבה מקומית",
      keyword: kw,
      match_type: "Exact",
      max_cpc: "25",
    });
  }
  for (const kw of unique(AMBULANCE_PHRASE)) {
    rows.push({
      campaign: CAMPAIGNS.ambulance.name,
      ad_group: "Phrase — הרחבה מבוקרת",
      keyword: kw,
      match_type: "Phrase",
      max_cpc: "18",
    });
  }
  return rows;
}

function buildFlightKeywords() {
  const rows = [];
  for (const kw of unique(FLIGHT_EXACT_HE)) {
    rows.push({
      campaign: CAMPAIGNS.flightHe.name,
      ad_group: "Exact — הטסות לישראל",
      keyword: kw,
      match_type: "Exact",
      max_cpc: "40",
    });
  }
  for (const kw of unique(FLIGHT_PHRASE_HE)) {
    rows.push({
      campaign: CAMPAIGNS.flightHe.name,
      ad_group: "Phrase — הטסות לישראל",
      keyword: kw,
      match_type: "Phrase",
      max_cpc: "30",
    });
  }
  for (const kw of unique(FLIGHT_EXACT_EN)) {
    rows.push({
      campaign: CAMPAIGNS.flightEn.name,
      ad_group: "Exact — TO Israel",
      keyword: kw,
      match_type: "Exact",
      max_cpc: "45",
    });
  }
  for (const kw of unique(FLIGHT_PHRASE_EN)) {
    rows.push({
      campaign: CAMPAIGNS.flightEn.name,
      ad_group: "Phrase — TO Israel",
      keyword: kw,
      match_type: "Phrase",
      max_cpc: "35",
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
  return [
    {
      campaign: CAMPAIGNS.ambulance.name,
      ad_group: "Exact — ליבה מקומית",
      type: "Responsive search ad",
      final_url: FINAL_URL_AMBULANCE,
      path1: "טבריה",
      path2: "אמבולנס",
      headlines: [
        "אמבולנס פרטי בטבריה",
        `${BRAND}`,
        "זמינים 24/7 בצפון",
        "פינוי רפואי מקצועי",
        "הגעה מהירה באזור הכנרת",
        "שינוע בין בתי חולים",
        "צוות רפואי מיומן",
        "הזמנה עכשיו בטלפון",
        "שירות פרטי ואמין",
        "כיסוי טבריה והסביבה",
        "ALS ו-BLS לפי הצורך",
        "מענה אנושי מהיר",
      ].join(" | "),
      descriptions: [
        "אמבולנס פרטי לטבריה והצפון — זמינות מלאה, צוות מקצועי ושינוע בטוח.",
        `התקשרו ${PHONE} לפינוי או העברה רפואית. שירות פרטי מסביב לשעון.`,
        "העברות בין מחלקות ובתי חולים באזור הכנרת ועמק הירדן.",
        "שקיפות במחיר, מענה מהיר, וליווי עד היעד.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.ambulance.name,
      ad_group: "Phrase — הרחבה מבוקרת",
      type: "Responsive search ad",
      final_url: FINAL_URL_AMBULANCE,
      path1: "צפון",
      path2: "פרטי",
      headlines: [
        "אמבולנס פרטי בצפון",
        `${BRAND}`,
        "פינוי רפואי פרטי",
        "זמין עכשיו באזורכם",
        "העברה רפואית מקצועית",
        "שירות 24 שעות",
        "צוות מנוסה ומהיר",
        "כיסוי יישובי הסביבה",
        "הזמנת אמבולנס בטלפון",
        "שינוע חולה פרטי",
        "מענה אנושי מיידי",
        "פתרון רפואי מלא",
      ].join(" | "),
      descriptions: [
        "מחפשים אמבולנס פרטי בצפון? הגעה מהירה וליווי רפואי מקצועי.",
        `צרו קשר ב-${PHONE} לקביעת פינוי או העברה.`,
        "שירות לטבריה, כנרת, עמק הירדן ויישובי הגליל.",
        "דיוק, זמינות ושירות אישי — בלי המתנה מיותרת.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.flightHe.name,
      ad_group: "Exact — הטסות לישראל",
      type: "Responsive search ad",
      final_url: FINAL_URL_FLIGHT,
      path1: "הטסה",
      path2: "רפואית",
      headlines: [
        "הטסה רפואית לישראל",
        `${BRAND}`,
        "מטוס אמבולנס פרטי",
        "פינוי אווירי מקצועי",
        "שינוע חולה מחו״ל",
        "צוות ICU בטיסה",
        "תיאום מלא עד הארץ",
        "מענה 24/7 למשפחות",
        "Bed-to-Bed לישראל",
        "הטסה דחופה מאורגנת",
        "ליווי רפואי מלא",
        "יצירת קשר מיידית",
      ].join(" | "),
      descriptions: [
        "הטסה רפואית לישראל עם צוות מקצועי, תיאום בתי חולים וליווי מלא.",
        `פנו עכשיו ל-${PHONE} להערכת מקרה ותיאום פינוי אווירי.`,
        "מטוס אמבולנס / ליווי רפואי בטיסה לפי מצב המטופל.",
        "שקיפות בתהליך, מענה מהיר למשפחות בארץ ובחו״ל.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.flightEn.name,
      ad_group: "Exact — TO Israel",
      type: "Responsive search ad",
      final_url: FINAL_URL_FLIGHT,
      path1: "Medical",
      path2: "Flight",
      headlines: [
        "Air Ambulance to Israel",
        `${BRAND}`,
        "Medical Flight to Israel",
        "24/7 Medevac Coordination",
        "ICU-Level Air Transport",
        "Private Patient Transfer",
        "Bed-to-Bed to Israel",
        "Emergency Medical Flight",
        "International Repatriation",
        "Experienced Flight Crew",
        "Fast Family Response",
        "Call for Case Review",
      ].join(" | "),
      descriptions: [
        "Private air ambulance and medical flights to Israel with full clinical coordination.",
        `Call ${PHONE} for urgent case assessment and flight planning.`,
        "ICU capability, bedside pickup, and hospital handoff in Israel.",
        "Clear process for families abroad — fast response, professional care.",
      ].join(" | "),
    },
    {
      campaign: CAMPAIGNS.flightEn.name,
      ad_group: "Phrase — TO Israel",
      type: "Responsive search ad",
      final_url: FINAL_URL_FLIGHT,
      path1: "Air",
      path2: "Ambulance",
      headlines: [
        "Medical Evacuation Israel",
        `${BRAND}`,
        "Fly a Patient to Israel",
        "Private Air Ambulance",
        "Critical Care Flights",
        "Hospital Transfer Flights",
        "Medevac Coordination Desk",
        "International Patient Flight",
        "Safe Transfer Home",
        "Licensed Medical Crew",
        "Urgent Flight Planning",
        "Speak to a Coordinator",
      ].join(" | "),
      descriptions: [
        "Need a medical flight to Israel? We coordinate aircraft, crew, and receiving hospital.",
        `Contact ${PHONE} for a private air ambulance quote.`,
        "From bedside abroad to hospital care in Israel — one coordinated transfer.",
        "Built for families who need speed, clarity, and clinical reliability.",
      ].join(" | "),
    },
  ];
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

function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const keywordRows = [...buildAmbulanceKeywords(), ...buildFlightKeywords()];
  const negativeRows = buildNegatives();
  const adRows = buildAds();
  const editorRows = buildEditorImport(keywordRows, negativeRows, adRows);
  const summary = buildSummary(keywordRows, negativeRows, adRows);

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
