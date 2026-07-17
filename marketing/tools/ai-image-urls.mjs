/**
 * Public URL helpers for AI medical-aviation images.
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
  // Prefer branch ref so images work before merge; set PUBLIC_ASSET_REF=main after merge
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

/** Pick image by theme keywords in title/sourceId, else rotate by seed. */
export function pickAiImageUrl({ theme = "", title = "", sourceId = "", seed = 0 } = {}) {
  const images = listAiImageUrls();
  if (!images.length) return process.env.IMAGE_URL || null;
  const hay = `${theme} ${title} ${sourceId}`.toLowerCase();
  const themed = images.filter((img) =>
    (img.themes || []).some((t) => hay.includes(String(t).toLowerCase()))
  );
  const pool = themed.length ? themed : images;
  // Extra heuristics
  let preferred = pool;
  if (/icu|equipment|ventilator|monitor|cabin/i.test(hay)) {
    preferred = images.filter((i) => i.id.includes("icu")) || pool;
  } else if (/night|emergency|holiday|boarding|stretcher/i.test(hay)) {
    preferred = images.filter((i) => i.id.includes("stretcher") || i.id.includes("night")) || pool;
  } else if (/bedside|handoff|repatriation|trust/i.test(hay)) {
    preferred = images.filter((i) => i.id.includes("handoff")) || pool;
  } else if (/flight|inflight|fly|route|usa|europe/i.test(hay)) {
    preferred = images.filter((i) => i.id.includes("inflight") || i.id.includes("tarmac")) || pool;
  }
  const use = preferred.length ? preferred : pool;
  return use[Math.abs(seed) % use.length].url;
}
