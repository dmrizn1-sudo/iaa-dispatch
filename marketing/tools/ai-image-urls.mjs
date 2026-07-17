/**
 * Public URL helpers for AI medical-aviation images.
 * Prefers theme match, then least-used / non-adjacent rotation.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "assets/ai-images/manifest.json");

export function loadAiImageManifest() {
  if (!fs.existsSync(MANIFEST)) return null;
  return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
}

export function publicAssetBase() {
  if (process.env.PUBLIC_ASSET_BASE) {
    return process.env.PUBLIC_ASSET_BASE.replace(/\/$/, "");
  }
  const owner = process.env.GITHUB_OWNER || "dmrizn1-sudo";
  const repo = process.env.GITHUB_REPO || "iaa-dispatch";
  const ref =
    process.env.PUBLIC_ASSET_REF ||
    process.env.GITHUB_REF_NAME ||
    "cursor/israel-air-ambulance-marketing-a915";
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/marketing/assets/ai-images`;
}

export function listAiImageUrls() {
  const man = loadAiImageManifest();
  const base = publicAssetBase();
  if (!man?.images?.length) return [];
  return man.images.map((img) => ({
    ...img,
    url: `${base}/${img.file}`
  }));
}

function scoreThemes(img, hay) {
  let score = 0;
  for (const t of img.themes || []) {
    if (hay.includes(String(t).toLowerCase())) score += 3;
  }
  // keyword heuristics
  const rules = [
    [/heli|helipad|coast|greece|cyprus|santorini|rhodes/i, ["medevac-heli-coast", "hospital-helipad-dusk", "aerial-mediterranean-route"]],
    [/icu|equipment|ventilator|monitor|crew/i, ["air-ambulance-icu-cabin", "cabin-monitor-closeup", "fleet-hangar-dawn"]],
    [/desert|dubai|uae|middle/i, ["jet-desert-climb"]],
    [/rain|night|storm|holiday emergency/i, ["rain-night-transfer", "stretcher-boarding-night"]],
    [/winter|europe|zurich|berlin|vienna|paris|london/i, ["winter-europe-turboprop", "aerial-mediterranean-route"]],
    [/bedside|handoff|repatriation|trust|ground/i, ["ambulance-jet-handoff", "ground-ambulance-ready", "hospital-helipad-dusk"]],
    [/sunset|travel|window|journey/i, ["cabin-window-sunset-square", "aerial-mediterranean-route"]],
    [/fleet|hangar|behind/i, ["fleet-hangar-dawn"]],
    [/flight|inflight|fly|route|usa|new york|miami/i, ["air-ambulance-inflight", "air-ambulance-jet-tarmac", "jet-desert-climb"]]
  ];
  for (const [re, ids] of rules) {
    if (re.test(hay) && ids.includes(img.id)) score += 5;
  }
  return score;
}

/**
 * Pick image with theme affinity + anti-repeat.
 * @param {{theme?:string,title?:string,sourceId?:string,seed?:number,avoidIds?:string[],usageCounts?:Record<string,number>}} opts
 */
export function pickAiImageUrl(opts = {}) {
  const {
    theme = "",
    title = "",
    sourceId = "",
    seed = 0,
    avoidIds = [],
    usageCounts = {}
  } = opts;
  const images = listAiImageUrls();
  if (!images.length) return process.env.IMAGE_URL || null;

  const hay = `${theme} ${title} ${sourceId}`.toLowerCase();
  const avoid = new Set(avoidIds);

  const ranked = images
    .map((img) => {
      let score = scoreThemes(img, hay);
      // penalize recently used / overused
      if (avoid.has(img.id)) score -= 50;
      score -= (usageCounts[img.id] || 0) * 4;
      // light seed jitter for variety
      score += ((seed * 17 + img.id.length * 3) % 7) * 0.1;
      return { img, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0].img.url;
}

/** Assign unique-as-possible images across a full schedule (greedy). */
export function assignImagesToSlots(slots) {
  const images = listAiImageUrls();
  if (!images.length) return slots;
  const usage = Object.fromEntries(images.map((i) => [i.id, 0]));
  let prevId = null;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const avoid = prevId ? [prevId] : [];
    // also avoid the image used earlier same day if morning already set
    if (slot.slot === 2 && i > 0 && slots[i - 1].localDate === slot.localDate) {
      const morningFile = (slots[i - 1].imageUrl || "").split("/").pop()?.replace(".jpg", "");
      if (morningFile) avoid.push(morningFile);
    }
    const url = pickAiImageUrl({
      theme: slot.theme || "",
      title: slot.title || "",
      sourceId: slot.sourceId || "",
      seed: i * 11 + slot.dayIndex * 3,
      avoidIds: avoid,
      usageCounts: usage
    });
    const id = url.split("/").pop().replace(".jpg", "");
    usage[id] = (usage[id] || 0) + 1;
    prevId = id;
    slot.imageUrl = url;
    if (slot.platforms?.instagram) slot.platforms.instagram.imageUrl = url;
    if (slot.platforms?.facebook) slot.platforms.facebook.imageUrl = url;
  }
  return { slots, usage };
}
