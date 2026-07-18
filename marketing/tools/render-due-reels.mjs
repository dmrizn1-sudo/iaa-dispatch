#!/usr/bin/env node
/**
 * Render a reel MP4 for a queue slot (or by --id / --due).
 *
 * Usage:
 *   node marketing/tools/render-due-reels.mjs --id d001-reel-day-001
 *   node marketing/tools/render-due-reels.mjs --due
 *   node marketing/tools/render-due-reels.mjs --all-pending --limit 3
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPO = path.resolve(ROOT, "..");
const QUEUE_PATH = path.join(ROOT, "data", "publish-queue-90d.json");
const RENDER = path.join(__dirname, "render-reel.py");

function hasFlag(name) {
  return process.argv.includes(name);
}
function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? true;
}

function renderSlot(slot) {
  const r = slot.reel || {};
  const images = (r.localImages || []).filter((p) => fs.existsSync(path.resolve(REPO, p.replace(/^\.\//, ""))));
  // paths in queue are absolute under workspace or relative to repo
  const resolved = (r.localImages || [])
    .map((p) => {
      if (path.isAbsolute(p) && fs.existsSync(p)) return p;
      const a = path.resolve(REPO, p);
      if (fs.existsSync(a)) return a;
      const b = path.resolve(ROOT, p.replace(/^marketing\//, ""));
      if (fs.existsSync(b)) return b;
      return null;
    })
    .filter(Boolean);

  if (resolved.length < 2) {
    throw new Error(`Need ≥2 local images for ${slot.id}`);
  }
  const outRel = r.videoPath || slot.platforms?.instagram?.videoPath || `marketing/assets/reels/${slot.id}.mp4`;
  const out = path.isAbsolute(outRel) ? outRel : path.resolve(REPO, outRel);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const args = [
    RENDER,
    "--out",
    out,
    "--images",
    resolved.slice(0, 3).join(","),
    "--title-en",
    r.titleEn || slot.title || "Israel Air Ambulance",
    "--title-he",
    r.titleHe || slot.titleHe || "ישראל אייר אמבולנס",
    "--line-en",
    r.lineEn || "Private ICU medical flights · 24/7",
    "--line-he",
    r.lineHe || "טיסות רפואיות פרטיות ברמת ICU · 24/7",
    "--cta-en",
    r.ctaEn || "WhatsApp 053-232-1101",
    "--cta-he",
    r.ctaHe || "וואטסאפ 053-232-1101"
  ];
  const res = spawnSync("python3", args, { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || `render failed ${slot.id}`);
  }
  console.log(res.stdout.trim());
  return out;
}

function main() {
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
  const reels = queue.slots.filter((s) => s.format === "reel");
  let targets = [];

  if (arg("--id")) {
    const id = arg("--id");
    targets = reels.filter((s) => s.id === id);
  } else if (hasFlag("--due")) {
    const now = Math.floor(Date.now() / 1000);
    const lookback = Number(process.env.LOOKBACK_MIN || 180) * 60;
    const ahead = Number(process.env.AHEAD_MIN || 60) * 60;
    targets = reels.filter((s) => {
      const st = s.platforms?.instagram?.status;
      if (st === "published") return false;
      return s.scheduledUnix >= now - lookback && s.scheduledUnix <= now + ahead;
    });
  } else if (hasFlag("--all-pending")) {
    const limit = Number(arg("--limit", 5));
    targets = reels
      .filter((s) => s.platforms?.instagram?.status === "pending")
      .slice(0, limit);
  } else {
    console.error("Use --id, --due, or --all-pending");
    process.exit(1);
  }

  if (!targets.length) {
    console.log("No reels to render");
    return;
  }

  for (const slot of targets) {
    renderSlot(slot);
  }
}

main();
