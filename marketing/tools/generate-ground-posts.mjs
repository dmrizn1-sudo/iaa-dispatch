#!/usr/bin/env node
/**
 * Build bilingual GROUND ambulance post library — patient transfers focus.
 *
 * Places = hospitals / medical destinations (Poriya, Ziv Safed, Rambam, …)
 * Angles = inter-hospital, home discharge, stair chair, prime fleet, crew…
 * Event security is intentionally NOT the main stream.
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

/** Tagged medical places — hospitals, not generic city labels */
const places = [
  {
    id: "poriya",
    nameEn: "Poriya Hospital",
    nameHe: "בית חולים פוריה",
    cityEn: "Tiberias area",
    cityHe: "אזור טבריה",
    regionEn: "North",
    regionHe: "הצפון",
    tagEn: "#PoriyaHospital",
    tagHe: "#ביתחוליםפוריה"
  },
  {
    id: "ziv-safed",
    nameEn: "Ziv Medical Center, Safed",
    nameHe: "בית חולים זיו צפת",
    cityEn: "Safed",
    cityHe: "צפת",
    regionEn: "North",
    regionHe: "הצפון",
    tagEn: "#ZivHospital #Safed",
    tagHe: "#ביתחוליםזיו #צפת"
  },
  {
    id: "rambam",
    nameEn: "Rambam Health Care Campus",
    nameHe: "רמב״ם חיפה",
    cityEn: "Haifa",
    cityHe: "חיפה",
    regionEn: "North",
    regionHe: "הצפון",
    tagEn: "#RambamHospital #Haifa",
    tagHe: "#רמבם #חיפה"
  },
  {
    id: "nahariya",
    nameEn: "Galilee Medical Center, Nahariya",
    nameHe: "המרכז הרפואי לגליל נהריה",
    cityEn: "Nahariya",
    cityHe: "נהריה",
    regionEn: "North",
    regionHe: "הצפון",
    tagEn: "#NahariyaHospital",
    tagHe: "#נהריה"
  },
  {
    id: "haemek",
    nameEn: "HaEmek Medical Center, Afula",
    nameHe: "העמק עפולה",
    cityEn: "Afula",
    cityHe: "עפולה",
    regionEn: "North",
    regionHe: "הצפון",
    tagEn: "#HaEmekHospital #Afula",
    tagHe: "#העמק #עפולה"
  },
  {
    id: "nazareth",
    nameEn: "Nazareth hospitals",
    nameHe: "בתי חולים בנצרת",
    cityEn: "Nazareth",
    cityHe: "נצרת",
    regionEn: "North",
    regionHe: "הצפון",
    tagEn: "#NazarethHospital",
    tagHe: "#נצרת"
  },
  {
    id: "kiryat-shmona",
    nameEn: "Northern Galilee / Kiryat Shmona area",
    nameHe: "אזור קריית שמונה והגליל העליון",
    cityEn: "Kiryat Shmona",
    cityHe: "קריית שמונה",
    regionEn: "North",
    regionHe: "הצפון",
    tagEn: "#KiryatShmona #UpperGalilee",
    tagHe: "#קרייתשמונה #הגליל"
  },
  {
    id: "tel-aviv",
    nameEn: "Tel Aviv medical centers",
    nameHe: "מרכזים רפואיים בתל אביב",
    cityEn: "Tel Aviv",
    cityHe: "תל אביב",
    regionEn: "Center",
    regionHe: "המרכז",
    tagEn: "#TelAvivHospital",
    tagHe: "#תלאביב"
  },
  {
    id: "jerusalem",
    nameEn: "Jerusalem hospitals",
    nameHe: "בתי חולים בירושלים",
    cityEn: "Jerusalem",
    cityHe: "ירושלים",
    regionEn: "Center",
    regionHe: "המרכז",
    tagEn: "#JerusalemHospital",
    tagHe: "#ירושלים"
  },
  {
    id: "sheba",
    nameEn: "Sheba Medical Center",
    nameHe: "שיבא תל השומר",
    cityEn: "Ramit Gan / Tel HaShomer",
    cityHe: "תל השומר",
    regionEn: "Center",
    regionHe: "המרכז",
    tagEn: "#ShebaHospital",
    tagHe: "#שיבא"
  }
];

const angles = [
  {
    id: "inter-hospital",
    theme: "transfer",
    titleEn: "Inter-hospital patient transfer",
    titleHe: "העברת חולים בין בתי חולים",
    bodyEn:
      "Professional ambulance transfers between hospitals — bedside to bedside.\nClinical continuity · monitoring · clear handoff to the receiving team.",
    bodyHe:
      "העברות אמבולנס מקצועיות בין בתי חולים — ממיטה למיטה.\nרצף קליני · ניטור · מסירה ברורה לצוות הקולט."
  },
  {
    id: "hospital-to-home",
    theme: "transfer",
    titleEn: "Hospital discharge — transfer home",
    titleHe: "העברה מבית חולים חזרה הביתה",
    bodyEn:
      "Safe, dignified transfer from hospital back home after discharge.\nComfortable ride · family coordination · professional medical escort when needed.",
    bodyHe:
      "העברה בטוחה ומכובדת מבית החולים חזרה הביתה אחרי שחרור.\nנסיעה נוחה · תיאום עם המשפחה · ליווי רפואי מקצועי לפי הצורך."
  },
  {
    id: "home-to-hospital",
    theme: "transfer",
    titleEn: "Home to hospital ambulance transfer",
    titleHe: "העברה מהבית לבית החולים",
    bodyEn:
      "Private ambulance from home to hospital for planned admissions and urgent transfers.\nOn time · clinically ready · calm communication with the family.",
    bodyHe:
      "אמבולנס פרטי מהבית לבית החולים — לאשפוז מתוכנן ולהעברות דחופות.\nבזמן · מוכנות קלינית · תקשורת רגועה עם המשפחה."
  },
  {
    id: "stair-chair",
    theme: "equipment",
    titleEn: "Electric stair chair for patient transfers",
    titleHe: "כסא חשמלי מיוחד להעלאת חולה במדרגות",
    bodyEn:
      "Special electric stair chair to move patients safely up and down stairs.\nWhen the elevator isn’t an option — we still bring the patient home or to the ambulance with dignity.",
    bodyHe:
      "כסא חשמלי מיוחד להעלאת והורדת חולה במדרגות בבטחה.\nכשאין מעלית — עדיין מעבירים את המטופל הביתה או לאמבולנס בכבוד ובזהירות."
  },
  {
    id: "prime-transfer",
    theme: "prime",
    titleEn: "Prime ambulance for medical transfers",
    titleHe: "אמבולנס פריים להעברות רפואיות",
    bodyEn:
      "Prime-level ambulances for comfortable medical transfers across Israel.\nHospital ↔ hospital · hospital ↔ home · North to every region.",
    bodyHe:
      "אמבולנסים ברמת פריים להעברות רפואיות נוחות בכל הארץ.\nבית חולים ↔ בית חולים · בית חולים ↔ הבית · מהצפון לכל אזור."
  },
  {
    id: "north-corridor",
    theme: "north",
    titleEn: "Medical transfers from the North",
    titleHe: "העברות רפואיות מהצפון לכל הארץ",
    bodyEn:
      "Focused coverage for northern hospitals — including Poriya and Ziv Safed — to centers nationwide.\nLocal knowledge · national reach · 24/7 dispatch.",
    bodyHe:
      "כיסוי ממוקד לבתי חולים בצפון — כולל פוריה וזיו צפת — למרכזים בכל הארץ.\nהיכרות מקומית · כיסוי ארצי · מוקד 24/7."
  },
  {
    id: "electric-beds",
    theme: "equipment",
    titleEn: "Electric stretchers on every transfer",
    titleHe: "מיטות חשמליות בכל העברה",
    bodyEn:
      "Electric stretchers for smoother loading and patient comfort.\nLess strain on the patient · safer handling · better clinical control.",
    bodyHe:
      "מיטות חשמליות להעמסה חלקה ולנוחות המטופל.\nפחות עומס על המטופל · טיפול בטוח יותר · שליטה קלינית טובה יותר."
  },
  {
    id: "advanced-gear",
    theme: "equipment",
    titleEn: "Advanced medical equipment on board",
    titleHe: "ציוד רפואי מתקדם באמבולנס",
    bodyEn:
      "Monitoring, oxygen, and advanced equipment on every medical transfer.\nPrepared for real clinical needs — not just a ride.",
    bodyHe:
      "ניטור, חמצן וציוד מתקדם בכל העברה רפואית.\nמוכנים לצרכים קליניים אמיתיים — לא רק נסיעה."
  },
  {
    id: "experience-20",
    theme: "crew",
    titleEn: "20+ years ICU paramedic experience",
    titleHe: "מעל 20 שנות ניסיון כפראמדיק טיפול נמרץ",
    bodyEn:
      "Over 20 years as an ICU paramedic guiding complex patient transfers.\nClinical judgment families can trust.",
    bodyHe:
      "מעל 20 שנות ניסיון כפראמדיק טיפול נמרץ בהעברות מורכבות.\nשיקול דעת קליני שמשפחות יכולות לסמוך עליו."
  },
  {
    id: "certified-crew",
    theme: "crew",
    titleEn: "Certified medics & ambulance drivers",
    titleHe: "חובשים מוסמכים ונהגי אמבולנס",
    bodyEn:
      "Certified medics and professional ambulance drivers on every transfer.\nTrained teams · calm updates · safe arrival.",
    bodyHe:
      "חובשים מוסמכים ונהגי אמבולנס מקצועיים בכל העברה.\nצוותים מיומנים · עדכונים רגועים · הגעה בטוחה."
  },
  {
    id: "new-fleet",
    theme: "fleet",
    titleEn: "Modern ambulances — top standard in Israel",
    titleHe: "אמבולנסים חדשים ברמה הגבוהה ביותר בישראל",
    bodyEn:
      "A modern ambulance fleet built for serious medical transfers.\nClean · advanced · ready 24/7.",
    bodyHe:
      "צי אמבולנסים מודרני להעברות רפואיות ברצינות.\nנקי · מתקדם · מוכן 24/7."
  },
  {
    id: "poriya-ziv-focus",
    theme: "north",
    titleEn: "Transfers from Poriya & Ziv Safed",
    titleHe: "העברות מבית חולים פוריה ומבית חולים זיו צפת",
    bodyEn:
      "Regular medical transfers from Poriya Hospital and Ziv Medical Center (Safed) to hospitals across Israel.\nNorth expertise · nationwide destinations.",
    bodyHe:
      "העברות רפואיות שוטפות מבית חולים פוריה ומבית חולים זיו צפת לכל בתי החולים בארץ.\nמומחיות צפון · יעדים ארציים."
  }
];

function ctaEn() {
  return [
    `📞 ${brand.phoneIntl} (24/7)`,
    `💬 WhatsApp: ${brand.whatsappLocal}`,
    `🌐 ${brand.website}`
  ].join("\n");
}

function ctaHe() {
  return [
    `📞 ${brand.phoneIntl} (24/7)`,
    `💬 וואטסאפ: ${brand.whatsappLocal}`,
    `🌐 ${brand.website}`
  ].join("\n");
}

function tagsFor(angle, place) {
  const en = [
    "#IsraelAirAmbulance",
    "#AmbulanceIsrael",
    "#PatientTransfer",
    "#MedicalTransport",
    "#InterHospitalTransfer",
    "#HospitalTransfer",
    "#NorthernIsrael",
    "#PoriyaHospital",
    "#ZivHospital",
    "#Safed",
    "#PrimeAmbulance",
    "#Israel"
  ];
  if (angle.id === "stair-chair") en.push("#StairChair", "#Accessibility");
  if (angle.theme === "equipment") en.push("#ElectricStretcher", "#MedicalEquipment");
  if (angle.theme === "crew") en.push("#ICUParamedic", "#CertifiedMedic");

  const he = [
    "#ישראלאייראמבולנס",
    "#אמבולנס",
    "#העברתחולים",
    "#העברהביןבתיחולים",
    "#העברהרפואית",
    "#ביתחוליםפוריה",
    "#ביתחוליםזיו",
    "#צפת",
    "#הצפון",
    "#כסאחשמלי",
    "#מיטהחשמלית",
    "#ישראל"
  ];

  // place-specific tags (split multi-tag fields)
  const placeEn = String(place.tagEn || "")
    .split(/\s+/)
    .filter((t) => t.startsWith("#"));
  const placeHe = String(place.tagHe || "")
    .split(/\s+/)
    .filter((t) => t.startsWith("#"));

  return {
    en: [...new Set([...placeEn, ...en])].slice(0, 16),
    he: [...new Set([...placeHe, ...he])].slice(0, 12)
  };
}

function buildPost(angle, place, index) {
  const title = `${angle.titleEn} · ${place.nameEn}`;
  const titleHe = `${angle.titleHe} · ${place.nameHe}`;
  const placeLineEn = `📍 ${place.nameEn} (${place.cityEn}, ${place.regionEn})`;
  const placeLineHe = `📍 ${place.nameHe} (${place.cityHe}, ${place.regionHe})`;
  const seoEn = `Private medical ambulance transfer — ${place.nameEn} and ${place.regionEn} Israel.`;
  const seoHe = `העברה רפואית באמבולנס פרטי — ${place.nameHe} ו${place.regionHe}.`;

  const en = [
    title,
    "",
    placeLineEn,
    "",
    angle.bodyEn,
    "",
    seoEn,
    "",
    "Israel Air & Ambulance — medical transfers · inter-hospital · home discharge · stair chair.",
    "",
    ctaEn()
  ].join("\n");

  const he = [
    titleHe,
    "",
    placeLineHe,
    "",
    angle.bodyHe,
    "",
    seoHe,
    "",
    "ישראל אייר אנד אמבולנס — העברות רפואיות · בין בתי חולים · חזרה הביתה · כסא חשמלי למדרגות.",
    "",
    ctaHe()
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
    place: {
      id: place.id,
      nameEn: place.nameEn,
      nameHe: place.nameHe,
      cityEn: place.cityEn,
      cityHe: place.cityHe,
      regionEn: place.regionEn,
      regionHe: place.regionHe
    },
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
  // Rotate angles × places for variety (prefer transfer angles)
  for (let pi = 0; pi < places.length && posts.length < 120; pi++) {
    for (let ai = 0; ai < angles.length && posts.length < 120; ai++) {
      posts.push(buildPost(angles[ai], places[(pi + ai) % places.length], i++));
    }
  }
  // second pass with offset for more variety up to 120
  for (let pi = 0; pi < places.length && posts.length < 120; pi++) {
    for (let ai = 0; ai < angles.length && posts.length < 120; ai++) {
      posts.push(buildPost(angles[(ai + 3) % angles.length], places[(pi + ai + 4) % places.length], i++));
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    brand,
    stream: "ground",
    note:
      "Ground medical TRANSFERS — Poriya Hospital, Ziv Safed, inter-hospital, home discharge, electric stair chair. Not event-security focused.",
    places,
    posts
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Wrote ${posts.length} transfer-focused ground posts → ${OUT}`);
  console.log(
    "Sample:",
    posts[0].title,
    "|",
    posts.find((p) => p.angleId === "stair-chair")?.titleHe
  );
}

main();
