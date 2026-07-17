#!/usr/bin/env node
/**
 * Build + execute a 90-day bilingual social schedule:
 *   2 posts/day × Facebook + Instagram
 *   Default times (Asia/Jerusalem): 10:00 and 18:00
 *
 * Facebook: can schedule via Graph API now (published=false + scheduled_publish_time).
 * Instagram: no native schedule API — writes a queue consumed by
 *   `publish-due.mjs` (GitHub Action / cron).
 *
 * Usage:
 *   node marketing/tools/schedule-90-days.mjs --build
 *   node marketing/tools/schedule-90-days.mjs --schedule-facebook
 *   node marketing/tools/schedule-90-days.mjs --build --schedule-facebook
 *
 * Env:
 *   FACEBOOK_PAGE_ID
 *   FACEBOOK_PAGE_ACCESS_TOKEN
 *   INSTAGRAM_USER_ID (optional, stored in queue)
 *   IMAGE_URL (public image for IG; defaults to page cover fetch)
 *   DAYS=90
 *   POSTS_PER_DAY=2
 *   START_DATE=YYYY-MM-DD (default: tomorrow in Asia/Jerusalem)
 *   DRY_RUN=1
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const QUEUE_PATH = path.join(DATA, "publish-queue-90d.json");
const API = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${API}`;
const TZ = "Asia/Jerusalem";
const SLOT_HOURS = [10, 18]; // local Israel time

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? true;
}

function hasFlag(name) {
  return process.argv.includes(name);
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
      Object.fromEntries(
        Object.entries(body).filter(([, v]) => v != null && v !== "")
      )
    ).toString();
  }
  const res = await fetch(u, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const err = json.error || { message: res.statusText, code: res.status };
    throw new Error(JSON.stringify(err, null, 2));
  }
  return json;
}

/** Local wall-time in Asia/Jerusalem → UTC unix seconds */
function jerusalemUnix(y, m, d, hour, minute = 0) {
  // Iterate to resolve offset (IST/IDT)
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
  const now = new Date();
  // current date in Jerusalem
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now); // YYYY-MM-DD
  const [y, m, d] = parts.split("-").map(Number);
  const utcNoon = Date.UTC(y, m - 1, d, 12, 0, 0);
  const next = new Date(utcNoon + 24 * 3600 * 1000);
  const np = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(next);
  return np;
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

function loadLibrary() {
  const { posts, brand } = JSON.parse(
    fs.readFileSync(path.join(DATA, "posts.json"), "utf8")
  );
  const feed = posts.filter((p) => p.type === "feed");
  const carousels = posts.filter((p) => p.type === "carousel");
  if (!feed.length) throw new Error("No feed posts in posts.json");
  return { feed, carousels, brand: brand || {} };
}

function pickPost(library, dayIndex, slotIndex) {
  const { feed, carousels } = library;
  // Morning: sequential feed; Evening: offset + half cycle, mix carousel captions every 5th evening
  if (slotIndex === 1 && dayIndex % 5 === 4 && carousels.length) {
    const c = carousels[Math.floor(dayIndex / 5) % carousels.length];
    return {
      sourceId: c.id,
      title: c.title,
      titleHe: c.titleHe || "",
      facebook: c.copy.facebook,
      instagram: c.copy.instagram
    };
  }
  const offset = slotIndex === 0 ? 0 : Math.floor(feed.length / 2);
  const p = feed[(dayIndex + offset) % feed.length];
  return {
    sourceId: p.id,
    title: p.title,
    titleHe: p.titleHe || "",
    facebook: p.copy.facebook,
    instagram: p.copy.instagram
  };
}

function buildQueue({ days, postsPerDay, startDate, pageId, igUserId, imageUrl }) {
  const library = loadLibrary();
  const slots = [];
  const hours = SLOT_HOURS.slice(0, postsPerDay);

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const ymd = addDaysYmd(startDate, dayIndex);
    const [y, m, d] = ymd.split("-").map(Number);
    for (let slotIndex = 0; slotIndex < hours.length; slotIndex++) {
      const hour = hours[slotIndex];
      const unix = jerusalemUnix(y, m, d, hour, 0);
      const picked = pickPost(library, dayIndex, slotIndex);
      const id = `d${String(dayIndex + 1).padStart(3, "0")}-s${slotIndex + 1}-${picked.sourceId}`;
      slots.push({
        id,
        dayIndex: dayIndex + 1,
        slot: slotIndex + 1,
        localDate: ymd,
        localTime: `${String(hour).padStart(2, "0")}:00`,
        timezone: TZ,
        scheduledUnix: unix,
        scheduledIsoUtc: new Date(unix * 1000).toISOString(),
        sourceId: picked.sourceId,
        title: picked.title,
        titleHe: picked.titleHe,
        platforms: {
          facebook: {
            status: "pending",
            message: picked.facebook,
            link: "https://ambulancenter.com",
            postId: null,
            error: null
          },
          instagram: {
            status: "pending",
            caption: picked.instagram,
            imageUrl: imageUrl || null,
            mediaId: null,
            permalink: null,
            error: null
          }
        }
      });
    }
  }

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    brand: "Israel Air Ambulance",
    approval:
      "Pre-approved by owner for 90 days · 2 posts/day · Facebook + Instagram · bilingual EN+HE",
    pageId: pageId || process.env.FACEBOOK_PAGE_ID || "111799957012811",
    igUserId: igUserId || process.env.INSTAGRAM_USER_ID || "17841428066112189",
    imageUrl: imageUrl || process.env.IMAGE_URL || null,
    days,
    postsPerDay,
    startDate,
    timezone: TZ,
    slotHoursLocal: hours,
    totals: {
      slots: slots.length,
      facebook: slots.length,
      instagram: slots.length
    },
    slots
  };
}

async function resolveImageUrl(token, pageId, existing) {
  if (existing) return existing;
  if (process.env.IMAGE_URL) return process.env.IMAGE_URL;
  try {
    const cover = await graph("GET", `/${pageId}`, {
      token,
      query: { fields: "cover" }
    });
    return cover?.cover?.source || null;
  } catch {
    return null;
  }
}

async function scheduleFacebook(queue, { token, dryRun, delayMs = 350, maxDaysAhead = 25 }) {
  let ok = 0;
  let fail = 0;
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
    // Meta Page API typically allows ~30 days ahead — keep a safety buffer
    if (slot.scheduledUnix > maxUnix) {
      if (fb.status === "error" && /scheduled publish time is invalid/i.test(fb.error || "")) {
        fb.status = "pending";
        fb.error = null;
      }
      continue;
    }
    if (slot.scheduledUnix < now + 600) {
      fb.status = "skipped_too_soon";
      fb.error = "Too soon (<10 min) for FB schedule API — use publish-due for immediate";
      continue;
    }
    if (dryRun) {
      fb.status = "dry_run";
      ok += 1;
      continue;
    }
    try {
      const res = await graph("POST", `/${queue.pageId}/feed`, {
        token,
        body: {
          message: fb.message,
          link: fb.link,
          published: "false",
          scheduled_publish_time: String(slot.scheduledUnix)
        }
      });
      fb.status = "scheduled";
      fb.postId = res.id;
      fb.error = null;
      ok += 1;
      process.stdout.write(`FB scheduled ${slot.id} → ${res.id}\n`);
    } catch (e) {
      fb.status = "error";
      fb.error = String(e.message || e);
      fail += 1;
      process.stderr.write(`FB FAIL ${slot.id}: ${fb.error}\n`);
      if (/OAuthException|#190|#200|session has expired/i.test(fb.error)) {
        break;
      }
      // Invalid time usually means outside Meta window — stop pushing farther dates
      if (/scheduled publish time is invalid/i.test(fb.error)) {
        fb.status = "pending";
        fb.error = "Outside Meta schedule window; will retry later";
        break;
      }
    }
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  }
  return { ok, fail, maxDaysAhead };
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
  const doBuild = hasFlag("--build") || !hasFlag("--schedule-facebook");
  const doFb = hasFlag("--schedule-facebook");
  const dryRun = process.env.DRY_RUN === "1" || hasFlag("--dry-run");
  const days = Number(process.env.DAYS || arg("--days", 90));
  const postsPerDay = Number(process.env.POSTS_PER_DAY || arg("--posts-per-day", 2));
  const startDate =
    process.env.START_DATE || arg("--start", null) || tomorrowJerusalemYmd();
  const pageId = process.env.FACEBOOK_PAGE_ID || "111799957012811";
  const igUserId = process.env.INSTAGRAM_USER_ID || "17841428066112189";

  let queue;
  if (doBuild || !fs.existsSync(QUEUE_PATH)) {
    let imageUrl = process.env.IMAGE_URL || null;
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (token && !imageUrl) {
      imageUrl = await resolveImageUrl(token, pageId, null);
    }
    queue = buildQueue({
      days,
      postsPerDay,
      startDate,
      pageId,
      igUserId,
      imageUrl
    });
    fs.mkdirSync(DATA, { recursive: true });
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
    console.log(`Wrote queue: ${QUEUE_PATH}`);
    console.log(
      `Slots: ${queue.slots.length} · ${startDate} → ${addDaysYmd(startDate, days - 1)} · ${postsPerDay}/day @ ${SLOT_HOURS.join(", ")} ${TZ}`
    );
  } else {
    queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
    console.log(`Loaded existing queue: ${QUEUE_PATH} (${queue.slots.length} slots)`);
  }

  if (doFb) {
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!token) {
      console.error("Missing FACEBOOK_PAGE_ACCESS_TOKEN");
      process.exit(1);
    }
    // refresh image urls onto IG side of queue for later
    const imageUrl = await resolveImageUrl(token, queue.pageId, queue.imageUrl);
    if (imageUrl) {
      queue.imageUrl = imageUrl;
      for (const s of queue.slots) {
        if (!s.platforms.instagram.imageUrl) {
          s.platforms.instagram.imageUrl = imageUrl;
        }
      }
    }
    console.log(dryRun ? "DRY RUN — Facebook schedule" : "Scheduling Facebook…");
    const result = await scheduleFacebook(queue, { token, dryRun });
    queue.facebookSchedule = {
      finishedAt: new Date().toISOString(),
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
