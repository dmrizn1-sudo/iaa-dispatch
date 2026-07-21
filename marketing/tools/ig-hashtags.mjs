/**
 * Instagram hashtag helpers — never publish IG without tags.
 * Always include brand, Israel, medical flights, plus kupot/hospitals/destinations.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HASHTAGS = path.join(ROOT, "data/hashtags.json");

const FALLBACK_EN = [
  "#IsraelAirAmbulance",
  "#Israel",
  "#MedicalFlight",
  "#AirAmbulance",
  "#MedicalRepatriation",
  "#PatientTransfer",
  "#PrivateAmbulance",
  "#CriticalCareTransport"
];
const FALLBACK_HE = [
  "#ישראלאייראמבולנס",
  "#ישראל",
  "#הטסותרפואיות",
  "#טיסהרפואית",
  "#אמבולנסאווירי",
  "#אמבולנספרטי",
  "#העברתחולים",
  "#רפואהדחופה"
];

export function loadHashtagLibrary() {
  try {
    return JSON.parse(fs.readFileSync(HASHTAGS, "utf8"));
  } catch {
    return {
      always_include: FALLBACK_EN,
      he_always: FALLBACK_HE
    };
  }
}

function uniqTags(tags) {
  const seen = new Set();
  const out = [];
  for (const t of tags) {
    if (!t || !t.startsWith("#")) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function pickRotate(arr = [], seed = 0, n = 2) {
  if (!arr.length || n <= 0) return [];
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(arr[(seed + i) % arr.length]);
  }
  return out;
}

/**
 * Build contextual hashtag block (EN + HE), max 30 tags.
 * @param {{stream?:string, theme?:string, location?:object, seed?:number}} ctx
 */
export function buildHashtagBlock(ctx = {}) {
  const h = loadHashtagLibrary();
  const seed = Number(ctx.seed || 0);
  const stream = ctx.stream || "";
  const theme = String(ctx.theme || "");
  const loc = ctx.location || {};

  const en = [
    ...(h.always_include || FALLBACK_EN),
    ...pickRotate(h.service_rotate, seed, stream === "air" ? 3 : 2)
  ];
  const he = [
    ...(h.he_always || FALLBACK_HE),
    ...pickRotate(h.he_kupot, seed, 3),
    ...pickRotate(h.he_growth, seed + 1, 2),
    ...pickRotate(h.he_rotate, seed + 2, 2)
  ];

  // Destination / route tags for air
  if (stream === "air" || loc.type === "air") {
    const city = loc.city || loc.cityEn || "";
    const country = loc.country || loc.countryEn || "";
    const countryCode = loc.countryCode || "";
    if (city) {
      const compact = `#${String(city).replace(/\s+/g, "")}`;
      en.push(compact, `#${String(city).replace(/\s+/g, "")}ToIsrael`);
      const mapped = (h.he_dest_map || {})[city] || [];
      he.push(...mapped);
    }
    if (country) {
      en.push(`#${String(country).replace(/\s+/g, "")}`);
    }
    if (countryCode === "US" || /United States|USA/i.test(country) || /New York|Miami|Los Angeles/i.test(city)) {
      en.push("#USAToIsrael", "#UnitedStates");
      he.push("#ארהב", "#ארהבלישראל");
    }
    if (/Thailand|Bangkok|Phuket/i.test(`${city} ${country}`)) {
      en.push("#ThailandToIsrael", "#Thailand");
      he.push("#תאילנד", "#תאילנדלישראל");
    }
    if (/Dubai|United Arab Emirates|Abu Dhabi/i.test(`${city} ${country}`)) {
      en.push("#DubaiToIsrael", "#Dubai");
      he.push("#דובאי", "#דובאילישראל");
    }
    en.push(...pickRotate(h.route_rotate, seed, 2));
    en.push(...pickRotate(h.country_rotate, seed, 1));
    he.push("#הטסותרפואיות", "#טיסהרפואיתלישראל", "#השבהלארץ");
  }

  // Hospital / city tags for ground & events
  if (stream === "ground" || stream === "event" || loc.type === "ground") {
    const placeId = loc.placeId || loc.place?.id || "";
    const cityHe = loc.cityHe || loc.place?.cityHe || "";
    const cityEn = loc.cityEn || loc.place?.cityEn || "";
    const mapped = (h.he_place_map || {})[placeId] || [];
    he.push(...mapped);
    if (cityHe) {
      he.push(`#${String(cityHe).replace(/\s+/g, "")}`);
    }
    if (cityEn) {
      en.push(`#${String(cityEn).replace(/\s+/g, "")}`);
    }
    he.push(...pickRotate(h.he_hospitals_rotate, seed, 3));
    if (theme.startsWith("maccabi")) {
      he.push("#מכבי", "#קופתחולים", "#טבריה");
      en.push("#Maccabi", "#Tiberias");
    }
    if (stream === "event" || theme.includes("event")) {
      he.push("#אבטחהרפואית", "#אירועים");
      en.push("#EventMedical");
    }
  }

  // Always reinforce brand + Israel + medical flights (user request)
  en.unshift("#IsraelAirAmbulance", "#Israel", "#MedicalFlight");
  he.unshift("#ישראלאייראמבולנס", "#ישראל", "#הטסותרפואיות", "#טיסהרפואית");

  const enU = uniqTags(en);
  const heU = uniqTags(he);
  // Cap 30 total — keep brand/Israel/flights first, then HE geo, then rest
  const priorityHe = heU.filter((t) =>
    /ישראלאייראמבולנס|^#ישראל$|הטסותרפואיות|טיסהרפואית|מכבי|כללית|רמבם|עפולה|פוריה|זיו|דובאי|תאילנד|ארהב/.test(t)
  );
  const restHe = heU.filter((t) => !priorityHe.includes(t));
  const priorityEn = enU.filter((t) =>
    /IsraelAirAmbulance|^#Israel$|MedicalFlight|AirAmbulance|ToIsrael|Maccabi|Dubai|Thailand|USA/.test(t)
  );
  const restEn = enU.filter((t) => !priorityEn.includes(t));

  const max = 30;
  const heKeep = uniqTags([...priorityHe, ...restHe]).slice(0, 14);
  const enKeep = uniqTags([...priorityEn, ...restEn]).slice(0, max - heKeep.length);

  return `${enKeep.join(" ")}\n${heKeep.join(" ")}`.trim();
}

export function defaultHashtagBlock() {
  return buildHashtagBlock({});
}

export function extractHashtagBlock(caption = "") {
  const lines = String(caption).split("\n");
  const tagLines = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) {
      if (tagLines.length) break;
      continue;
    }
    if (/^#/.test(line) || (line.includes("#") && line.split(/\s+/).filter((w) => w.startsWith("#")).length >= 3)) {
      tagLines.unshift(line);
      continue;
    }
    break;
  }
  return tagLines.join("\n");
}

export function stripTrailingHashtags(caption = "") {
  const block = extractHashtagBlock(caption);
  if (!block) return caption.trim();
  const idx = caption.lastIndexOf(block);
  if (idx === -1) return caption.trim();
  return caption.slice(0, idx).trim();
}

/** Keep body under limit while always appending contextual hashtags. */
export function ensureInstagramCaption(caption, opts = {}) {
  const { max = 2200, maxTags = 30, context = null } = opts;
  let body = String(caption || "").trim();
  let tags = extractHashtagBlock(body);
  if (tags) body = stripTrailingHashtags(body);
  // Always rebuild from context when provided (stronger brand/geo tags)
  if (context) {
    tags = buildHashtagBlock(context);
  } else if (!tags || (tags.match(/#/g) || []).length < 8) {
    tags = defaultHashtagBlock();
  }
  const tagTokens = tags.split(/\s+/).filter((t) => t.startsWith("#"));
  if (tagTokens.length > maxTags) {
    tags = tagTokens.slice(0, maxTags).join(" ");
  }
  // Ensure required Hebrew tags present
  for (const must of ["#ישראלאייראמבולנס", "#ישראל", "#הטסותרפואיות"]) {
    if (!tags.includes(must)) tags = `${tags} ${must}`;
  }
  const sep = "\n\n";
  let out = `${body}${sep}${tags}`.trim();
  if (out.length <= max) return out;
  const room = max - tags.length - sep.length;
  if (room < 200) {
    return `${body.slice(0, 180).trim()}…${sep}${tags}`.slice(0, max);
  }
  return `${body.slice(0, room).trim()}…${sep}${tags}`;
}
