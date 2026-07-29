#!/usr/bin/env node
/**
 * Build a 90-day Google Business Profile post queue (2×/week: Mon + Thu).
 * HE-first captions, short EN below. Manual paste or publish-gbp-due.mjs.
 *
 * Usage:
 *   node marketing/tools/build-gbp-90d.mjs
 *   node marketing/tools/build-gbp-90d.mjs --start 2026-07-30
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "data");
const POSTS_PATH = path.join(DATA, "gbp-posts.json");
const QUEUE_PATH = path.join(DATA, "gbp-queue-90d.json");
const MD_PATH = path.join(ROOT, "google-business", "CALENDAR-90D-HE.md");
const TZ = "Asia/Jerusalem";
const SLOT_HOUR = 10;
/** Mon=1, Thu=4 */
const WEEKDAYS = new Set([1, 4]);
const DAYS = 90;

function parseArgs(argv) {
  const out = { start: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--start") out.start = argv[++i];
  }
  return out;
}

function ymdInTz(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function weekdayInTz(date, timeZone) {
  const w = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[w];
}

function localParts(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value])
  );
  return {
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
    hour: +parts.hour % 24,
    minute: +parts.minute
  };
}

/** Find UTC ISO for Asia/Jerusalem wall clock ymd + hour:00 */
function jerusalemLocalToIso(ymd, hour = 10) {
  let lo = Date.parse(`${ymd}T00:00:00Z`) - 36e5 * 14;
  let hi = Date.parse(`${ymd}T00:00:00Z`) + 36e5 * 14;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const p = localParts(new Date(mid), TZ);
    if (p.ymd < ymd || (p.ymd === ymd && (p.hour < hour || (p.hour === hour && p.minute < 0)))) {
      lo = mid + 1;
    } else if (p.ymd > ymd || p.hour > hour || (p.hour === hour && p.minute > 0)) {
      hi = mid - 1;
    } else {
      return new Date(mid).toISOString();
    }
  }
  return new Date(lo).toISOString();
}

function buildCaption(post) {
  return `${post.he.trim()}\n\n────────\n${post.en.trim()}`;
}

function collectSlotDates(startYmd) {
  const start = new Date(`${startYmd}T12:00:00Z`);
  const end = new Date(start.getTime() + DAYS * 864e5);
  const slots = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 864e5) {
    const d = new Date(t);
    const ymd = ymdInTz(d, TZ);
    if (ymd < startYmd) continue;
    if (WEEKDAYS.has(weekdayInTz(d, TZ))) slots.push(ymd);
  }
  return slots;
}

function main() {
  const args = parseArgs(process.argv);
  const lib = JSON.parse(fs.readFileSync(POSTS_PATH, "utf8"));
  const posts = lib.posts;
  if (!posts?.length) throw new Error("No GBP posts in library");

  const startYmd = args.start || ymdInTz(new Date(), TZ);
  const slotDates = collectSlotDates(startYmd);
  const queue = [];

  for (let i = 0; i < slotDates.length; i++) {
    const post = posts[i % posts.length];
    const ymd = slotDates[i];
    queue.push({
      id: `gbp-${ymd}-${post.id}`,
      scheduledFor: jerusalemLocalToIso(ymd, SLOT_HOUR),
      localDate: ymd,
      localTime: `${String(SLOT_HOUR).padStart(2, "0")}:00`,
      timezone: TZ,
      postId: post.id,
      stream: post.stream,
      theme: post.theme,
      titleHe: post.titleHe,
      languageCode: "he",
      topicType: "STANDARD",
      callToAction: post.cta || "CALL",
      actionUrl:
        post.cta === "LEARN_MORE"
          ? lib.contacts.web
          : post.cta === "WHATSAPP"
            ? "https://wa.me/972532321101"
            : undefined,
      summary: buildCaption(post),
      status: "pending",
      publishedAt: null,
      publishName: null,
      error: null
    });
  }

  const payload = {
    version: 1,
    brand: lib.brand,
    platform: "google-business",
    builtAt: new Date().toISOString(),
    startDate: startYmd,
    endDate: slotDates[slotDates.length - 1] || startYmd,
    cadence: "Mon+Thu 10:00 Asia/Jerusalem",
    contacts: lib.contacts,
    count: queue.length,
    pending: queue.length,
    published: 0,
    items: queue
  };

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(payload, null, 2) + "\n");
  console.log(`Wrote ${queue.length} GBP slots → ${path.relative(process.cwd(), QUEUE_PATH)}`);
  console.log(`Window: ${payload.startDate} → ${payload.endDate} (${payload.cadence})`);

  const lines = [
    "# Google Business — לוח 90 יום",
    `**חלון:** ${payload.startDate} → ${payload.endDate}`,
    `**קצב:** שני + חמישי · 10:00 (ישראל) · ${queue.length} פוסטים`,
    `**ספרייה:** \`marketing/data/gbp-posts.json\``,
    `**תור:** \`marketing/data/gbp-queue-90d.json\``,
    "",
    "פרסום ידני: העתיקו את `summary` ל־Google Business → Create post.",
    "פרסום API: `node marketing/tools/publish-gbp-due.mjs` (אחרי חיבור OAuth).",
    "",
    "| תאריך | מזהה | נושא | סטטוס |",
    "|--------|------|------|--------|"
  ];
  for (const item of queue) {
    lines.push(`| ${item.localDate} | ${item.postId} | ${item.titleHe} | ${item.status} |`);
  }
  lines.push("", "## 3 הפוסטים הבאים (העתק-הדבק)", "");
  for (const item of queue.slice(0, 3)) {
    lines.push(`### ${item.localDate} · ${item.postId} — ${item.titleHe}`, "", "```", item.summary, "```", "");
  }
  fs.mkdirSync(path.dirname(MD_PATH), { recursive: true });
  fs.writeFileSync(MD_PATH, lines.join("\n") + "\n");
  console.log(`Wrote calendar → ${path.relative(process.cwd(), MD_PATH)}`);
}

main();
