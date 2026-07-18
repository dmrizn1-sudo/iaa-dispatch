#!/usr/bin/env node
/**
 * Build bilingual ground-ambulance post library for Israel Air & Ambulance
 * (event medical security, prime transfers, North Israel focus).
 *
 * Writes: marketing/data/ground-posts.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureInstagramCaption } from "./ig-hashtags.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "ground-posts.json");

const brand = {
  name: "Israel Air & Ambulance",
  phoneIntl: "+972-79-670-9999",
  whatsappLocal: "053-232-1101",
  website: "https://ambulancenter.com"
};

const places = [
  { city: "Poriya", cityHe: "פוריה", region: "North", regionHe: "הצפון" },
  { city: "Safed", cityHe: "צפת", region: "North", regionHe: "הצפון" },
  { city: "Tiberias", cityHe: "טבריה", region: "North", regionHe: "הצפון" },
  { city: "Haifa", cityHe: "חיפה", region: "North", regionHe: "הצפון" },
  { city: "Nahariya", cityHe: "נהריה", region: "North", regionHe: "הצפון" },
  { city: "Afula", cityHe: "עפולה", region: "North", regionHe: "הצפון" },
  { city: "Kiryat Shmona", cityHe: "קריית שמונה", region: "North", regionHe: "הצפון" },
  { city: "Nazareth", cityHe: "נצרת", region: "North", regionHe: "הצפון" },
  { city: "Tel Aviv", cityHe: "תל אביב", region: "Center", regionHe: "המרכז" },
  { city: "Jerusalem", cityHe: "ירושלים", region: "Center", regionHe: "המרכז" },
  { city: "Rambam", cityHe: "רמב״ם", region: "North", regionHe: "הצפון" },
  { city: "Ziv Hospital", cityHe: "בית חולים זיו", region: "North", regionHe: "הצפון" }
];

const angles = [
  {
    id: "event-security",
    theme: "event",
    titleEn: "Event medical security — paramedic standby",
    titleHe: "אבטחה רפואית לאירועים — כוננות פראמדיק",
    bodyEn:
      "Professional paramedic services for medical security at events, productions, and gatherings.\nStandby coverage with fully equipped ambulances — so your event stays safe.",
    bodyHe:
      "שירותי פראמדיק לאבטחות רפואיות לאירועים, הפקות והתכנסויות.\nכוננות עם אמבולנסים מאובזרים — כדי שהאירוע שלכם יישאר בטוח."
  },
  {
    id: "event-ambulance",
    theme: "event",
    titleEn: "Ambulances for medical event coverage",
    titleHe: "אמבולנסים לאבטחה רפואית באירועים",
    bodyEn:
      "Dedicated ambulances for medical security at events across Israel.\nFast response · clinical readiness · clear coordination with organizers.",
    bodyHe:
      "אמבולנסים ייעודיים לאבטחה רפואית באירועים בכל רחבי הארץ.\nמענה מהיר · מוכנות קלינית · תיאום ברור עם המפיקים."
  },
  {
    id: "prime-transfer",
    theme: "prime",
    titleEn: "Prime ambulances for patient transfers",
    titleHe: "אמבולנסים פריים להעברת חולים",
    bodyEn:
      "Prime-level ambulances for comfortable, professional patient transfers.\nHospital to hospital · home to hospital · North to anywhere in Israel.",
    bodyHe:
      "אמבולנסים ברמת פריים להעברות חולים נוחות ומקצועיות.\nבית חולים לבית חולים · מהבית לבית החולים · מהצפון לכל הארץ."
  },
  {
    id: "new-fleet",
    theme: "fleet",
    titleEn: "New ambulances — top tier in Israel",
    titleHe: "אמבולנסים חדשים — ברמה הגבוהה ביותר בישראל",
    bodyEn:
      "A modern fleet built to the highest clinical standard in Israel.\nClean · advanced · ready for complex transfers 24/7.",
    bodyHe:
      "צי אמבולנסים חדש ומתקדם ברמה הגבוהה ביותר בישראל.\nנקי · מתקדם · מוכן להעברות מורכבות 24/7."
  },
  {
    id: "electric-beds",
    theme: "equipment",
    titleEn: "Electric beds for safer transfers",
    titleHe: "מיטות חשמליות להעברות בטוחות יותר",
    bodyEn:
      "Electric stretchers for smoother loading and patient comfort.\nLess strain · more dignity · better clinical control on every transfer.",
    bodyHe:
      "מיטות חשמליות להעמסה חלקה ונוחות למטופל.\nפחות עומס · יותר כבוד · שליטה קלינית טובה יותר בכל העברה."
  },
  {
    id: "advanced-gear",
    theme: "equipment",
    titleEn: "Advanced medical equipment on board",
    titleHe: "ציוד רפואי מתקדם בכל אמבולנס",
    bodyEn:
      "Monitoring, oxygen, and advanced medical equipment on every mission.\nPrepared for real clinical needs — not just transport.",
    bodyHe:
      "ניטור, חמצן וציוד רפואי מתקדם בכל משימה.\nמוכנים לצרכים קליניים אמיתיים — לא רק להסעה."
  },
  {
    id: "experience-20",
    theme: "crew",
    titleEn: "20+ years as an ICU paramedic",
    titleHe: "מעל 20 שנות ניסיון כפראמדיק טיפול נמרץ",
    bodyEn:
      "Over 20 years of ICU paramedic experience guiding every transfer.\nClinical judgment you can trust when the patient needs more than a ride.",
    bodyHe:
      "מעל 20 שנות ניסיון כפראמדיק טיפול נמרץ מובילים כל העברה.\nשיקול דעת קליני שאפשר לסמוך עליו כשצריך יותר מנסיעה."
  },
  {
    id: "certified-crew",
    theme: "crew",
    titleEn: "Certified medics & ambulance drivers",
    titleHe: "חובשים מוסמכים ונהגי אמבולנס",
    bodyEn:
      "Certified medics and professional ambulance drivers on every transfer.\nTrained teams · calm communication · safe arrival.",
    bodyHe:
      "חובשים מוסמכים ונהגי אמבולנס מקצועיים בכל העברה.\nצוותים מיומנים · תקשורת רגועה · הגעה בטוחה."
  },
  {
    id: "north-focus",
    theme: "north",
    titleEn: "North Israel transfers — Poriya, Safed & beyond",
    titleHe: "העברות מהצפון — פוריה, צפת ומעבר",
    bodyEn:
      "Special focus on transfers from Poriya, Safed (Tzfat), and the North — to hospitals across Israel.\nLocal knowledge · national reach.",
    bodyHe:
      "דגש על העברות מפוריה, צפת והצפון — לכל בתי החולים בארץ.\nהיכרות מקומית · כיסוי ארצי."
  },
  {
    id: "north-to-center",
    theme: "north",
    titleEn: "From the North to every part of Israel",
    titleHe: "מהצפון לכל חלקי הארץ",
    bodyEn:
      "Patient transfers from northern Israel to the Center, Jerusalem, and nationwide.\nCoordinated · monitored · family-informed.",
    bodyHe:
      "העברות חולים מהצפון למרכז, לירושלים ולכל הארץ.\nמתואם · בניטור · עם עדכון למשפחה."
  },
  {
    id: "hospital-transfer",
    theme: "transfer",
    titleEn: "Inter-hospital ambulance transfers",
    titleHe: "העברות אמבולנס בין בתי חולים",
    bodyEn:
      "Smooth inter-hospital transfers with clinical continuity.\nFrom northern hospitals to specialty centers across Israel.",
    bodyHe:
      "העברות חלקות בין בתי חולים עם רצף קליני.\nמבתי חולים בצפון למרכזי מומחיות בכל הארץ."
  },
  {
    id: "home-hospital",
    theme: "transfer",
    titleEn: "Home ↔ hospital ambulance service",
    titleHe: "שירות אמבולנס מהבית לבית החולים",
    bodyEn:
      "Private ambulance transfers between home and hospital — with dignity and care.\nIdeal for planned admissions, discharges, and follow-up care.",
    bodyHe:
      "העברות אמבולנס פרטיות בין הבית לבית החולים — בכבוד ובזהירות.\nמתאים לאשפוז מתוכנן, שחרור ומעקב."
  }
];

function ctaBlock() {
  return [
    `📞 ${brand.phoneIntl} (24/7)`,
    `💬 WhatsApp: ${brand.whatsappLocal}`,
    `🌐 ${brand.website}`
  ].join("\n");
}

function ctaBlockHe() {
  return [
    `📞 ${brand.phoneIntl} (24/7)`,
    `💬 וואטסאפ: ${brand.whatsappLocal}`,
    `🌐 ${brand.website}`
  ].join("\n");
}

function tagsFor(angle, place) {
  const citySlug = place.city.replace(/[^a-zA-Z0-9]+/g, "");
  const en = [
    "#IsraelAirAmbulance",
    "#AmbulanceIsrael",
    "#MedicalTransport",
    "#PatientTransfer",
    "#Paramedic",
    "#EventMedical",
    "#PrimeAmbulance",
    "#NorthernIsrael",
    `#Ambulance${citySlug}`,
    "#Israel"
  ];
  if (angle.theme === "event") en.push("#EventSafety", "#MedicalStandby");
  if (angle.theme === "equipment") en.push("#MedicalEquipment", "#ElectricStretcher");
  if (angle.theme === "north") en.push("#Poriya", "#Safed", "#Galilee");
  if (angle.theme === "crew") en.push("#ICUParamedic", "#CertifiedMedic");

  const he = [
    "#ישראלאייראמבולנס",
    "#אמבולנס",
    "#העברתחולים",
    "#פראמדיק",
    "#אבטחהרפואית",
    "#אמבולנספריים",
    "#הצפון",
    "#פוריה",
    "#צפת",
    `#אמבולנס${place.cityHe.replace(/\s+/g, "")}`,
    "#ישראל"
  ];
  return { en: en.slice(0, 16), he: he.slice(0, 12) };
}

function buildPost(angle, place, index) {
  const title = `${angle.titleEn} · ${place.city}`;
  const titleHe = `${angle.titleHe} · ${place.cityHe}`;
  const seoEn = `Private ambulance & patient transfer — ${place.city} and ${place.region} Israel.`;
  const seoHe = `אמבולנס פרטי והעברת חולים — ${place.cityHe} ו${place.regionHe}.`;

  const en = [
    title,
    "",
    angle.bodyEn,
    "",
    seoEn,
    "",
    "Israel Air & Ambulance — ground ambulance · event medical security · prime transfers.",
    "",
    ctaBlock()
  ].join("\n");

  const he = [
    titleHe,
    "",
    angle.bodyHe,
    "",
    seoHe,
    "",
    "ישראל אייר אנד אמבולנס — אמבולנס קרקעי · אבטחה רפואית לאירועים · העברות פריים.",
    "",
    ctaBlockHe()
  ].join("\n");

  const { en: enTags, he: heTags } = tagsFor(angle, place);
  const igRaw = `${en}\n\n────────\n\n${he}\n\n${enTags.join(" ")}\n${heTags.join(" ")}`;
  const fb = `${en}\n\n────────\n\n${he}`;

  return {
    id: `ground-${String(index + 1).padStart(3, "0")}-${angle.id}`,
    stream: "ground",
    type: "feed",
    theme: angle.theme,
    title,
    titleHe,
    place,
    angleId: angle.id,
    copy: {
      instagram: ensureInstagramCaption(igRaw, { maxTags: 30 }),
      facebook: fb
    }
  };
}

function main() {
  const posts = [];
  let i = 0;
  // 12 angles × 12 places = 144 posts (enough for 90d × 2)
  for (let round = 0; round < 2; round++) {
    for (const angle of angles) {
      for (const place of places) {
        if (posts.length >= 120) break;
        // vary pairing so same angle isn't always same city
        const p = places[(places.indexOf(place) + round * 5 + angles.indexOf(angle)) % places.length];
        const key = `${angle.id}-${p.city}-${round}`;
        if (posts.some((x) => x._key === key)) continue;
        const post = buildPost(angle, p, i++);
        post._key = key;
        posts.push(post);
      }
      if (posts.length >= 120) break;
    }
    if (posts.length >= 120) break;
  }
  for (const p of posts) delete p._key;

  const out = {
    generatedAt: new Date().toISOString(),
    brand,
    stream: "ground",
    note:
      "Ground ambulance / event medical security / prime transfers — North Israel focus (Poriya, Safed, Galilee)",
    posts
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Wrote ${posts.length} ground posts → ${OUT}`);
}

main();
