#!/usr/bin/env node
/**
 * Build + Facebook-schedule a 90-day queue from owner-approved posts 1–22.
 * 5 posts/day (Asia/Jerusalem): mix of ground ambulances + medical flights.
 *
 * Location policy: EVERY caption ends with 📍 location at the bottom
 *   - Ground/event: rotating IL hospitals (עפולה, רמב״ם, פוריה, זיו…)
 *   - Air: rotating world routes (דובאי→ישראל, תאילנד→ישראל, ארה״ב→ישראל…)
 *
 * Usage:
 *   node marketing/tools/build-approved-5x90.mjs --build
 *   node marketing/tools/build-approved-5x90.mjs --build --schedule-facebook
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pickAiImageUrl, publicAssetBase, listAiImageUrls } from "./ai-image-urls.mjs";
import { ensureInstagramCaption, buildHashtagBlock } from "./ig-hashtags.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const APPROVED_PATH = path.join(DATA, "approved-posts.json");
const GROUND_PATH = path.join(DATA, "ground-posts.json");
const GEO_PATH = path.join(DATA, "geo.json");
const QUEUE_PATH = path.join(DATA, "publish-queue-90d.json");
const API = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${API}`;
const TZ = "Asia/Jerusalem";
/** 5 slots/day — air + ground + mix */
const SLOT_HOURS = [10, 12, 14, 16, 18];
/** Daily stream mix: air, ground, ground/maccabi, event|ground, air */
const SLOT_STREAMS = ["air", "ground", "ground", "event", "air"];

/** Hebrew names for international air routes */
const COUNTRY_HE = {
  US: "ארה״ב",
  CA: "קנדה",
  GB: "בריטניה",
  FR: "צרפת",
  DE: "גרמניה",
  CH: "שווייץ",
  IT: "איטליה",
  ES: "ספרד",
  PT: "פורטוגל",
  NL: "הולנד",
  BE: "בלגיה",
  AT: "אוסטריה",
  IE: "אירלנד",
  GR: "יוון",
  CY: "קפריסין",
  PL: "פולין",
  CZ: "צ׳כיה",
  HU: "הונגריה",
  RO: "רומניה",
  BG: "בולגריה",
  HR: "קרואטיה",
  RS: "סרביה",
  SI: "סלובניה",
  ME: "מונטנגרו",
  GE: "גאורגיה",
  AE: "איחוד האמירויות",
  TH: "תאילנד",
  JP: "יפן",
  SG: "סינגפור",
  AU: "אוסטרליה",
  ZA: "דרום אפריקה",
  MA: "מרוקו"
};

const CITY_HE = {
  Dubai: "דובאי",
  "Abu Dhabi": "אבו דאבי",
  Bangkok: "בנגקוק",
  Phuket: "פוקט",
  "New York": "ניו יורק",
  Miami: "מיאמי",
  "Los Angeles": "לוס אנג׳לס",
  Boston: "בוסטון",
  Chicago: "שיקגו",
  London: "לונדון",
  Manchester: "מנצ׳סטר",
  Paris: "פריז",
  Nice: "ניס",
  Berlin: "ברלין",
  Frankfurt: "פרנקפורט",
  Munich: "מינכן",
  Zurich: "ציריך",
  Geneva: "ז׳נבה",
  Vienna: "וינה",
  Amsterdam: "אמסטרדם",
  Rome: "רומא",
  Milan: "מילאנו",
  Athens: "אתונה",
  Rhodes: "רודוס",
  Larnaca: "לרנקה",
  Toronto: "טורונטו",
  Montreal: "מונטריאול",
  Singapore: "סינגפור",
  Tokyo: "טוקיו",
  Sydney: "סידני",
  Johannesburg: "יוהנסבורג",
  Casablanca: "קזבלנקה",
  Prague: "פראג",
  Budapest: "בודפשט",
  Warsaw: "ורשה",
  "Tel Aviv": "תל אביב"
};

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

function loadIlPlaces() {
  try {
    const g = JSON.parse(fs.readFileSync(GROUND_PATH, "utf8"));
    return g.places || [];
  } catch {
    return [];
  }
}

function loadAirRoutes() {
  const geo = JSON.parse(fs.readFileSync(GEO_PATH, "utf8"));
  const countryName = Object.fromEntries(
    (geo.priorityCountries || []).map((c) => [c.code, c.name])
  );
  // Prefer high-variety destinations (city → Israel)
  const preferred = [
    "Dubai",
    "Bangkok",
    "Phuket",
    "New York",
    "Miami",
    "Los Angeles",
    "London",
    "Paris",
    "Berlin",
    "Frankfurt",
    "Zurich",
    "Geneva",
    "Rome",
    "Milan",
    "Athens",
    "Rhodes",
    "Larnaca",
    "Toronto",
    "Montreal",
    "Amsterdam",
    "Vienna",
    "Singapore",
    "Tokyo",
    "Sydney",
    "Johannesburg",
    "Abu Dhabi",
    "Nice",
    "Munich",
    "Prague",
    "Budapest",
    "Warsaw",
    "Casablanca",
    "Boston",
    "Chicago"
  ];
  const byName = Object.fromEntries((geo.cities || []).map((c) => [c.name, c]));
  const routes = [];
  for (const name of preferred) {
    const c = byName[name];
    if (!c || c.country === "IL") continue;
    const countryEn = countryName[c.country] || c.country;
    const cityHe = CITY_HE[name] || name;
    const countryHe = COUNTRY_HE[c.country] || countryEn;
    routes.push({
      cityEn: name,
      cityHe,
      countryCode: c.country,
      countryEn,
      countryHe,
      lineEn: `${name} → Israel`,
      lineHe: `${cityHe} → ישראל`,
      countryLineEn: `${countryEn} → Israel`,
      countryLineHe: `${countryHe} → ישראל`,
      bottomEn: `📍 ${name} → Israel · ${countryEn}`,
      bottomHe: `📍 ${cityHe} → ישראל · ${countryHe}`
    });
  }
  // Also add country-level variety lines for US/TH/AE emphasis
  const countryExtras = [
    {
      cityEn: "United States",
      cityHe: "ארה״ב",
      countryCode: "US",
      countryEn: "United States",
      countryHe: "ארה״ב",
      lineEn: "USA → Israel",
      lineHe: "ארה״ב → ישראל",
      countryLineEn: "USA → Israel",
      countryLineHe: "ארה״ב → ישראל",
      bottomEn: "📍 USA → Israel",
      bottomHe: "📍 ארה״ב → ישראל"
    },
    {
      cityEn: "Thailand",
      cityHe: "תאילנד",
      countryCode: "TH",
      countryEn: "Thailand",
      countryHe: "תאילנד",
      lineEn: "Thailand → Israel",
      lineHe: "תאילנד → ישראל",
      countryLineEn: "Thailand → Israel",
      countryLineHe: "תאילנד → ישראל",
      bottomEn: "📍 Thailand → Israel",
      bottomHe: "📍 תאילנד → ישראל"
    }
  ];
  return [...routes, ...countryExtras];
}

function pickLocation(stream, seed, post) {
  const places = loadIlPlaces();
  if (stream === "air") {
    const routes = loadAirRoutes();
    return { type: "air", ...(routes[seed % routes.length] || routes[0]) };
  }
  // Maccabi posts stay Tiberias-focused at bottom
  if (String(post?.theme || "").startsWith("maccabi")) {
    const tib = places.find((p) => p.id === "poriya") || places[0];
    return {
      type: "ground",
      place: tib,
      bottomEn: `📍 ${tib.nameEn} · ${tib.cityEn}`,
      bottomHe: `📍 ${tib.nameHe} · ${tib.cityHe}`
    };
  }
  const place = places[seed % Math.max(places.length, 1)] || {
    nameEn: "Northern Israel",
    nameHe: "הצפון",
    cityEn: "North",
    cityHe: "הצפון"
  };
  return {
    type: "ground",
    place,
    bottomEn: `📍 ${place.nameEn} · ${place.cityEn}`,
    bottomHe: `📍 ${place.nameHe} · ${place.cityHe}`
  };
}

/**
 * Location ALWAYS last (bottom of ad) — after contacts.
 * Air posts get a route headline (international medical flight → Israel).
 * Copy must read as medical-flight service only — never as a hiring/דרושים ad.
 * Hashtags appended after location (IG discovery + FB search).
 */
function composeMessage(post, contacts, location, { withHashtags = true, seed = 0 } = {}) {
  const airLeadEn =
    location?.type === "air"
      ? `International medical flight: ${location.lineEn}\n\n`
      : "";
  const airLeadHe =
    location?.type === "air"
      ? `הטסה רפואית בינלאומית: ${location.lineHe}\n\n`
      : "";
  const bottom = `${location?.bottomHe || ""}\n${location?.bottomEn || ""}`.trim();

  let msg =
    `${airLeadEn}${post.en}\n\n${contactBlock(contacts, false)}\n\n` +
    `────────\n\n` +
    `${airLeadHe}${post.he}\n\n${contactBlock(contacts, true)}\n\n` +
    `${bottom}`;

  if (withHashtags) {
    const tags = buildHashtagBlock({
      stream: post.stream,
      theme: post.theme,
      location,
      seed
    });
    msg = `${msg}\n\n${tags}`;
  }
  return msg;
}

function composeIgCaption(post, contacts, location, seed = 0) {
  // Body without duplicate tags; ensureInstagramCaption rebuilds contextual tags
  const body = composeMessage(post, contacts, location, { withHashtags: false, seed });
  return ensureInstagramCaption(body, {
    context: {
      stream: post.stream,
      theme: post.theme,
      location,
      seed
    }
  });
}

function groundAssetBase() {
  return publicAssetBase().replace(/\/ai-images$/, "/ground");
}

function pickImage(post, seed, location) {
  // Prefer real fleet still when available
  if (post.id === 1 || post.theme === "north-private") {
    return `${groundAssetBase()}/IMG_4755-poster.jpg`;
  }
  const routeHint =
    location?.type === "air"
      ? `${location.cityEn || ""} ${location.countryEn || ""} medical flight`
      : "";
  const hint =
    post.imageHint === "air"
      ? `air ambulance medical flight ECMO repatriation ${routeHint}`
      : post.imageHint === "event"
        ? "event medical security paramedic standby"
        : post.theme?.includes("maccabi")
          ? "ground north Tiberias ambulance transfer"
          : `ground ambulance Israel north fleet ${location?.place?.cityEn || ""}`;
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
  let ilPlaceCursor = 0;
  let airRouteCursor = 0;
  const airRoutesSeen = new Set();

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
      const seed = dayIndex * 5 + slotIndex;
      // Independent cursors so every IL hospital / world route appears (not stuck on seed%N)
      let locSeed;
      if (stream === "air") {
        locSeed = airRouteCursor++;
      } else if (String(post?.theme || "").startsWith("maccabi")) {
        locSeed = 0; // pickLocation forces Tiberias/Poriya for Maccabi
      } else {
        locSeed = ilPlaceCursor++;
      }
      const location = pickLocation(stream, locSeed, post);
      if (location.type === "air") airRoutesSeen.add(location.lineEn);
      const imageUrl = pickImage(post, seed, location);
      const message = composeMessage(post, contacts, location, { withHashtags: true, seed });
      const caption = composeIgCaption(post, contacts, location, seed);
      const id = `d${String(dayIndex + 1).padStart(3, "0")}-s${slotIndex + 1}-ap${post.id}`;

      if (post.stream === "air") air += 1;
      else if (post.stream === "event") event += 1;
      else ground += 1;

      const titleEn =
        location.type === "air"
          ? `${post.title} · ${location.lineEn}`
          : `${post.title} · ${location.place?.cityEn || ""}`.trim();
      const titleHe =
        location.type === "air"
          ? `${post.titleHe} · ${location.lineHe}`
          : `${post.titleHe} · ${location.place?.cityHe || ""}`.trim();

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
        title: titleEn,
        titleHe,
        theme: post.theme,
        location: {
          bottomEn: location.bottomEn,
          bottomHe: location.bottomHe,
          ...(location.type === "air"
            ? {
                type: "air",
                routeEn: location.lineEn,
                routeHe: location.lineHe,
                city: location.cityEn,
                cityHe: location.cityHe,
                country: location.countryEn,
                countryHe: location.countryHe,
                countryCode: location.countryCode
              }
            : {
                type: "ground",
                placeId: location.place?.id,
                nameEn: location.place?.nameEn,
                nameHe: location.place?.nameHe,
                cityEn: location.place?.cityEn,
                cityHe: location.place?.cityHe
              })
        },
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
    version: 3,
    createdAt: new Date().toISOString(),
    brand: "Israel Air Ambulance",
    approval:
      "Owner-approved posts 1–22 · 5/day × 90 · location ALWAYS at bottom · rotating world air routes + IL hospitals · FB+IG · EN+HE",
    pageId,
    igUserId,
    imageUrl: slots[0]?.imageUrl || null,
    days,
    postsPerDay: SLOT_HOURS.length,
    startDate,
    endDate: addDaysYmd(startDate, days - 1),
    timezone: TZ,
    slotHoursLocal: SLOT_HOURS,
    locationPolicy: "bottom-of-caption",
    totals: {
      slots: slots.length,
      air,
      ground,
      event,
      uniqueAirRoutes: airRoutesSeen.size,
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
      const archive = `/tmp/iaa-queue-archive/publish-queue-90d.prev-${Date.now()}.json`;
      fs.mkdirSync("/tmp/iaa-queue-archive", { recursive: true });
      fs.copyFileSync(QUEUE_PATH, archive);
      console.log(`Archived previous queue → ${archive}`);
    }
    queue = buildQueue({ days, startDate, pageId, igUserId, library });
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
    console.log(`Wrote ${QUEUE_PATH}`);
    console.log(
      `${queue.totals.slots} slots · ${startDate}→${queue.endDate} · ${SLOT_HOURS.join("/")} ${TZ}`
    );
    console.log(
      `Mix: air=${queue.totals.air} ground=${queue.totals.ground} event=${queue.totals.event} · unique air routes=${queue.totals.uniqueAirRoutes}`
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
