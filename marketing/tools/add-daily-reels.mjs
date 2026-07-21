#!/usr/bin/env node
/**
 * Append 1 high-quality Instagram Reel / day to the existing 90-day queue
 * without wiping Facebook/Instagram photo schedule status.
 *
 * Default local time: 20:00 Asia/Jerusalem
 *
 * Usage:
 *   node marketing/tools/add-daily-reels.mjs
 *   node marketing/tools/add-daily-reels.mjs --hour 20
 *   node marketing/tools/add-daily-reels.mjs --replace   # drop existing reel slots first
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listAiImageUrls, pickAiImageUrl } from "./ai-image-urls.mjs";
import { ensureInstagramCaption } from "./ig-hashtags.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const QUEUE_PATH = path.join(DATA, "publish-queue-90d.json");
const POSTS_PATH = path.join(DATA, "posts.json");
const TZ = "Asia/Jerusalem";
const IMG_DIR = path.join(ROOT, "assets/ai-images");

function hasFlag(name) {
  return process.argv.includes(name);
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? true;
}

function jerusalemUnix(y, m, d, hour, minute = 0) {
  let guess = Date.UTC(y, m - 1, d, hour, minute, 0);
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date(guess));
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    const asUTC = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second")
    );
    const desired = Date.UTC(y, m - 1, d, hour, minute, 0);
    guess += desired - asUTC;
  }
  return Math.floor(guess / 1000);
}

function loadFeed() {
  const { posts, brand } = JSON.parse(fs.readFileSync(POSTS_PATH, "utf8"));
  return {
    feed: posts.filter((p) => p.type === "feed"),
    brand: brand || {}
  };
}

function citySlug(city = "") {
  return String(city)
    .replace(/[^a-zA-Z0-9]+/g, "")
    .replace(/^(.)/, (m) => m.toUpperCase());
}

function buildReelCaption(post, brand) {
  const city = post.destination?.city || "";
  const cityHe = post.destination?.cityHe || "";
  const country = post.destination?.country || "";
  const title = post.title || `Air ambulance ${city} ↔ Israel`;
  const titleHe = post.titleHe || `אמבולנס אווירי ${cityHe} ↔ ישראל`;
  const wa = brand.whatsappLocal || "053-232-1101";
  const phone = brand.phoneIntl || "+972-79-670-9999";
  const slug = citySlug(city);

  const en = [
    `${title}`,
    ``,
    `Private ICU medical flights · bedside to bedside.`,
    `TO Israel & FROM Israel · 24/7 coordination.`,
    ``,
    `📞 ${phone}`,
    `💬 WhatsApp: ${wa}`,
    `🌐 https://ambulancenter.com`
  ].join("\n");

  const he = [
    `${titleHe}`,
    ``,
    `טיסות רפואיות פרטיות ברמת ICU · ממיטה למיטה.`,
    `לישראל ומישראל · תיאום 24/7.`,
    ``,
    `📞 ${phone}`,
    `💬 וואטסאפ: ${wa}`,
    `🌐 https://ambulancenter.com`
  ].join("\n");

  const destTags = slug
    ? [
        `#AirAmbulance${slug}`,
        `#MedicalFlight${slug}`,
        `#${slug}ToIsrael`,
        `#IsraelTo${slug}`
      ]
    : [];
  const enTags = [
    "#IsraelAirAmbulance",
    "#AirAmbulance",
    "#MedicalFlight",
    "#MedicalRepatriation",
    "#ICUTransport",
    "#Reels",
    "#Medevac",
    "#TelAviv",
    "#Israel",
    ...destTags
  ].slice(0, 18);
  const heTags = [
    "#ישראלאייראמבולנס",
    "#אמבולנסאווירי",
    "#טיסהרפואית",
    "#החזרהרפואית",
    "#טיפולנמרץ",
    "#רילס",
    "#ישראל",
    "#תלאביב"
  ];

  const raw = `${en}\n\n────────\n\n${he}\n\n${enTags.join(" ")}\n${heTags.join(" ")}`;
  return ensureInstagramCaption(raw, { maxTags: 30 });
}

function pickLocalImages(title, seed) {
  const all = listAiImageUrls();
  if (all.length < 2) return [];
  // Prefer theme-matched first, then rotate neighbors for motion variety
  const primaryUrl = pickAiImageUrl({ title, seed });
  const primary = all.find((i) => i.url === primaryUrl) || all[seed % all.length];
  const idx = Math.max(0, all.findIndex((i) => i.id === primary.id));
  const second = all[(idx + 3) % all.length];
  const third = all[(idx + 7) % all.length];
  const files = [primary, second, third].map(
    (i) => `marketing/assets/ai-images/${i.file}`
  );
  return [...new Set(files)].slice(0, 3);
}

function main() {
  if (!fs.existsSync(QUEUE_PATH)) {
    console.error("Missing queue. Run schedule-90-days.mjs --build first.");
    process.exit(1);
  }
  const hour = Number(arg("--hour", 20));
  const replace = hasFlag("--replace");
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
  const { feed, brand } = loadFeed();
  if (!feed.length) throw new Error("No feed posts");

  if (replace) {
    queue.slots = queue.slots.filter((s) => s.format !== "reel");
  }

  const existingReelDates = new Set(
    queue.slots.filter((s) => s.format === "reel").map((s) => s.localDate)
  );

  // Unique dates from photo slots, ordered
  const dates = [...new Set(queue.slots.map((s) => s.localDate))].sort();
  let added = 0;

  for (let i = 0; i < dates.length; i++) {
    const ymd = dates[i];
    if (existingReelDates.has(ymd)) continue;
    const [y, m, d] = ymd.split("-").map(Number);
    const unix = jerusalemUnix(y, m, d, hour, 0);
    const post = feed[i % feed.length];
    const caption = buildReelCaption(post, brand);
    const images = pickLocalImages(post.title || "", i);
    const id = `d${String(i + 1).padStart(3, "0")}-reel-${post.id}`;

    queue.slots.push({
      id,
      format: "reel",
      dayIndex: i + 1,
      slot: 3,
      localDate: ymd,
      localTime: `${String(hour).padStart(2, "0")}:00`,
      timezone: TZ,
      scheduledUnix: unix,
      scheduledIsoUtc: new Date(unix * 1000).toISOString(),
      sourceId: post.id,
      title: post.title,
      titleHe: post.titleHe || "",
      destination: post.destination || null,
      reel: {
        titleEn: post.title,
        titleHe: post.titleHe || "",
        lineEn: "Private ICU medical flights · 24/7",
        lineHe: "טיסות רפואיות פרטיות ברמת ICU · 24/7",
        ctaEn: `WhatsApp ${brand.whatsappLocal || "053-232-1101"}`,
        ctaHe: `וואטסאפ ${brand.whatsappLocal || "053-232-1101"}`,
        localImages: images,
        videoPath: `marketing/assets/reels/${id}.mp4`
      },
      platforms: {
        facebook: {
          status: "skipped_reel_ig_only",
          message: null,
          link: "https://ambulancenter.com",
          postId: null,
          error: null
        },
        instagram: {
          status: "pending",
          mediaType: "REELS",
          caption,
          videoPath: `marketing/assets/reels/${id}.mp4`,
          mediaId: null,
          permalink: null,
          error: null
        }
      }
    });
    added += 1;
  }

  queue.slots.sort((a, b) => a.scheduledUnix - b.scheduledUnix || String(a.id).localeCompare(b.id));
  queue.reels = {
    enabled: true,
    hourLocal: hour,
    quality: "1080x1920 H.264 CRF16 · Ken Burns · bilingual burn-in · no stock music",
    count: queue.slots.filter((s) => s.format === "reel").length,
    updatedAt: new Date().toISOString()
  };
  queue.approval =
    "Pre-approved by owner for 90 days · 2 photo posts/day + 1 high-quality Reel/day · Facebook + Instagram · bilingual EN+HE";
  queue.totals = {
    slots: queue.slots.length,
    photos: queue.slots.filter((s) => s.format !== "reel").length,
    reels: queue.slots.filter((s) => s.format === "reel").length,
    facebook: queue.slots.filter((s) => s.format !== "reel").length,
    instagram: queue.slots.length
  };

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  console.log(`Reels added: ${added} · total reel slots: ${queue.reels.count} · hour ${hour}:00 ${TZ}`);
}

main();
