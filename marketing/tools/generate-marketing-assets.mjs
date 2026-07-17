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
  { id: "bed-to-bed", name: "Bed to Bed Medical Transport", theme: "bed_to_bed" }
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
  ]
};

const MATCH_TYPES = ["Exact", "Phrase"];

const NEGATIVES = [
  // Jobs / careers
  "job", "jobs", "career", "careers", "hiring", "salary", "salaries", "wage", "wages",
  "vacancy", "vacancies", "recruitment", "resume", "cv", "indeed", "glassdoor",
  // Training / education
  "course", "courses", "training", "school", "schools", "college", "university",
  "degree", "certificate", "certification", "emt school", "paramedic school",
  "paramedic course", "emt course", "flight nurse course", "how to become",
  "volunteer", "volunteering", "internship", "intern",
  // Free / DIY
  "free", "cheap", "diy", "template", "pdf", "download", "wiki", "wikipedia",
  // Insurance / claims (B2B noise unless private referral)
  "insurance claim", "insurance claims", "claim form", "reimbursement form",
  "medicare", "medicaid", "nhs claim",
  // Local / ground ambulance noise
  "911", "999", "112", "mda", "magen david adom", "local ambulance",
  "ambulance driver", "ambulance drivers", "ground ambulance near me",
  "call ambulance", "ambulance service near me", "municipal ambulance",
  "government ambulance", "public ambulance", "regular ambulance",
  "fire department ambulance", "ems job", "ems jobs",
  // Domestic Israel ground (not this product line for paid search)
  "private ambulance tel aviv price", "ambulance for hospital discharge israel only",
  // Medical tourism (explicitly excluded from ads)
  "medical tourism", "medical tourist", "plastic surgery flight",
  "cosmetic surgery travel", "dental tourism", "ivf tourism",
  // Unrelated
  "toy", "toys", "lego", "model airplane", "flight simulator",
  "video game", "movie", "netflix", "gif", "meme",
  "animal ambulance", "pet ambulance", "veterinary air ambulance",
  "organ transplant waiting list", "blood donation",
  // Competitor junk / research
  "reddit", "quora", "forum", "news", "stock price", "ipo",
  // Military / government bulk
  "nato", "unHCR", "ngo tender", "government tender", "rfp",
  // Non-intent
  "definition", "what is air ambulance cost calculator only",
  "statistics", "history of", "documentary"
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
    "#PatientTransfer",
    "#EmergencyMedicalFlight",
    "#MedicalEscort",
    "#WorldwideMedicalTransport",
    "#InternationalPatientTransport"
  ];

  const service = [
    "#PrivateAirAmbulance",
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
    "#AirAmbulanceUSA"
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

  return {
    always_include: core,
    service_rotate: service,
    country_rotate: unique(countries),
    city_rotate: unique(cities),
    route_rotate: route,
    rotation_rules: {
      per_post_total: 18,
      always: 11,
      service_pick: 3,
      geo_pick: 3,
      route_pick: 1,
      note: "Rotate service/geo/route tags; never reuse the same non-core set within 7 days."
    }
  };
}

function pickHashtags(hashtags, seed, geoTags = []) {
  const svc = hashtags.service_rotate;
  const cities = hashtags.city_rotate;
  const routes = hashtags.route_rotate;
  const s = seed % 1000;
  const servicePick = [svc[s % svc.length], svc[(s + 3) % svc.length], svc[(s + 7) % svc.length]];
  const cityPick = geoTags.length
    ? geoTags.slice(0, 3)
    : [cities[s % cities.length], cities[(s + 11) % cities.length], cities[(s + 19) % cities.length]];
  const routePick = [routes[s % routes.length]];
  return unique([...hashtags.always_include, ...servicePick, ...cityPick, ...routePick]);
}

function buildPosts() {
  const hashtags = generateHashtags();
  const posts = [];

  const carouselSets = [
    {
      id: "carousel-01-mission",
      title: "Mission Overview — Worldwide Air Ambulance",
      slides: [
        "ISRAEL AIR AMBULANCE\nInternational medical flights 24/7",
        "Private air ambulance\nTO Israel & FROM Israel",
        "Critical care teams\nICU-capable medical aircraft",
        "Bedside to bedside\nHospital → Aircraft → Hospital",
        "Worldwide coordination\nUSA · Europe · Middle East · Asia",
        "Need a medical flight?\nCall / WhatsApp 24/7"
      ]
    },
    {
      id: "carousel-02-aircraft",
      title: "Aircraft & ICU Capability",
      slides: [
        "Configured medical aircraft\nfor intensive care transport",
        "Ventilation · Monitoring · Infusion\nICU standards in the air",
        "Flight physicians & critical care paramedics",
        "Stretcher & private jet options\nmatched to patient condition",
        "Commercial medical escort\nwhen clinically appropriate",
        "Request a clinical assessment\nIsrael Air Ambulance"
      ]
    },
    {
      id: "carousel-03-usa",
      title: "Israel ↔ USA Routes",
      slides: [
        "Israel ↔ USA medical flights",
        "New York · Miami · Boston\nLos Angeles · San Francisco",
        "ICU air ambulance for complex cases",
        "Medical escort on commercial flights\nwhen suitable",
        "Families paying privately\nfast, clear coordination",
        "24/7 dispatch\nWhatsApp & phone"
      ]
    },
    {
      id: "carousel-04-europe",
      title: "Israel ↔ Europe Routes",
      slides: [
        "Israel ↔ Europe air ambulance",
        "London · Paris · Berlin · Zurich\nRome · Athens · Barcelona",
        "Holiday medical emergencies\nrepatriation to Israel",
        "Bed-to-bed ground + air logistics",
        "Experienced international medical teams",
        "Call now for emergency transfer"
      ]
    },
    {
      id: "carousel-05-safety",
      title: "Patient Safety & Trust",
      slides: [
        "Patient safety first\non every medical flight",
        "Clinical screening before departure",
        "Continuous monitoring in flight",
        "Hospital handoff at destination",
        "Clear communication with families",
        "Israel Air Ambulance — 24/7"
      ]
    }
  ];

  for (const [i, set] of carouselSets.entries()) {
    const tags = pickHashtags(hashtags, i + 1, ["#TelAviv", "#Israel"]);
    const ig = [
      set.title,
      "",
      ...set.slides.map((s, idx) => `${idx + 1}/${set.slides.length}\n${s}`),
      "",
      "Private international air ambulance TO Israel and FROM Israel.",
      "ICU-capable · Bedside to bedside · Worldwide",
      "",
      "📞 Call / WhatsApp 24/7",
      geo.brand.phoneIntl,
      geo.brand.website,
      "",
      tags.join(" ")
    ].join("\n");

    posts.push({
      id: set.id,
      platforms: ["instagram"],
      type: "carousel",
      day: (i + 1) * 5,
      theme: "carousel",
      title: set.title,
      slides: set.slides,
      copy: {
        instagram: ig,
        facebook: ig.replace(/#\w+/g, "").replace(/\n{3,}/g, "\n\n").trim() +
          `\n\nNeed an emergency medical flight to or from Israel?\nCall ${geo.brand.phoneIntl} or message us on WhatsApp — available 24/7.\n${geo.brand.website}`,
        linkedin:
          `${set.title}\n\nIsrael Air Ambulance provides private international air ambulance and medical repatriation services to and from Israel.\n\n` +
          set.slides.map((s) => `• ${s.replace(/\n/g, " — ")}`).join("\n") +
          `\n\nAvailable 24/7 for families arranging private medical flights.\n${geo.brand.phoneIntl} | ${geo.brand.website}`
      }
    });
  }

  // 90 educational / trust / route posts (approx 1/day for calendar)
  const themes = [
    {
      theme: "educational",
      title: "When is an air ambulance needed?",
      body:
        "An air ambulance is considered when a patient needs continuous medical care during transfer — for example ICU support, oxygen/ventilation, or when commercial travel is not clinically appropriate.\n\nIsrael Air Ambulance coordinates private medical flights TO Israel and FROM Israel, including bedside-to-bedside logistics."
    },
    {
      theme: "educational",
      title: "Air ambulance vs medical escort",
      body:
        "Private air ambulance: dedicated aircraft configured as a flying ICU for critical patients.\n\nCommercial medical escort: doctor/paramedic accompany the patient on a scheduled flight when clinically suitable — often a more cost-effective option.\n\nWe assess each case and recommend the safest appropriate solution."
    },
    {
      theme: "equipment",
      title: "ICU equipment in the air",
      body:
        "Critical care transports may require ventilators, multiparameter monitors, infusion pumps, suction, advanced airway equipment, and medications — configured to the patient’s condition before takeoff.\n\nClinical readiness is part of every mission plan."
    },
    {
      theme: "crew",
      title: "The medical team on board",
      body:
        "Flights are staffed according to clinical need — typically flight physicians and/or critical care paramedics experienced in aviation medicine and international transfers.\n\nYour family receives clear updates from coordination through arrival."
    },
    {
      theme: "routes",
      title: "Israel ↔ USA medical flights",
      body:
        "We regularly coordinate medical flights between Israel and major U.S. gateways including New York, Miami, Fort Lauderdale, Boston, Los Angeles, and San Francisco.\n\nPrivate jet ICU transfer or commercial medical escort — based on medical assessment."
    },
    {
      theme: "routes",
      title: "Israel ↔ Europe medical repatriation",
      body:
        "From London, Paris, Berlin, Zurich, Rome, Athens, Barcelona, and many other cities — we arrange emergency and planned medical repatriation to Israel, and transfers from Israel to Europe."
    },
    {
      theme: "emergency",
      title: "Holiday emergency abroad?",
      body:
        "If a family member becomes seriously ill or injured while traveling, international medical repatriation can bring them home under continuous medical care.\n\nIsrael Air Ambulance is available 24/7 for private families needing urgent coordination."
    },
    {
      theme: "trust",
      title: "Bedside to bedside — what it means",
      body:
        "Bed-to-bed (bedside-to-bedside) means we coordinate the full continuum: origin hospital/home pickup, ground ambulance to airport, medical flight, and transfer to the receiving hospital bed — with clinical responsibility across the journey."
    },
    {
      theme: "repatriation",
      title: "Medical repatriation explained",
      body:
        "Medical repatriation is the process of returning a patient to their home country for continued treatment or recovery — with the right level of in-flight medical care.\n\nWe specialize in repatriation TO Israel and FROM Israel for private clients."
    },
    {
      theme: "safety",
      title: "Patient safety checklist before departure",
      body:
        "Before every flight: clinical records review, fit-to-fly assessment, equipment planning, receiving hospital confirmation, ground logistics, and family briefing.\n\nPreparation protects patients — especially in ICU-level transfers."
    },
    {
      theme: "behind_scenes",
      title: "Behind the scenes of a medical flight",
      body:
        "While families focus on their loved one, our coordination team manages aircraft/escort options, permits, medical clearances, ground ambulances, and hospital handoffs — often across multiple time zones."
    },
    {
      theme: "travel_medicine",
      title: "Travel medicine & international transfer",
      body:
        "International patient transfer sits at the intersection of clinical care, aviation logistics, and travel medicine. The goal is continuity of care — not just transportation."
    },
    {
      theme: "greece",
      title: "Medical flight from Greece to Israel",
      body:
        "Popular destinations like Athens, Thessaloniki, Rhodes, Heraklion, Santorini, and Mykonos occasionally require urgent medical repatriation.\n\nWe arrange air ambulance or medical escort flights from Greece to Israel for private families."
    },
    {
      theme: "cyprus",
      title: "Cyprus ↔ Israel patient transfer",
      body:
        "Larnaca and Paphos corridors are frequently used for medical transfers between Cyprus and Israel. Fast response and clear bedside-to-bedside planning make a critical difference."
    },
    {
      theme: "uae",
      title: "Dubai ↔ Israel medical transport",
      body:
        "For patients requiring transfer between Dubai/UAE and Israel, we coordinate private air ambulance or commercial medical escort options based on clinical needs and urgency."
    }
  ];

  const citiesSpotlight = [
    "New York", "Miami", "London", "Paris", "Berlin", "Zurich", "Rome", "Athens",
    "Barcelona", "Amsterdam", "Dubai", "Bangkok", "Toronto", "Vienna", "Lisbon"
  ];

  let day = 1;
  for (let week = 0; week < 13; week++) {
    for (let d = 0; d < 7; d++) {
      const themeObj = themes[(week * 7 + d) % themes.length];
      const city = citiesSpotlight[(week * 7 + d) % citiesSpotlight.length];
      const cityTag = `#${city.replace(/\s+/g, "")}`;
      const tags = pickHashtags(hashtags, week * 10 + d + 20, [cityTag, "#Israel", "#TelAviv"]);

      const cta =
        `\n\nNeed a private air ambulance or medical escort TO Israel or FROM Israel?\n` +
        `📞 ${geo.brand.phoneIntl} (24/7)\n💬 WhatsApp available\n🌐 ${geo.brand.website}`;

      const ig = `${themeObj.title}\n\n${themeObj.body}${cta}\n\n${tags.join(" ")}`;
      const fb =
        `${themeObj.title}\n\n${themeObj.body}\n\n` +
        `Israel Air Ambulance supports private families with international medical flights, ICU air ambulance, stretcher flights, and commercial medical escort — worldwide.\n` +
        cta;
      const li =
        `${themeObj.title}\n\n${themeObj.body}\n\n` +
        `Service focus: Air Ambulance TO Israel · Air Ambulance FROM Israel · Medical Repatriation · ICU Transport · Medical Escort.\n\n` +
        `Contact: ${geo.brand.phoneIntl} | ${geo.brand.website}`;

      // City spotlight variant every 3rd day
      let finalIg = ig;
      let finalFb = fb;
      let finalLi = li;
      let title = themeObj.title;
      if (d % 3 === 0) {
        title = `Medical flight: ${city} ↔ Israel`;
        const cityBody =
          `Families arrange private medical flights between ${city} and Israel for emergency repatriation, ICU transfer, or escorted commercial travel.\n\n` +
          `Israel Air Ambulance coordinates bedside-to-bedside logistics 24/7.`;
        finalIg = `${title}\n\n${cityBody}${cta}\n\n${tags.join(" ")}`;
        finalFb = `${title}\n\n${cityBody}\n\nProfessional international air ambulance coordination for private clients.${cta}`;
        finalLi = `${title}\n\n${cityBody}\n\nContact our 24/7 coordination team: ${geo.brand.phoneIntl}`;
      }

      posts.push({
        id: `day-${String(day).padStart(3, "0")}`,
        platforms: ["instagram", "facebook", "linkedin", "threads"],
        type: "feed",
        day,
        week: week + 1,
        theme: themeObj.theme,
        title,
        copy: {
          instagram: finalIg,
          facebook: finalFb,
          linkedin: finalLi,
          threads:
            finalIg.split("\n\n")[0] +
            "\n\n" +
            finalIg.split("\n\n")[1] +
            `\n\n24/7 · ${geo.brand.phoneIntl}`
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
    "## Always include",
    hashtags.always_include.join(" "),
    "",
    "## Service (rotate)",
    hashtags.service_rotate.join(" "),
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
