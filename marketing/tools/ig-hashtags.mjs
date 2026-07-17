/**
 * Instagram hashtag helpers — never publish IG without tags.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HASHTAGS = path.join(ROOT, "data/hashtags.json");

const FALLBACK_EN = [
  "#IsraelAirAmbulance",
  "#AirAmbulance",
  "#MedicalFlight",
  "#MedicalRepatriation",
  "#CriticalCareTransport",
  "#ICUTransport",
  "#EmergencyMedicalFlight",
  "#MedicalEscort",
  "#InternationalPatientTransport",
  "#PrivateAirAmbulance",
  "#Israel",
  "#TelAviv"
];
const FALLBACK_HE = [
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

export function defaultHashtagBlock() {
  const h = loadHashtagLibrary();
  const en = (h.always_include || FALLBACK_EN).slice(0, 15).join(" ");
  const he = (h.he_always || FALLBACK_HE).join(" ");
  return `${en}\n${he}`;
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

/** Keep body under limit while always appending hashtags. */
export function ensureInstagramCaption(caption, { max = 2200 } = {}) {
  let body = String(caption || "").trim();
  let tags = extractHashtagBlock(body);
  if (tags) body = stripTrailingHashtags(body);
  if (!tags || (tags.match(/#/g) || []).length < 8) {
    tags = defaultHashtagBlock();
  }
  // Ensure Hebrew tags present
  if (!/[\u0590-\u05FF]/.test(tags)) {
    tags = `${tags}\n${FALLBACK_HE.join(" ")}`;
  }
  const sep = "\n\n";
  let out = `${body}${sep}${tags}`.trim();
  if (out.length <= max) return out;
  // Trim body only — never drop hashtags
  const room = max - tags.length - sep.length;
  if (room < 200) {
    // Extreme: keep tags + short body
    return `${body.slice(0, 180).trim()}…${sep}${tags}`.slice(0, max);
  }
  return `${body.slice(0, room).trim()}…${sep}${tags}`;
}
