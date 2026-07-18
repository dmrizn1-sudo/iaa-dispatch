#!/usr/bin/env node
/**
 * Build + Facebook-schedule a 90-day queue from owner-approved posts 1–22.
 * 5 posts/day (Asia/Jerusalem): mix of ground ambulances + medical flights.
 *
 * Usage:
 *   node marketing/tools/build-approved-5x90.mjs --build
 *   node marketing/tools/build-approved-5x90.mjs --build --schedule-facebook
 *   node marketing/tools/build-approved-5x90.mjs --schedule-facebook   # existing queue
 *
 * Env: FACEBOOK_PAGE_ACCESS_TOKEN, FACEBOOK_PAGE_ID, INSTAGRAM_USER_ID,
 *      DAYS=90 START_DATE=YYYY-MM-DD DRY_RUN=1
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pickAiImageUrl, publicAssetBase, listAiImageUrls } from "./ai-image-urls.mjs";
import { ensureInstagramCaption } from "./ig-hashtags.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const APPROVED_PATH = path.join(DATA, "approved-posts.json");
const QUEUE_PATH = path.join(DATA, "publish-queue-90d.json");
const ARCHIVE_PATH = path.join(DATA, `publish-queue-90d.prev-${Date.now()}.json`);
const API = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${API}`;
const TZ = "Asia/Jerusalem";
/** 5 slots/day — air + ground + mix */
const SLOT_HOURS = [10, 12, 14, 16, 18];
/** Daily stream mix: air, ground, ground/maccabi, event|ground, air */
const SLOT_STREAMS = ["air", "ground", "ground", "event", "air"];

function hasFlag(name) {
  return process.argv.includes(name);
}
function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? true;
}

async function graph(method, urlPath, { token, body, query } = {}) {
  const u = new URL(`${BASE}${urlPath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v != null) u.searchParams.set(k, String(v));
    }
  }
  u.searchParams.set("access_token", token);
  const opts = { method };
  if (body) {
    opts.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    opts.body = new URLSearchParams(
      Object.fromEntries(Object.entries(body).filter(([, v]) => v != null && v !== ""))
    ).toString();
  }
  const res = await fetch(u, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(JSON.stringify(json.error || { message: res.statusText }, null, 2));
  }
  return json;
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

function tomorrowJerusalemYmd() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const [y, m, d] = parts.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d, 12, 0, 0) + 24 * 3600 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(next);
}

function addDaysYmd(ymd, days) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(dt);
}

function contactBlock(contacts, he = true) {
  if (he) {
    return `📞 ${contacts.phone}\n💬 וואטסאפ ${contacts.whatsapp}\n🌐 ${contacts.web}`;
  }
  return `📞 ${contacts.phone}\n💬 WhatsApp ${contacts.whatsapp}\n🌐 ${contacts.web}`;
}

function composeMessage(post, contacts) {
  return `${post.en}\n\n${contactBlock(contacts, false)}\n\n────────\n\n${post.he}\n\n${contactBlock(contacts, true)}`;
}

function composeIgCaption(post, contacts) {
  const base = composeMessage(post, contacts);
  return ensureInstagramCaption(base);
}

function groundAssetBase() {
  return publicAssetBase().replace(/\/ai-images$/, "/ground");
}

function pickImage(post, seed) {
  // Prefer real fleet still when available
  if (post.id === 1 || post.theme === "north-private") {
    return `${groundAssetBase()}/IMG_4755-poster.jpg`;
  }
  const hint =
    post.imageHint === "air"
      ? "air ambulance medical flight ECMO repatriation"
      : post.imageHint === "event"
        ? "event medical security paramedic standby"
        : post.theme?.includes("maccabi")
          ? "ground north Tiberias ambulance transfer"
          : "ground ambulance Israel north fleet";
  return (
    pickAiImageUrl({
      theme: post.theme || post.stream,
      title: `${post.title} ${hint}`,
      sourceId: `approved-${post.id}`,
      seed
    }) || listAiImageUrls()[seed % Math.max(listAiImageUrls().length, 1)]?.url
  );
}

function pickPostForSlot(byStream, stream, dayIndex, slotIndex) {
  const pool = byStream[stream] || byStream.ground;
  // Prefer Maccabi posts more often on afternoon ground slot (slot 3 = index 2)
  if (stream === "ground" && slotIndex === 2) {
    const maccabi = pool.filter((p) => String(p.theme).startsWith("maccabi"));
    if (maccabi.length) {
      return maccabi[(dayIndex + slotIndex) % maccabi.length];
    }
  }
  // Alternate event/ground on slot 4 when event pool empty
  if (stream === "event" && (!byStream.event || !byStream.event.length)) {
    return byStream.ground[(dayIndex + slotIndex) % byStream.ground.length];
  }
  return pool[(dayIndex * SLOT_HOURS.length + slotIndex) % pool.length];
}

function buildQueue({ days, startDate, pageId, igUserId, library }) {
  const { posts, contacts } = library;
  const byStream = { air: [], ground: [], event: [] };
  for (const p of posts) {
    (byStream[p.stream] || byStream.ground).push(p);
  }

  const slots = [];
  let air = 0;
  let ground = 0;
  let event = 0;

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const ymd = addDaysYmd(startDate, dayIndex);
    const [y, m, d] = ymd.split("-").map(Number);
    for (let slotIndex = 0; slotIndex < SLOT_HOURS.length; slotIndex++) {
      let stream = SLOT_STREAMS[slotIndex];
      // Every 3rd day, swap afternoon event → ground transfer emphasis
      if (slotIndex === 3 && dayIndex % 3 === 0) stream = "ground";
      const post = pickPostForSlot(byStream, stream, dayIndex, slotIndex);
      const hour = SLOT_HOURS[slotIndex];
      const unix = jerusalemUnix(y, m, d, hour, 0);
      const imageUrl = pickImage(post, dayIndex * 5 + slotIndex);
      const message = composeMessage(post, contacts);
      const caption = composeIgCaption(post, contacts);
      const id = `d${String(dayIndex + 1).padStart(3, "0")}-s${slotIndex + 1}-ap${post.id}`;

      if (post.stream === "air") air += 1;
      else if (post.stream === "event") event += 1;
      else ground += 1;

      slots.push({
        id,
        stream: post.stream,
        format: "photo",
        dayIndex: dayIndex + 1,
        slot: slotIndex + 1,
        localDate: ymd,
        localTime: `${String(hour).padStart(2, "0")}:00`,
        timezone: TZ,
        scheduledUnix: unix,
        scheduledIsoUtc: new Date(unix * 1000).toISOString(),
        sourceId: `approved-${post.id}`,
        approvedPostId: post.id,
        title: post.title,
        titleHe: post.titleHe,
        theme: post.theme,
        imageUrl,
        platforms: {
          facebook: {
            status: "pending",
            message,
            link: contacts.web,
            imageUrl,
            postId: null,
            error: null
          },
          instagram: {
            status: "pending",
            caption,
            imageUrl,
            mediaId: null,
            permalink: null,
            error: null
          }
        }
      });
    }
  }

  return {
    version: 2,
    createdAt: new Date().toISOString(),
    brand: "Israel Air Ambulance",
    approval:
      "Owner-approved posts 1–22 · 5 posts/day × 90 days · ground ambulances + medical flights + events + Maccabi Tiberias · FB+IG · bilingual EN+HE",
    pageId,
    igUserId,
    imageUrl: slots[0]?.imageUrl || null,
    days,
    postsPerDay: SLOT_HOURS.length,
    startDate,
    endDate: addDaysYmd(startDate, days - 1),
    timezone: TZ,
    slotHoursLocal: SLOT_HOURS,
    totals: {
      slots: slots.length,
      air,
      ground,
      event,
      facebook: slots.length,
      instagram: slots.length
    },
    slots
  };
}

async function scheduleFacebook(queue, { token, dryRun, delayMs = 250, maxDaysAhead = 28 }) {
  let ok = 0;
  let fail = 0;
  let skippedWindow = 0;
  const now = Math.floor(Date.now() / 1000);
  const maxUnix = now + maxDaysAhead * 24 * 3600;

  for (const slot of queue.slots) {
    const fb = slot.platforms.facebook;
    if (fb.status === "scheduled" && fb.postId) {
      ok += 1;
      continue;
    }
    if (fb.status === "published" && fb.postId) {
      ok += 1;
      continue;
    }
    if (slot.scheduledUnix > maxUnix) {
      skippedWindow += 1;
      continue;
    }
    if (slot.scheduledUnix < now + 600) {
      fb.status = "pending_due";
      fb.error = "Too soon for FB schedule — publish-due will post";
      continue;
    }
    if (dryRun) {
      fb.status = "dry_run";
      ok += 1;
      continue;
    }
    try {
      const image = fb.imageUrl || slot.imageUrl || queue.imageUrl;
      const res = await graph("POST", `/${queue.pageId}/photos`, {
        token,
        body: {
          url: image,
          caption: fb.message,
          published: "false",
          scheduled_publish_time: String(slot.scheduledUnix)
        }
      });
      fb.status = "scheduled";
      fb.postId = res.id || res.post_id || null;
      fb.error = null;
      ok += 1;
      if (ok % 10 === 0) process.stdout.write(`FB scheduled ${ok}…\n`);
    } catch (e) {
      fb.status = "error";
      fb.error = String(e.message || e);
      fail += 1;
      process.stderr.write(`FB FAIL ${slot.id}: ${fb.error.slice(0, 240)}\n`);
      if (/OAuthException|#190|#200|session has expired/i.test(fb.error)) break;
      if (/scheduled publish time is invalid/i.test(fb.error)) {
        fb.status = "pending";
        fb.error = "Outside Meta schedule window; will retry later";
        break;
      }
    }
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  }
  return { ok, fail, skippedWindow, maxDaysAhead };
}

function summarize(queue) {
  const counts = { facebook: {}, instagram: {} };
  for (const slot of queue.slots) {
    for (const p of ["facebook", "instagram"]) {
      const st = slot.platforms[p].status;
      counts[p][st] = (counts[p][st] || 0) + 1;
    }
  }
  return counts;
}

async function main() {
  const doBuild = hasFlag("--build");
  const doFb = hasFlag("--schedule-facebook");
  const dryRun = process.env.DRY_RUN === "1" || hasFlag("--dry-run");
  const days = Number(process.env.DAYS || arg("--days", 90));
  const startDate =
    process.env.START_DATE || arg("--start", null) || tomorrowJerusalemYmd();
  const pageId = process.env.FACEBOOK_PAGE_ID || "111799957012811";
  const igUserId = process.env.INSTAGRAM_USER_ID || "17841428066112189";

  let queue;
  if (doBuild || !fs.existsSync(QUEUE_PATH)) {
    const library = JSON.parse(fs.readFileSync(APPROVED_PATH, "utf8"));
    if (fs.existsSync(QUEUE_PATH)) {
      fs.copyFileSync(QUEUE_PATH, ARCHIVE_PATH);
      console.log(`Archived previous queue → ${path.basename(ARCHIVE_PATH)}`);
    }
    queue = buildQueue({ days, startDate, pageId, igUserId, library });
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
    console.log(`Wrote ${QUEUE_PATH}`);
    console.log(
      `${queue.totals.slots} slots · ${startDate}→${queue.endDate} · ${SLOT_HOURS.join("/")} ${TZ}`
    );
    console.log(
      `Mix: air=${queue.totals.air} ground=${queue.totals.ground} event=${queue.totals.event}`
    );
  } else {
    queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
    console.log(`Loaded queue (${queue.slots.length} slots)`);
  }

  if (doFb) {
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!token) {
      console.error("Missing FACEBOOK_PAGE_ACCESS_TOKEN");
      process.exit(1);
    }
    console.log(dryRun ? "DRY RUN — Facebook schedule" : "Scheduling Facebook (Meta ~28-day window)…");
    const result = await scheduleFacebook(queue, { token, dryRun });
    queue.facebookSchedule = {
      finishedAt: new Date().toISOString(),
      source: "build-approved-5x90",
      ...result,
      dryRun
    };
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
    console.log("Facebook result:", result);
  }

  console.log("Status summary:", JSON.stringify(summarize(queue), null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
