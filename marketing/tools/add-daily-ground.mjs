#!/usr/bin/env node
/**
 * Append 2 ground-ambulance posts / day to the existing 90-day queue
 * without wiping air / reel schedule status.
 *
 * Default local times: 12:00 and 16:00 Asia/Jerusalem
 *
 * Usage:
 *   node marketing/tools/generate-ground-posts.mjs
 *   node marketing/tools/add-daily-ground.mjs
 *   node marketing/tools/add-daily-ground.mjs --replace
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pickAiImageUrl, publicAssetBase, listAiImageUrls } from "./ai-image-urls.mjs";
import { ensureInstagramCaption } from "./ig-hashtags.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const QUEUE_PATH = path.join(DATA, "publish-queue-90d.json");
const GROUND_PATH = path.join(DATA, "ground-posts.json");
const TZ = "Asia/Jerusalem";
const DEFAULT_HOURS = [12, 16];

function hasFlag(name) {
  return process.argv.includes(name);
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

function pickGroundImage(post, seed) {
  const man = listAiImageUrls();
  const byId = Object.fromEntries(man.map((i) => [i.id, i]));
  const preferred = {
    "event-security": "ground-event-standby",
    "event-ambulance": "ground-event-standby",
    "prime-transfer": "ground-prime-fleet",
    "new-fleet": "ground-prime-fleet",
    "electric-beds": "ground-electric-stretcher",
    "advanced-gear": "ground-electric-stretcher",
    "experience-20": "ground-ambulance-ready",
    "certified-crew": "ground-ambulance-ready",
    "north-focus": "ground-north-transfer",
    "north-to-center": "ground-north-transfer",
    "hospital-transfer": "ground-north-transfer",
    "home-hospital": "ground-prime-fleet"
  };
  const groundIds = [
    "ground-event-standby",
    "ground-prime-fleet",
    "ground-electric-stretcher",
    "ground-north-transfer",
    "ground-ambulance-ready",
    "ambulance-jet-handoff",
    "stretcher-boarding-night",
    "rain-night-transfer"
  ].filter((id) => byId[id]);

  const want = preferred[post.angleId];
  if (want && byId[want] && seed % 5 !== 4) {
    return byId[want].url;
  }
  if (!groundIds.length) return `${publicAssetBase()}/ground-ambulance-ready.jpg`;
  return byId[groundIds[seed % groundIds.length]].url;
}

function main() {
  if (!fs.existsSync(QUEUE_PATH)) {
    console.error("Missing queue. Run schedule-90-days.mjs --build first.");
    process.exit(1);
  }
  if (!fs.existsSync(GROUND_PATH)) {
    console.error("Missing ground-posts.json. Run generate-ground-posts.mjs first.");
    process.exit(1);
  }

  const hours = DEFAULT_HOURS;
  const replace = hasFlag("--replace");
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
  const { posts: groundPosts } = JSON.parse(fs.readFileSync(GROUND_PATH, "utf8"));
  if (!groundPosts?.length) throw new Error("No ground posts");

  if (replace) {
    queue.slots = queue.slots.filter((s) => s.stream !== "ground");
  }

  const existingKeys = new Set(
    queue.slots
      .filter((s) => s.stream === "ground")
      .map((s) => `${s.localDate}|${s.localTime}`)
  );

  const dates = [...new Set(queue.slots.map((s) => s.localDate))].sort();
  let added = 0;
  const angleIds = [...new Set(groundPosts.map((p) => p.angleId))];

  for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
    const ymd = dates[dayIndex];
    const [y, m, d] = ymd.split("-").map(Number);
    for (let slotIndex = 0; slotIndex < hours.length; slotIndex++) {
      const hour = hours[slotIndex];
      const localTime = `${String(hour).padStart(2, "0")}:00`;
      const key = `${ymd}|${localTime}`;
      if (existingKeys.has(key)) continue;

      const angleId = angleIds[(dayIndex * 2 + slotIndex) % angleIds.length];
      const pool = groundPosts.filter((p) => p.angleId === angleId);
      const post = pool[Math.floor(dayIndex / angleIds.length + slotIndex) % pool.length] || groundPosts[0];
      const unix = jerusalemUnix(y, m, d, hour, 0);
      const image = pickGroundImage(post, dayIndex * 2 + slotIndex);
      const id = `d${String(dayIndex + 1).padStart(3, "0")}-g${slotIndex + 1}-${post.id}`;

      queue.slots.push({
        id,
        stream: "ground",
        format: "photo",
        dayIndex: dayIndex + 1,
        slot: 10 + slotIndex, // keep distinct from air 1/2 and reel 3
        localDate: ymd,
        localTime,
        timezone: TZ,
        scheduledUnix: unix,
        scheduledIsoUtc: new Date(unix * 1000).toISOString(),
        sourceId: post.id,
        title: post.title,
        titleHe: post.titleHe || "",
        theme: post.theme,
        place: post.place || null,
        imageUrl: image,
        platforms: {
          facebook: {
            status: "pending",
            message: post.copy.facebook,
            link: "https://ambulancenter.com",
            imageUrl: image,
            postId: null,
            error: null
          },
          instagram: {
            status: "pending",
            caption: ensureInstagramCaption(post.copy.instagram || ""),
            imageUrl: image,
            mediaId: null,
            permalink: null,
            error: null
          }
        }
      });
      added += 1;
    }
  }

  queue.slots.sort(
    (a, b) => a.scheduledUnix - b.scheduledUnix || String(a.id).localeCompare(b.id)
  );

  const groundCount = queue.slots.filter((s) => s.stream === "ground").length;
  const airCount = queue.slots.filter((s) => s.stream !== "ground" && s.format !== "reel").length;
  const reelCount = queue.slots.filter((s) => s.format === "reel").length;

  queue.ground = {
    enabled: true,
    hoursLocal: hours,
    focus: "Event medical security · prime transfers · electric beds · North (Poriya/Safed) · 20+ yrs ICU paramedic",
    count: groundCount,
    updatedAt: new Date().toISOString()
  };
  queue.approval =
    "Pre-approved · 2 air photo posts/day + 2 ground ambulance posts/day + 1 Reel/day · FB+IG · bilingual EN+HE";
  queue.totals = {
    slots: queue.slots.length,
    airPhotos: airCount,
    groundPhotos: groundCount,
    reels: reelCount,
    facebook: airCount + groundCount,
    instagram: queue.slots.length
  };

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  console.log(
    `Ground posts added: ${added} · total ground slots: ${groundCount} · hours ${hours.join(",")}:00 ${TZ}`
  );
}

main();
