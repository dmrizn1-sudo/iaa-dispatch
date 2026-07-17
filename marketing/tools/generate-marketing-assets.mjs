#!/usr/bin/env node
/**
 * Generates keyword CSVs, hashtag library, country/city keyword matrix,
 * and social posts JSON for Israel Air Ambulance marketing system.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const ADS = path.join(ROOT, "google-ads");
const SOCIAL = path.join(ROOT, "social");

const geo = JSON.parse(fs.readFileSync(path.join(DATA, "geo.json"), "utf8"));

const CAMPAIGNS = [
  { id: "to-israel", name: "Air Ambulance TO Israel", theme: "to_israel" },
  { id: "from-israel", name: "Air Ambulance FROM Israel", theme: "from_israel" },
  { id: "medical-repatriation", name: "Medical Repatriation", theme: "repatriation" },
  { id: "intl-patient-transfer", name: "International Patient Transfer", theme: "transfer" },
  { id: "icu-air-ambulance", name: "ICU Air Ambulance", theme: "icu" },
  { id: "emergency-medical-flight", name: "Emergency Medical Flight", theme: "emergency" },
  { id: "private-air-ambulance", name: "Private Air Ambulance", theme: "private" },
  { id: "medical-escort", name: "Medical Escort Flights", theme: "escort" },
  { id: "commercial-escort", name: "Commercial Flight Medical Escort", theme: "commercial_escort" },
  { id: "stretcher-flights", name: "Stretcher Flights", theme: "stretcher" },
  { id: "bed-to-bed", name: "Bed to Bed Medical Transport", theme: "bed_to_bed" },
  { id: "fly-patient-home", name: "Fly Patient Home", theme: "fly_home" },
  { id: "emergency-patient-return", name: "Emergency Patient Return", theme: "patient_return" }
];

const CORE_PHRASES = {
  to_israel: [
    "air ambulance to israel",
    "medical flight to israel",
    "fly patient to israel",
    "medical repatriation to israel",
    "emergency medical flight to israel",
    "private air ambulance to israel",
    "icu air ambulance to israel",
    "patient transfer to israel",
    "medical transport to israel",
    "critical care flight to israel",
    "air ambulance israel from abroad",
    "bring patient home to israel",
    "medical evacuation to israel",
    "medevac to israel",
    "international air ambulance israel",
    "air ambulance tel aviv",
    "medical flight tel aviv",
    "air ambulance jerusalem"
  ],
  from_israel: [
    "air ambulance from israel",
    "medical flight from israel",
    "fly patient from israel",
    "medical repatriation from israel",
    "emergency medical flight from israel",
    "private air ambulance from israel",
    "patient transfer from israel",
    "medical transport from israel",
    "air ambulance out of israel",
    "leave israel medical flight",
    "international transfer from israel",
    "icu transport from israel",
    "air ambulance tel aviv to abroad"
  ],
  repatriation: [
    "medical repatriation",
    "medical repatriation israel",
    "patient repatriation flight",
    "repatriation medical flight",
    "repatriation air ambulance",
    "fly home medical repatriation",
    "international medical repatriation",
    "repatriation with medical escort",
    "private medical repatriation",
    "emergency medical repatriation"
  ],
  transfer: [
    "international patient transfer",
    "international medical transport",
    "cross border patient transfer",
    "overseas patient transfer",
    "hospital to hospital air transfer",
    "international hospital transfer",
    "long distance patient transfer",
    "international critical care transfer",
    "patient transfer israel",
    "medical transfer flight"
  ],
  icu: [
    "icu air ambulance",
    "icu medical flight",
    "intensive care air ambulance",
    "critical care air ambulance",
    "icu patient transport flight",
    "ventilator air ambulance",
    "critical care medical flight",
    "mobile icu flight",
    "icu transport israel",
    "intensive care medical transport"
  ],
  emergency: [
    "emergency medical flight",
    "emergency air ambulance",
    "urgent medical flight",
    "emergency patient transfer flight",
    "24 hour air ambulance",
    "emergency medevac",
    "urgent air ambulance israel",
    "emergency medical transport flight",
    "same day air ambulance",
    "emergency medical evacuation flight"
  ],
  private: [
    "private air ambulance",
    "private medical flight",
    "private jet air ambulance",
    "private air ambulance israel",
    "charter air ambulance",
    "private critical care flight",
    "private medical jet",
    "hire private air ambulance",
    "private ambulance flight",
    "family paid air ambulance"
  ],
  escort: [
    "medical escort flight",
    "flight medical escort",
    "doctor escort flight",
    "paramedic escort flight",
    "medical escort israel",
    "nurse escort flight",
    "international medical escort",
    "medical companion flight",
    "flight nurse escort",
    "medical escort service"
  ],
  commercial_escort: [
    "commercial flight medical escort",
    "medical escort commercial flight",
    "doctor on commercial flight",
    "paramedic commercial flight escort",
    "airline medical escort",
    "commercial stretcher medical escort",
    "fit to fly medical escort",
    "scheduled flight medical escort",
    "economy medical escort flight",
    "commercial air medical escort israel"
  ],
  stretcher: [
    "stretcher flight",
    "stretcher air ambulance",
    "airline stretcher service",
    "stretcher medical flight",
    "commercial stretcher flight",
    "stretcher transport flight",
    "patient stretcher flight israel",
    "book stretcher on flight",
    "international stretcher flight",
    "hospital stretcher flight"
  ],
  bed_to_bed: [
    "bed to bed medical transport",
    "bedside to bedside air ambulance",
    "bed to bed air ambulance",
    "door to door medical flight",
    "hospital bed to bed transfer",
    "bedside to bedside transport",
    "complete medical transfer bed to bed",
    "bed to bed patient transfer israel",
    "ground and air bed to bed",
    "seamless bed to bed medical transport"
  ],
  fly_home: [
    "fly patient home",
    "fly loved one home medical",
    "fly family member home sick",
    "bring patient home by air",
    "fly sick relative home",
    "medical flight home",
    "fly patient home to israel",
    "fly patient home from israel",
    "bring them home medical flight",
    "fly home after hospitalization abroad",
    "patient flight home international",
    "arrange flight home for patient"
  ],
  patient_return: [
    "emergency patient return",
    "emergency return of patient",
    "urgent patient return home",
    "emergency medical return flight",
    "return patient to israel emergency",
    "emergency return from abroad medical",
    "urgent repatriation flight",
    "emergency patient transfer home",
    "bring patient back urgently",
    "emergency return medical transport"
  ]
};

const MATCH_TYPES = ["Exact", "Phrase"];

const NEGATIVES = [
  // Jobs / careers
  "job", "jobs", "career", "careers", "hiring", "salary", "salaries", "wage", "wages",
  "vacancy", "vacancies", "recruitment", "resume", "cv", "indeed", "glassdoor",
  "linkedin jobs", "apply now", "job application", "employment", "work from home ems",
  "paramedic jobs", "flight nurse jobs", "emt jobs", "ambulance jobs israel",
  // Training / education
  "course", "courses", "training", "school", "schools", "college", "university",
  "degree", "certificate", "certification", "emt school", "paramedic school",
  "paramedic course", "emt course", "flight nurse course", "how to become",
  "volunteer", "volunteering", "internship", "intern", "academy", "syllabus",
  "online course", "study paramedic", "emt certification", "bls course", "acls course",
  // Free / DIY / research
  "free", "cheap", "diy", "template", "pdf", "download", "wiki", "wikipedia",
  "low cost", "discount", "coupon", "promo code", "cheapest",
  // Insurance / claims (B2B noise unless private referral)
  "insurance claim", "insurance claims", "claim form", "reimbursement form",
  "medicare", "medicaid", "nhs claim", "insurance company", "policy number",
  "workers compensation", "workmans compensation", "hmo claim",
  // Local / ground ambulance noise
  "911", "999", "112", "mda", "magen david adom", "local ambulance",
  "ambulance driver", "ambulance drivers", "ground ambulance near me",
  "call ambulance", "ambulance service near me", "municipal ambulance",
  "government ambulance", "public ambulance", "regular ambulance",
  "fire department ambulance", "ems job", "ems jobs", "near me ambulance",
  "wheelchair transport", "wheelchair van", "non emergency transport",
  "taxi", "uber", "lyft", "ride share", "domestic ambulance",
  "ambulance israel only", "private ambulance israel domestic",
  "hospital discharge ambulance israel", "local ems", "city ambulance",
  // Domestic Israel ground (not this product line for paid search)
  "private ambulance tel aviv price", "ambulance for hospital discharge israel only",
  "אמבולנס פרטי", "אמבולנס תל אביב", "העברה לבית חולים",
  // Medical tourism (explicitly excluded from ads)
  "medical tourism", "medical tourist", "plastic surgery flight",
  "cosmetic surgery travel", "dental tourism", "ivf tourism",
  "elective surgery travel", "surgery vacation", "health tourism",
  "transplant tourism", "bariatric tourism",
  // Unrelated
  "toy", "toys", "lego", "model airplane", "flight simulator",
  "video game", "movie", "netflix", "gif", "meme",
  "animal ambulance", "pet ambulance", "veterinary air ambulance",
  "organ transplant waiting list", "blood donation", "drone ambulance",
  "helicopter toy", "rc ambulance",
  // Competitor junk / research
  "reddit", "quora", "forum", "news", "stock price", "ipo",
  "youtube", "tiktok", "podcast", "book review",
  // Military / government / NGO bulk
  "nato", "unHCR", "ngo tender", "government tender", "rfp",
  "ministry of health tender", "idf", "military medevac contract",
  "humanitarian airlift", "red cross recruitment",
  // Non-intent / informational waste
  "definition", "what is air ambulance cost calculator only",
  "statistics", "history of", "documentary", "meaning of",
  "how much does an air ambulance cost average only",
  "air ambulance movie", "air ambulance tv show"
];

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

function cityKeywords(city, countryName) {
  const places = unique([city.name, ...(city.aliases || []), countryName]);
  const out = [];
  for (const place of places) {
    const p = place.toLowerCase();
    out.push(
      `air ambulance ${p} to israel`,
      `air ambulance israel to ${p}`,
      `medical flight ${p} to israel`,
      `medical flight from ${p} to israel`,
      `medical repatriation from ${p}`,
      `patient transfer ${p} israel`,
      `icu air ambulance ${p}`,
      `emergency medical flight ${p}`,
      `private air ambulance ${p}`,
      `medical escort flight ${p}`,
      `stretcher flight ${p} israel`,
      `bed to bed medical transport ${p}`
    );
  }
  return out;
}

function generateKeywords() {
  const rows = [];
  const countryByCode = Object.fromEntries(geo.priorityCountries.map((c) => [c.code, c.name]));

  for (const campaign of CAMPAIGNS) {
    const phrases = CORE_PHRASES[campaign.theme] || [];
    for (const phrase of phrases) {
      for (const match of MATCH_TYPES) {
        rows.push({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          ad_group: "Core High Intent",
          keyword: phrase,
          match_type: match,
          theme: campaign.theme,
          geo_level: "global"
        });
      }
    }
  }

  // Country-level keywords for TO/FROM + repatriation
  for (const country of geo.priorityCountries) {
    const c = country.name.toLowerCase();
    const countryPhrases = [
      `air ambulance from ${c} to israel`,
      `air ambulance to israel from ${c}`,
      `medical flight from ${c} to israel`,
      `medical repatriation from ${c} to israel`,
      `private air ambulance ${c} israel`,
      `emergency medical flight ${c} israel`,
      `icu air ambulance ${c} to israel`,
      `patient transfer from ${c} to israel`,
      `medical escort from ${c} to israel`,
      `air ambulance from israel to ${c}`
    ];
    for (const phrase of countryPhrases) {
      for (const match of MATCH_TYPES) {
        rows.push({
          campaign_id: "to-israel",
          campaign_name: "Air Ambulance TO Israel",
          ad_group: `Country — ${country.name}`,
          keyword: phrase,
          match_type: match,
          theme: "country",
          geo_level: country.code
        });
      }
    }
  }

  // City-level keywords
  for (const city of geo.cities) {
    if (city.country === "IL") continue; // Israel cities used in brand/landing, not as origin geo groups primarily
    const countryName = countryByCode[city.country] || city.country;
    const phrases = cityKeywords(city, countryName);
    for (const phrase of phrases) {
      for (const match of ["Phrase"]) {
        rows.push({
          campaign_id: "to-israel",
          campaign_name: "Air Ambulance TO Israel",
          ad_group: `City — ${city.name}`,
          keyword: phrase,
          match_type: match,
          theme: "city",
          geo_level: city.name
        });
      }
    }
    // FROM Israel city destinations
    for (const phrase of [
      `air ambulance from israel to ${city.name.toLowerCase()}`,
      `medical flight israel to ${city.name.toLowerCase()}`,
      `patient transfer israel to ${city.name.toLowerCase()}`
    ]) {
      rows.push({
        campaign_id: "from-israel",
        campaign_name: "Air Ambulance FROM Israel",
        ad_group: `City — ${city.name}`,
        keyword: phrase,
        match_type: "Phrase",
        theme: "city_from",
        geo_level: city.name
      });
    }
  }

  // Deduplicate by campaign+keyword+match
  const seen = new Set();
  const deduped = [];
  for (const row of rows) {
    const key = `${row.campaign_id}|${row.keyword}|${row.match_type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

function generateHashtags() {
  const core = [
    "#IsraelAirAmbulance",
    "#AirAmbulance",
    "#MedicalFlight",
    "#MedicalRepatriation",
    "#CriticalCareTransport",
    "#ICUTransport",
    "#EmergencyMedicalFlight",
    "#MedicalEscort",
    "#InternationalPatientTransport",
    "#WorldwideMedicalTransport",
    "#PrivateAirAmbulance",
    "#PatientTransfer"
  ];

  const service = [
    "#BedToBed",
    "#BedsideToBedside",
    "#StretcherFlight",
    "#MedicalJet",
    "#Medevac",
    "#AirMedical",
    "#FlightNurse",
    "#CriticalCareFlight",
    "#InternationalAirAmbulance",
    "#AirAmbulanceIsrael",
    "#MedicalFlightIsrael",
    "#RepatriationFlight",
    "#24x7Medical",
    "#EmergencyResponse",
    "#PatientSafety",
    "#TravelMedicine",
    "#ICUAirAmbulance",
    "#CommercialMedicalEscort",
    "#AirAmbulanceEurope",
    "#AirAmbulanceUSA",
    "#FlyPatientHome",
    "#EmergencyPatientReturn"
  ];

  const countries = geo.priorityCountries.map(
    (c) => `#${c.name.replace(/\s+/g, "").replace(/[^a-zA-Z]/g, "")}`
  );
  const cities = geo.cities.map(
    (c) => `#${c.name.replace(/\s+/g, "").replace(/[^a-zA-Z]/g, "")}`
  );

  const route = [
    "#IsraelUSA",
    "#IsraelEurope",
    "#IsraelUK",
    "#IsraelFrance",
    "#IsraelGermany",
    "#IsraelGreece",
    "#IsraelCyprus",
    "#IsraelDubai",
    "#IsraelThailand",
    "#TelAvivMedicalFlight",
    "#FlyHomeSafely",
    "#BringThemHome"
  ];

  // Hebrew Instagram hashtags (always useful for local discovery)
  const he_always = [
    "#ישראלאייראמבולנס",
    "#אמבולנסאווירי",
    "#טיסהרפואית",
    "#החזרהרפואית",
    "#טיפולנמרץ",
    "#העברתמטופל",
    "#ליווירפואי",
    "#ממיטהלמיטה",
    "#ישראל",
    "#תלאביב"
  ];
  const he_rotate = [
    "#אמבולנסאווירילישראל",
    "#אמבולנסאווירימישראל",
    "#טיסהרפואיתלישראל",
    "#טיסהרפואיתמישראל",
    "#העברהרפואית",
    "#מטוסרפואי",
    "#פינויאווירי",
    "#רפואתחירום",
    "#תיאוםרפואי",
    "#שירותיחירום",
    "#ICU",
    "#מדיקלאייר"
  ];

  return {
    always_include: core,
    service_rotate: service,
    country_rotate: unique(countries),
    city_rotate: unique(cities),
    route_rotate: route,
    he_always,
    he_rotate,
    rotation_rules: {
      per_post_total: 30,
      always: 12,
      he_always: 10,
      service_pick: 3,
      geo_pick: 3,
      route_pick: 1,
      he_rotate_pick: 2,
      note: "Instagram: always end with EN hashtags + HE hashtags. Rotate service/geo/route; never strip tags on publish."
    }
  };
}

function pickHashtags(hashtags, seed, geoTags = []) {
  const svc = hashtags.service_rotate;
  const cities = hashtags.city_rotate;
  const routes = hashtags.route_rotate;
  const heRot = hashtags.he_rotate || [];
  const s = seed % 1000;
  const servicePick = [svc[s % svc.length], svc[(s + 3) % svc.length], svc[(s + 7) % svc.length]];
  const cityPick = geoTags.length
    ? geoTags.slice(0, 3)
    : [cities[s % cities.length], cities[(s + 11) % cities.length], cities[(s + 19) % cities.length]];
  const routePick = [routes[s % routes.length]];
  const hePick = heRot.length
    ? [heRot[s % heRot.length], heRot[(s + 5) % heRot.length]]
    : [];
  const en = unique([...hashtags.always_include, ...servicePick, ...cityPick, ...routePick]);
  const he = unique([...(hashtags.he_always || []), ...hePick, ...geoTags.filter((t) => /[\u0590-\u05FF]/.test(t))]);
  return { en, he, all: unique([...en, ...he]) };
}

/** Instagram caption must end with EN then HE hashtag lines. */
function formatIgHashtags(tagSets) {
  const en = Array.isArray(tagSets) ? tagSets : tagSets.en || [];
  const he = Array.isArray(tagSets) ? [] : tagSets.he || [];
  const lines = [en.join(" ")];
  if (he.length) lines.push(he.join(" "));
  return lines.join("\n");
}

/** Join English + Hebrew blocks for bilingual social posts. */
function bilingual(en, he) {
  return `${en.trim()}\n\n────────\n\n${he.trim()}`;
}

function buildPosts() {
  const hashtags = generateHashtags();
  const posts = [];
  const phone = geo.brand.phoneIntl;
  const waLocal = geo.brand.whatsappLocal || "053-232-1101";
  const waIntl = geo.brand.whatsappIntl || "+972-53-232-1101";
  const web = geo.brand.website;

  const ctaEn =
    `Need a private air ambulance or medical escort TO Israel or FROM Israel?\n` +
    `📞 ${phone} (24/7)\n` +
    `💬 WhatsApp: ${waLocal} (${waIntl})\n` +
    `🌐 ${web}`;
  const ctaHe =
    `צריכים אמבולנס אווירי פרטי או ליווי רפואי לישראל / מישראל?\n` +
    `📞 ${phone} (24/7)\n` +
    `💬 וואטסאפ: ${waLocal}\n` +
    `🌐 ${web}`;
  const ctaShortEn = `📞 ${phone} (24/7)\n💬 WhatsApp: ${waLocal}\n🌐 ${web}`;
  const ctaShortHe = `📞 ${phone} (24/7)\n💬 וואטסאפ: ${waLocal}\n🌐 ${web}`;

  const carouselSets = [
    {
      id: "carousel-01-mission",
      title: "Mission Overview — Worldwide Air Ambulance",
      titleHe: "סקירת משימה — אמבולנס אווירי בינלאומי",
      slides: [
        "ISRAEL AIR AMBULANCE\nInternational medical flights 24/7",
        "Private air ambulance\nTO Israel & FROM Israel",
        "Critical care teams\nICU-capable medical aircraft",
        "Bedside to bedside\nHospital → Aircraft → Hospital",
        "Worldwide coordination\nUSA · Europe · Middle East · Asia",
        "Need a medical flight?\nCall / WhatsApp 24/7"
      ],
      slidesHe: [
        "ישראל אייר אמבולנס\nטיסות רפואיות בינלאומיות 24/7",
        "אמבולנס אווירי פרטי\nלישראל ומישראל",
        "צוותי טיפול נמרץ\nמטוס רפואי ברמת ICU",
        "ממיטה למיטה\nבית חולים → מטוס → בית חולים",
        "תיאום עולמי\nארה״ב · אירופה · המזרח התיכון · אסיה",
        "צריכים טיסה רפואית?\nשיחה / וואטסאפ 24/7"
      ]
    },
    {
      id: "carousel-02-aircraft",
      title: "Aircraft & ICU Capability",
      titleHe: "מטוס ויכולות טיפול נמרץ",
      slides: [
        "Configured medical aircraft\nfor intensive care transport",
        "Ventilation · Monitoring · Infusion\nICU standards in the air",
        "Flight physicians & critical care paramedics",
        "Stretcher & private jet options\nmatched to patient condition",
        "Commercial medical escort\nwhen clinically appropriate",
        "Request a clinical assessment\nIsrael Air Ambulance"
      ],
      slidesHe: [
        "מטוס רפואי מוגדר\nלהעברת טיפול נמרץ",
        "הנשמה · ניטור · עירוי\nסטנדרט ICU באוויר",
        "רופאי טיסה ופרמדיקים לטיפול נמרץ",
        "אלונקה ומטוס פרטי\nבהתאם למצב המטופל",
        "ליווי רפואי בטיסה מסחרית\nכשהמצב הקליני מאפשר",
        "בקשו הערכה קלינית\nישראל אייר אמבולנס"
      ]
    },
    {
      id: "carousel-03-usa",
      title: "Israel ↔ USA Routes",
      titleHe: "מסלולים ישראל ↔ ארה״ב",
      slides: [
        "Israel ↔ USA medical flights",
        "New York · Miami · Boston\nLos Angeles · San Francisco",
        "ICU air ambulance for complex cases",
        "Medical escort on commercial flights\nwhen suitable",
        "Families paying privately\nfast, clear coordination",
        "24/7 dispatch\nWhatsApp & phone"
      ],
      slidesHe: [
        "טיסות רפואיות ישראל ↔ ארה״ב",
        "ניו יורק · מיאמי · בוסטון\nלוס אנג׳לס · סן פרנסיסקו",
        "אמבולנס אווירי ICU למקרים מורכבים",
        "ליווי רפואי בטיסות מסחריות\nכשמתאים קלינית",
        "משפחות פרטיות\nתיאום מהיר וברור",
        "מוקד 24/7\nוואטסאפ וטלפון"
      ]
    },
    {
      id: "carousel-04-europe",
      title: "Israel ↔ Europe Routes",
      titleHe: "מסלולים ישראל ↔ אירופה",
      slides: [
        "Israel ↔ Europe air ambulance",
        "London · Paris · Berlin · Zurich\nRome · Athens · Barcelona",
        "Holiday medical emergencies\nrepatriation to Israel",
        "Bed-to-bed ground + air logistics",
        "Experienced international medical teams",
        "Call now for emergency transfer"
      ],
      slidesHe: [
        "אמבולנס אווירי ישראל ↔ אירופה",
        "לונדון · פריז · ברלין · ציריך\nרומא · אתונה · ברצלונה",
        "חירום רפואי בחופשה\nהחזרה רפואית לישראל",
        "לוגיסטיקה ממיטה למיטה — קרקע + אוויר",
        "צוותים רפואיים בינלאומיים מנוסים",
        "התקשרו עכשיו להעברה דחופה"
      ]
    },
    {
      id: "carousel-05-safety",
      title: "Patient Safety & Trust",
      titleHe: "בטיחות מטופל ואמון",
      slides: [
        "Patient safety first\non every medical flight",
        "Clinical screening before departure",
        "Continuous monitoring in flight",
        "Hospital handoff at destination",
        "Clear communication with families",
        "Israel Air Ambulance — 24/7"
      ],
      slidesHe: [
        "בטיחות המטופל קודמת\nבכל טיסה רפואית",
        "סינון קליני לפני המראה",
        "ניטור רציף במהלך הטיסה",
        "מסירה לבית החולים ביעד",
        "תקשורת ברורה עם המשפחה",
        "ישראל אייר אמבולנס — 24/7"
      ]
    },
    {
      id: "carousel-06-icu-crew",
      title: "ICU Equipment & Medical Crew",
      titleHe: "ציוד ICU וצוות רפואי",
      slides: [
        "ICU-capable medical flights\nfor critical patients",
        "Ventilators · Monitors · Infusion pumps",
        "Flight physicians &\ncritical care paramedics",
        "Equipment matched to\npatient condition",
        "Worldwide missions\nTO Israel & FROM Israel",
        "Request assessment 24/7\nCall / WhatsApp"
      ],
      slidesHe: [
        "טיסות רפואיות ברמת ICU\nלמטופלים קריטיים",
        "מנשמים · מוניטורים · משאבות עירוי",
        "רופאי טיסה &\nפרמדיקים לטיפול נמרץ",
        "ציוד מותאם\nלמצב המטופל",
        "משימות ברחבי העולם\nלישראל ומישראל",
        "בקשו הערכה 24/7\nשיחה / וואטסאפ"
      ]
    },
    {
      id: "carousel-07-fly-home",
      title: "Fly Patient Home",
      titleHe: "להטיס את המטופל הביתה",
      slides: [
        "Fly your loved one home\nsafely under medical care",
        "After hospitalization abroad\nwe arrange the return flight",
        "Private air ambulance\nor commercial medical escort",
        "Bedside to bedside\ncoordination included",
        "Private families · Self-pay\nClear, fast guidance",
        "Israel Air Ambulance\nWhatsApp 053-232-1101"
      ],
      slidesHe: [
        "מטיסים את יקירכם הביתה\nבבטחה תחת טיפול רפואי",
        "אחרי אשפוז בחו״ל\nאנחנו מתאמים את טיסת החזרה",
        "אמבולנס אווירי פרטי\nאו ליווי רפואי בטיסה מסחרית",
        "תיאום ממיטה למיטה\nכלול בתהליך",
        "משפחות פרטיות · תשלום עצמי\nהכוונה ברורה ומהירה",
        "ישראל אייר אמבולנס\nוואטסאפ 053-232-1101"
      ]
    },
    {
      id: "carousel-08-worldwide",
      title: "Worldwide Coverage 24/7",
      titleHe: "כיסוי עולמי 24/7",
      slides: [
        "Worldwide operations\n24/7 emergency response",
        "Israel ↔ USA",
        "Israel ↔ Europe",
        "Israel ↔ UAE · Asia · Africa",
        "Private international\nair ambulance only",
        "Call or WhatsApp now\nIsrael Air Ambulance"
      ],
      slidesHe: [
        "פעילות עולמית\nמענה חירום 24/7",
        "ישראל ↔ ארה״ב",
        "ישראל ↔ אירופה",
        "ישראל ↔ איחוד האמירויות · אסיה · אפריקה",
        "אמבולנס אווירי בינלאומי פרטי בלבד",
        "התקשרו או שלחו וואטסאפ עכשיו\nישראל אייר אמבולנס"
      ]
    }
  ];

  for (const [i, set] of carouselSets.entries()) {
    const tags = pickHashtags(hashtags, i + 1, ["#TelAviv", "#Israel", "#ישראל"]);
    const enBlock = [
      set.title,
      "",
      ...set.slides.map((s, idx) => `${idx + 1}/${set.slides.length}\n${s}`),
      "",
      "Private international air ambulance TO Israel and FROM Israel.",
      "ICU-capable · Bedside to bedside · Worldwide",
      "",
      ctaShortEn
    ].join("\n");
    const heBlock = [
      set.titleHe,
      "",
      ...set.slidesHe.map((s, idx) => `${idx + 1}/${set.slidesHe.length}\n${s}`),
      "",
      "אמבולנס אווירי בינלאומי פרטי לישראל ומישראל.",
      "יכולת ICU · ממיטה למיטה · בכל העולם",
      "",
      ctaShortHe
    ].join("\n");
    const ig = `${bilingual(enBlock, heBlock)}\n\n${formatIgHashtags(tags)}`;

    posts.push({
      id: set.id,
      platforms: ["instagram"],
      type: "carousel",
      day: (i + 1) * 5,
      theme: "carousel",
      title: set.title,
      titleHe: set.titleHe,
      slides: set.slides,
      slidesHe: set.slidesHe,
      copy: {
        instagram: ig,
        facebook: bilingual(
          enBlock +
            `\n\nNeed an emergency medical flight to or from Israel?\nCall ${phone} or WhatsApp ${waLocal} — available 24/7.\n${web}`,
          heBlock +
            `\n\nצריכים טיסה רפואית דחופה לישראל או מישראל?\nהתקשרו ${phone} או וואטסאפ ${waLocal} — זמינים 24/7.\n${web}`
        ),
        linkedin: bilingual(
          `${set.title}\n\nIsrael Air Ambulance provides private international air ambulance and medical repatriation services to and from Israel.\n\n` +
            set.slides.map((s) => `• ${s.replace(/\n/g, " — ")}`).join("\n") +
            `\n\nAvailable 24/7 for families arranging private medical flights.\nCall ${phone} · WhatsApp ${waLocal}\n${web}`,
          `${set.titleHe}\n\nישראל אייר אמבולנס מספקת אמבולנס אווירי בינלאומי פרטי והחזרה רפואית לישראל ומישראל.\n\n` +
            set.slidesHe.map((s) => `• ${s.replace(/\n/g, " — ")}`).join("\n") +
            `\n\nזמינים 24/7 למשפחות שמתאמות טיסה רפואית פרטית.\nשיחה ${phone} · וואטסאפ ${waLocal}\n${web}`
        )
      }
    });
  }

  // 90 educational / trust / route posts (approx 1/day for calendar) — bilingual EN + HE
  const themes = [
    {
      theme: "educational",
      title: "When is an air ambulance needed?",
      titleHe: "מתי נדרש אמבולנס אווירי?",
      body:
        "An air ambulance is considered when a patient needs continuous medical care during transfer — for example ICU support, oxygen/ventilation, or when commercial travel is not clinically appropriate.\n\nIsrael Air Ambulance coordinates private medical flights TO Israel and FROM Israel, including bedside-to-bedside logistics.",
      bodyHe:
        "אמבולנס אווירי נשקל כשהמטופל זקוק לטיפול רפואי רציף במהלך ההעברה — למשל תמיכת ICU, חמצן/הנשמה, או כשטיסה מסחרית אינה מתאימה קלינית.\n\nישראל אייר אמבולנס מתאמת טיסות רפואיות פרטיות לישראל ומישראל, כולל לוגיסטיקה ממיטה למיטה."
    },
    {
      theme: "educational",
      title: "Air ambulance vs medical escort",
      titleHe: "אמבולנס אווירי מול ליווי רפואי",
      body:
        "Private air ambulance: dedicated aircraft configured as a flying ICU for critical patients.\n\nCommercial medical escort: doctor/paramedic accompany the patient on a scheduled flight when clinically suitable — often a more cost-effective option.\n\nWe assess each case and recommend the safest appropriate solution.",
      bodyHe:
        "אמבולנס אווירי פרטי: מטוס ייעודי המוגדר כ־ICU מעופף למטופלים קריטיים.\n\nליווי רפואי בטיסה מסחרית: רופא/פרמדיק מלווים את המטופל בטיסה מתוזמנת כשהמצב הקליני מאפשר — לעיתים אפשרות חסכונית יותר.\n\nאנחנו מעריכים כל מקרה וממליצים על הפתרון הבטוח והמתאים ביותר."
    },
    {
      theme: "equipment",
      title: "ICU equipment in the air",
      titleHe: "ציוד טיפול נמרץ באוויר",
      body:
        "Critical care transports may require ventilators, multiparameter monitors, infusion pumps, suction, advanced airway equipment, and medications — configured to the patient’s condition before takeoff.\n\nClinical readiness is part of every mission plan.",
      bodyHe:
        "העברות טיפול נמרץ עשויות לדרוש מנשמים, מוניטורים רב־פרמטריים, משאבות עירוי, שאיבה, ציוד נתיב אוויר מתקדם ותרופות — מותאמים למצב המטופל לפני ההמראה.\n\nמוכנות קלינית היא חלק מכל תוכנית משימה."
    },
    {
      theme: "crew",
      title: "The medical team on board",
      titleHe: "הצוות הרפואי במטוס",
      body:
        "Flights are staffed according to clinical need — typically flight physicians and/or critical care paramedics experienced in aviation medicine and international transfers.\n\nYour family receives clear updates from coordination through arrival.",
      bodyHe:
        "הטיסות מאוישות לפי הצורך הקליני — בדרך כלל רופאי טיסה ו/או פרמדיקים לטיפול נמרץ עם ניסיון ברפואת תעופה והעברות בינלאומיות.\n\nהמשפחה מקבלת עדכונים ברורים מהתיאום ועד ההגעה."
    },
    {
      theme: "routes",
      title: "Israel ↔ USA medical flights",
      titleHe: "טיסות רפואיות ישראל ↔ ארה״ב",
      body:
        "We regularly coordinate medical flights between Israel and major U.S. gateways including New York, Miami, Fort Lauderdale, Boston, Los Angeles, and San Francisco.\n\nPrivate jet ICU transfer or commercial medical escort — based on medical assessment.",
      bodyHe:
        "אנחנו מתאמים באופן שוטף טיסות רפואיות בין ישראל לשערי כניסה מרכזיים בארה״ב כולל ניו יורק, מיאמי, פורט לודרדייל, בוסטון, לוס אנג׳לס וסן פרנסיסקו.\n\nהעברת ICU במטוס פרטי או ליווי רפואי מסחרי — לפי הערכה רפואית."
    },
    {
      theme: "routes",
      title: "Israel ↔ Europe medical repatriation",
      titleHe: "החזרה רפואית ישראל ↔ אירופה",
      body:
        "From London, Paris, Berlin, Zurich, Rome, Athens, Barcelona, and many other cities — we arrange emergency and planned medical repatriation to Israel, and transfers from Israel to Europe.",
      bodyHe:
        "מלונדון, פריז, ברלין, ציריך, רומא, אתונה, ברצלונה וערים רבות נוספות — אנחנו מתאמים החזרה רפואית דחופה ומתוכננת לישראל, וגם העברות מישראל לאירופה."
    },
    {
      theme: "emergency",
      title: "Holiday emergency abroad?",
      titleHe: "חירום רפואי בחופשה בחו״ל?",
      body:
        "If a family member becomes seriously ill or injured while traveling, international medical repatriation can bring them home under continuous medical care.\n\nIsrael Air Ambulance is available 24/7 for private families needing urgent coordination.",
      bodyHe:
        "אם בן משפחה חלה או נפצע קשה בזמן נסיעה, החזרה רפואית בינלאומית יכולה להביא אותו הביתה תחת טיפול רפואי רציף.\n\nישראל אייר אמבולנס זמינה 24/7 למשפחות פרטיות שזקוקות לתיאום דחוף."
    },
    {
      theme: "trust",
      title: "Bedside to bedside — what it means",
      titleHe: "ממיטה למיטה — מה זה אומר",
      body:
        "Bed-to-bed (bedside-to-bedside) means we coordinate the full continuum: origin hospital/home pickup, ground ambulance to airport, medical flight, and transfer to the receiving hospital bed — with clinical responsibility across the journey.",
      bodyHe:
        "ממיטה למיטה פירושו שאנחנו מתאמים את כל הרצף: איסוף מבית החולים/הבית במקור, אמבולנס קרקעי לנמל התעופה, טיסה רפואית, והעברה למיטת בית החולים המקבל — עם אחריות קלינית לאורך כל הדרך."
    },
    {
      theme: "repatriation",
      title: "Medical repatriation explained",
      titleHe: "החזרה רפואית — הסבר",
      body:
        "Medical repatriation is the process of returning a patient to their home country for continued treatment or recovery — with the right level of in-flight medical care.\n\nWe specialize in repatriation TO Israel and FROM Israel for private clients.",
      bodyHe:
        "החזרה רפואית היא תהליך החזרת מטופל למדינת המוצא להמשך טיפול או החלמה — עם רמת הטיפול הרפואי המתאימה בטיסה.\n\nאנחנו מתמחים בהחזרה לישראל ומישראל עבור לקוחות פרטיים."
    },
    {
      theme: "safety",
      title: "Patient safety checklist before departure",
      titleHe: "רשימת בטיחות מטופל לפני המראה",
      body:
        "Before every flight: clinical records review, fit-to-fly assessment, equipment planning, receiving hospital confirmation, ground logistics, and family briefing.\n\nPreparation protects patients — especially in ICU-level transfers.",
      bodyHe:
        "לפני כל טיסה: סקירת רשומות קליניות, הערכת כשירות לטיסה, תכנון ציוד, אישור בית חולים מקבל, לוגיסטיקה קרקעית ותדרוך למשפחה.\n\nהכנה מגנה על מטופלים — במיוחד בהעברות ברמת ICU."
    },
    {
      theme: "behind_scenes",
      title: "Behind the scenes of a medical flight",
      titleHe: "מאחורי הקלעים של טיסה רפואית",
      body:
        "While families focus on their loved one, our coordination team manages aircraft/escort options, permits, medical clearances, ground ambulances, and hospital handoffs — often across multiple time zones.",
      bodyHe:
        "בזמן שהמשפחה מתמקדת ביקירם, צוות התיאום שלנו מנהל אפשרויות מטוס/ליווי, אישורים, אישורים רפואיים, אמבולנסים קרקעיים ומסירות לבתי חולים — לעיתים על פני כמה אזורי זמן."
    },
    {
      theme: "travel_medicine",
      title: "Travel medicine & international transfer",
      titleHe: "רפואת נסיעות והעברה בינלאומית",
      body:
        "International patient transfer sits at the intersection of clinical care, aviation logistics, and travel medicine. The goal is continuity of care — not just transportation.",
      bodyHe:
        "העברת מטופל בינלאומית נמצאת בצומת של טיפול קליני, לוגיסטיקת תעופה ורפואת נסיעות. המטרה היא רציפות טיפול — לא רק הסעה."
    },
    {
      theme: "greece",
      title: "Medical flight from Greece to Israel",
      titleHe: "טיסה רפואית מיוון לישראל",
      body:
        "Popular destinations like Athens, Thessaloniki, Rhodes, Heraklion, Santorini, and Mykonos occasionally require urgent medical repatriation.\n\nWe arrange air ambulance or medical escort flights from Greece to Israel for private families.",
      bodyHe:
        "יעדים פופולריים כמו אתונה, סלוניקי, רודוס, הרקליון, סנטוריני ומיקונוס דורשים לעיתים החזרה רפואית דחופה.\n\nאנחנו מתאמים טיסות אמבולנס אווירי או ליווי רפואי מיוון לישראל עבור משפחות פרטיות."
    },
    {
      theme: "cyprus",
      title: "Cyprus ↔ Israel patient transfer",
      titleHe: "העברת מטופל קפריסין ↔ ישראל",
      body:
        "Larnaca and Paphos corridors are frequently used for medical transfers between Cyprus and Israel. Fast response and clear bedside-to-bedside planning make a critical difference.",
      bodyHe:
        "מסדרונות לרנקה ופאפוס משמשים לעיתים קרובות להעברות רפואיות בין קפריסין לישראל. מענה מהיר ותכנון ברור ממיטה למיטה עושים את ההבדל."
    },
    {
      theme: "uae",
      title: "Dubai ↔ Israel medical transport",
      titleHe: "העברה רפואית דובאי ↔ ישראל",
      body:
        "For patients requiring transfer between Dubai/UAE and Israel, we coordinate private air ambulance or commercial medical escort options based on clinical needs and urgency.",
      bodyHe:
        "עבור מטופלים הזקוקים להעברה בין דובאי/איחוד האמירויות לישראל, אנחנו מתאמים אמבולנס אווירי פרטי או ליווי רפואי מסחרי לפי הצורך הקליני והדחיפות."
    }
  ];

  const citiesSpotlight = [
    { en: "New York", he: "ניו יורק" },
    { en: "Miami", he: "מיאמי" },
    { en: "London", he: "לונדון" },
    { en: "Paris", he: "פריז" },
    { en: "Berlin", he: "ברלין" },
    { en: "Zurich", he: "ציריך" },
    { en: "Rome", he: "רומא" },
    { en: "Athens", he: "אתונה" },
    { en: "Barcelona", he: "ברצלונה" },
    { en: "Amsterdam", he: "אמסטרדם" },
    { en: "Dubai", he: "דובאי" },
    { en: "Bangkok", he: "בנגקוק" },
    { en: "Toronto", he: "טורונטו" },
    { en: "Vienna", he: "וינה" },
    { en: "Lisbon", he: "ליסבון" }
  ];

  const hooks = [
    {
      en: "When every hour matters, clear medical-flight options make the difference.",
      he: "כשכל שעה חשובה — אפשרויות טיסה רפואיות ברורות עושות את ההבדל."
    },
    {
      en: "Families don’t need jargon. They need a safe plan TO Israel or FROM Israel — fast.",
      he: "משפחות לא צריכות מונחים מסובכים. הן צריכות תוכנית בטוחה לישראל או מישראל — במהירות."
    },
    {
      en: "Private coordination. Clinical judgment. Bedside-to-bedside logistics.",
      he: "תיאום פרטי. שיקול דעת קליני. לוגיסטיקה ממיטה למיטה."
    },
    {
      en: "Not every case needs a full ICU aircraft — but every case needs the right level of care.",
      he: "לא כל מקרה דורש מטוס ICU מלא — אבל כל מקרה דורש את רמת הטיפול הנכונה."
    },
    {
      en: "From first call to hospital handoff: one coordination line for private families.",
      he: "מהשיחה הראשונה עד מסירה לבית החולים: קו תיאום אחד למשפחות פרטיות."
    },
    {
      en: "International transfer is clinical work first — aviation is how we deliver it.",
      he: "העברה בינלאומית היא קודם כול עבודה קלינית — התעופה היא הדרך לבצע אותה."
    },
    {
      en: "Quiet professionalism for moments that feel anything but quiet.",
      he: "מקצועיות שקטה לרגעים שהם בכלל לא שקטים."
    },
    {
      en: "Ask us what is clinically appropriate — air ambulance, stretcher flight, or medical escort.",
      he: "שאלו אותנו מה מתאים קלינית — אמבולנס אווירי, טיסת אלונקה או ליווי רפואי."
    }
  ];

  const bridgesEn = [
    "Israel Air Ambulance supports private families with international medical flights worldwide.",
    "We focus only on private international air ambulance and medical escort — TO Israel and FROM Israel.",
    "Our team helps you compare safe options and move quickly when time is critical.",
    "Clear updates for families. Continuous care planning for the patient.",
    "Self-pay families receive direct, practical guidance — no runaround."
  ];
  const bridgesHe = [
    "ישראל אייר אמבולנס מלווה משפחות פרטיות בטיסות רפואיות בינלאומיות ברחבי העולם.",
    "אנחנו מתמקדים רק באמבולנס אווירי בינלאומי פרטי וליווי רפואי — לישראל ומישראל.",
    "הצוות שלנו עוזר להשוות אפשרויות בטוחות ולפעול מהר כשהזמן קריטי.",
    "עדכונים ברורים למשפחה. תכנון טיפול רציף למטופל.",
    "משפחות בתשלום עצמי מקבלות הכוונה ישירה ומעשית — בלי סבבים מיותרים."
  ];

  const cityExtras = {
    "New York": {
      en: "JFK / Newark corridors are among the most requested U.S. medical-flight pathways to Israel.",
      he: "מסדרונות JFK / ניוארק הם מבין הנתיבים המבוקשים ביותר בארה״ב לטיסות רפואיות לישראל."
    },
    Miami: {
      en: "Miami and South Florida are frequent departure points for urgent repatriation to Israel.",
      he: "מיאמי ודרום פלורידה הן נקודות יציאה נפוצות להחזרה דחופה לישראל."
    },
    London: {
      en: "From London-area hospitals, we arrange ICU jet or escorted commercial options based on fit-to-fly.",
      he: "מבתי חולים באזור לונדון אנחנו מתאמים מטוס ICU או ליווי בטיסה מסחרית לפי כשירות לטיסה."
    },
    Paris: {
      en: "Paris missions often combine European hospital discharge timing with Israel receiving-hospital beds.",
      he: "משימות מפריז משלבות לרוב תזמון שחרור מבית חולים באירופה עם מיטה מקבלת בישראל."
    },
    Dubai: {
      en: "Dubai ↔ Israel transfers require precise permits, timing, and clinical configuration.",
      he: "העברות דובאי ↔ ישראל דורשות אישורים, תזמון והגדרה קלינית מדויקים."
    },
    Athens: {
      en: "Island and mainland Greece cases need fast assessment — commercial escort is not always enough.",
      he: "מקרים ביוון (איים ויבשה) דורשים הערכה מהירה — ליווי מסחרי לא תמיד מספיק."
    }
  };

  let day = 1;
  for (let week = 0; week < 13; week++) {
    for (let d = 0; d < 7; d++) {
      const themeObj = themes[(week * 7 + d) % themes.length];
      const city = citiesSpotlight[(week * 7 + d) % citiesSpotlight.length];
      const cityTag = `#${city.en.replace(/\s+/g, "")}`;
      const tags = pickHashtags(hashtags, week * 10 + d + 20, [
        cityTag,
        "#Israel",
        "#TelAviv",
        "#ישראל"
      ]);

      let title = themeObj.title;
      let titleHe = themeObj.titleHe;
      let bodyEn = themeObj.body;
      let bodyHe = themeObj.bodyHe;

      // City spotlight variant every 3rd day
      if (d % 3 === 0) {
        title = `Medical flight: ${city.en} ↔ Israel`;
        titleHe = `טיסה רפואית: ${city.he} ↔ ישראל`;
        bodyEn =
          `Families arrange private medical flights between ${city.en} and Israel for emergency repatriation, ICU transfer, or escorted commercial travel.\n\n` +
          `Israel Air Ambulance coordinates bedside-to-bedside logistics 24/7.`;
        bodyHe =
          `משפחות מתאמות טיסות רפואיות פרטיות בין ${city.he} לישראל לצורך החזרה רפואית דחופה, העברת ICU, או ליווי בטיסה מסחרית.\n\n` +
          `ישראל אייר אמבולנס מתאמת לוגיסטיקה ממיטה למיטה 24/7.`;
        const extra = cityExtras[city.en];
        if (extra) {
          bodyEn += `\n\n${extra.en}`;
          bodyHe += `\n\n${extra.he}`;
        }
      }

      const hookIdx = (week * 7 + d) % hooks.length;
      const bridgeIdx = (week * 3 + d) % bridgesEn.length;
      const hookEn = hooks[hookIdx].en;
      const hookHe = hooks[hookIdx].he;
      const bridgeEn = bridgesEn[bridgeIdx];
      const bridgeHe = bridgesHe[bridgeIdx];

      const enCore = `${title}\n\n${hookEn}\n\n${bodyEn}\n\n${bridgeEn}`;
      const heCore = `${titleHe}\n\n${hookHe}\n\n${bodyHe}\n\n${bridgeHe}`;

      const finalIg = bilingual(
        `${enCore}\n\n${ctaEn}`,
        `${heCore}\n\n${ctaHe}`
      ) + `\n\n${formatIgHashtags(tags)}`;

      const finalFb = bilingual(
        `${enCore}\n\n${ctaEn}`,
        `${heCore}\n\n${ctaHe}`
      );

      const finalLi = bilingual(
        `${enCore}\n\nService focus: Air Ambulance TO Israel · Air Ambulance FROM Israel · Medical Repatriation · ICU Transport · Medical Escort.\n\nCall: ${phone}\nWhatsApp: ${waLocal} (${waIntl})\n${web}`,
        `${heCore}\n\nמיקוד שירות: אמבולנס אווירי לישראל · אמבולנס אווירי מישראל · החזרה רפואית · העברת ICU · ליווי רפואי.\n\nשיחה: ${phone}\nוואטסאפ: ${waLocal}\n${web}`
      );

      posts.push({
        id: `day-${String(day).padStart(3, "0")}`,
        platforms: ["instagram", "facebook", "linkedin", "threads"],
        type: "feed",
        day,
        week: week + 1,
        theme: themeObj.theme,
        title,
        titleHe,
        angle: hooks[hookIdx].en.slice(0, 60),
        copy: {
          instagram: finalIg,
          facebook: finalFb,
          linkedin: finalLi,
          threads: bilingual(
            `${title}\n\n${hookEn}\n\n${bodyEn.split("\n\n")[0]}\n\n24/7 · Call ${phone}\nWhatsApp ${waLocal}`,
            `${titleHe}\n\n${hookHe}\n\n${bodyHe.split("\n\n")[0]}\n\n24/7 · שיחה ${phone}\nוואטסאפ ${waLocal}`
          )
        }
      });
      day += 1;
    }
  }

  return { posts, hashtags };
}

function writeOutputs() {
  fs.mkdirSync(ADS, { recursive: true });
  fs.mkdirSync(SOCIAL, { recursive: true });
  fs.mkdirSync(DATA, { recursive: true });

  const keywords = generateKeywords();
  fs.writeFileSync(
    path.join(ADS, "keywords-database.csv"),
    toCsv(keywords, [
      "campaign_id",
      "campaign_name",
      "ad_group",
      "keyword",
      "match_type",
      "theme",
      "geo_level"
    ])
  );

  // Compact unique keyword list
  const uniqueKw = unique(keywords.map((k) => k.keyword)).sort();
  fs.writeFileSync(
    path.join(ADS, "keywords-unique.txt"),
    uniqueKw.join("\n") + "\n"
  );

  const negRows = NEGATIVES.map((n) => ({
    negative_keyword: n,
    match_type: "Phrase",
    level: "Account",
    category: "waste_reduction"
  }));
  fs.writeFileSync(
    path.join(ADS, "negative-keywords.csv"),
    toCsv(negRows, ["negative_keyword", "match_type", "level", "category"])
  );

  // Country & city keyword database
  const matrix = [];
  for (const country of geo.priorityCountries) {
    matrix.push({
      level: "country",
      name: country.name,
      code: country.code,
      priority: country.priority,
      sample_keywords: [
        `air ambulance from ${country.name.toLowerCase()} to israel`,
        `medical flight ${country.name.toLowerCase()} israel`,
        `medical repatriation ${country.name.toLowerCase()}`
      ].join(" | ")
    });
  }
  for (const city of geo.cities) {
    matrix.push({
      level: "city",
      name: city.name,
      code: city.country,
      priority: city.country === "IL" ? 1 : 2,
      sample_keywords: [
        `air ambulance ${city.name.toLowerCase()} to israel`,
        `medical flight ${city.name.toLowerCase()} israel`,
        `patient transfer ${city.name.toLowerCase()} israel`
      ].join(" | ")
    });
  }
  fs.writeFileSync(
    path.join(DATA, "country-city-keyword-database.csv"),
    toCsv(matrix, ["level", "name", "code", "priority", "sample_keywords"])
  );

  const { posts, hashtags } = buildPosts();
  fs.writeFileSync(path.join(DATA, "hashtags.json"), JSON.stringify(hashtags, null, 2));
  fs.writeFileSync(path.join(DATA, "posts.json"), JSON.stringify({ generatedAt: new Date().toISOString(), brand: geo.brand, posts }, null, 2));

  // Hashtag markdown library
  const htMd = [
    "# Global Hashtag Database — Israel Air Ambulance",
    "",
    "## Always include (English)",
    hashtags.always_include.join(" "),
    "",
    "## Always include (Hebrew) — Instagram",
    (hashtags.he_always || []).join(" "),
    "",
    "## Service (rotate)",
    hashtags.service_rotate.join(" "),
    "",
    "## Hebrew rotate",
    (hashtags.he_rotate || []).join(" "),
    "",
    "## Countries (rotate)",
    hashtags.country_rotate.join(" "),
    "",
    "## Cities (rotate)",
    hashtags.city_rotate.join(" "),
    "",
    "## Routes (rotate)",
    hashtags.route_rotate.join(" "),
    "",
    "## Rotation rules",
    "```json",
    JSON.stringify(hashtags.rotation_rules, null, 2),
    "```",
    "",
    "**Rule:** Every Instagram caption must end with an English hashtag line + a Hebrew hashtag line. Do not publish IG without hashtags.",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(SOCIAL, "hashtag-library.md"), htMd);

  console.log(`Keywords rows: ${keywords.length}`);
  console.log(`Unique keywords: ${uniqueKw.length}`);
  console.log(`Negatives: ${NEGATIVES.length}`);
  console.log(`Posts: ${posts.length}`);
  console.log(`Hashtag groups written`);
}

writeOutputs();
