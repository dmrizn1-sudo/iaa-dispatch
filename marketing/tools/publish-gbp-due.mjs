#!/usr/bin/env node
/**
 * Publish due Google Business Profile local posts from gbp-queue-90d.json.
 *
 * Requires (env or GitHub secrets):
 *   GOOGLE_BUSINESS_ACCESS_TOKEN   — OAuth access token (business.manage)
 *   GOOGLE_BUSINESS_ACCOUNT_ID     — accounts/{id} numeric id (or full name)
 *   GOOGLE_BUSINESS_LOCATION_ID    — locations/{id} numeric id (or full name)
 *
 * Optional:
 *   GOOGLE_BUSINESS_REFRESH_TOKEN + GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET
 *     → auto-refresh access token before publish
 *
 * Usage:
 *   node marketing/tools/publish-gbp-due.mjs
 *   node marketing/tools/publish-gbp-due.mjs --dry-run
 *   node marketing/tools/publish-gbp-due.mjs --force-next
 *
 * Docs: marketing/google-business/API-CONNECT-HE.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const QUEUE_PATH = path.join(ROOT, "data", "gbp-queue-90d.json");
const API = "https://mybusiness.googleapis.com/v4";

function parseArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
    forceNext: argv.includes("--force-next"),
    limit: (() => {
      const i = argv.indexOf("--limit");
      return i >= 0 ? Math.max(1, Number(argv[i + 1]) || 1) : 5;
    })()
  };
}

function normalizeResource(kind, value) {
  if (!value) return null;
  const v = String(value).trim();
  if (v.startsWith("accounts/") || v.startsWith("locations/")) return v;
  return kind === "account" ? `accounts/${v}` : `locations/${v}`;
}

async function refreshAccessToken() {
  const refresh = process.env.GOOGLE_BUSINESS_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!refresh || !clientId || !clientSecret) return null;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refresh,
    grant_type: "refresh_token"
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function getAccessToken() {
  let token = process.env.GOOGLE_BUSINESS_ACCESS_TOKEN;
  if (!token) token = await refreshAccessToken();
  if (!token) {
    throw new Error(
      "Missing GOOGLE_BUSINESS_ACCESS_TOKEN (or refresh trio). See marketing/google-business/API-CONNECT-HE.md"
    );
  }
  return token;
}

async function createLocalPost(parent, post, token) {
  const url = `${API}/${parent}/localPosts`;
  const payload = {
    languageCode: post.languageCode || "he",
    summary: post.summary.slice(0, 1500),
    topicType: post.topicType || "STANDARD",
    callToAction: {
      actionType: post.callToAction || "CALL",
      ...(post.actionUrl && post.callToAction !== "CALL" ? { url: post.actionUrl } : {})
    }
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || JSON.stringify(json);
    throw new Error(`GBP create failed (${res.status}): ${msg}`);
  }
  return json;
}

function loadQueue() {
  if (!fs.existsSync(QUEUE_PATH)) {
    throw new Error(`Queue missing. Run: node marketing/tools/build-gbp-90d.mjs`);
  }
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
}

function saveQueue(data) {
  data.pending = data.items.filter((i) => i.status === "pending").length;
  data.published = data.items.filter((i) => i.status === "published").length;
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(data, null, 2) + "\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const account = normalizeResource("account", process.env.GOOGLE_BUSINESS_ACCOUNT_ID);
  const location = normalizeResource("location", process.env.GOOGLE_BUSINESS_LOCATION_ID);
  const locPart = location
    ? location.startsWith("locations/")
      ? location
      : `locations/${location}`
    : "locations/<LOCATION_ID>";
  const parentNorm = `${account || "accounts/<ACCOUNT_ID>"}/${locPart}`;

  const data = loadQueue();
  const now = Date.now();
  let due = data.items.filter((i) => i.status === "pending" && Date.parse(i.scheduledFor) <= now);
  if (args.forceNext && due.length === 0) {
    const next = data.items.find((i) => i.status === "pending");
    if (next) due = [next];
  }
  due = due.slice(0, args.limit);

  if (!due.length) {
    console.log("No due GBP posts.");
    return;
  }

  console.log(`Due: ${due.length} · parent=${parentNorm}${args.dryRun ? " · DRY RUN" : ""}`);
  if (args.dryRun) {
    for (const item of due) {
      console.log(`- ${item.localDate} ${item.postId}: ${item.titleHe}`);
      console.log(item.summary.slice(0, 120).replace(/\n/g, " ") + "…");
    }
    return;
  }

  if (!account || !location) {
    throw new Error("Set GOOGLE_BUSINESS_ACCOUNT_ID and GOOGLE_BUSINESS_LOCATION_ID");
  }

  const token = await getAccessToken();
  for (const item of due) {
    try {
      const created = await createLocalPost(parentNorm, item, token);
      item.status = "published";
      item.publishedAt = new Date().toISOString();
      item.publishName = created.name || null;
      item.error = null;
      console.log(`Published ${item.id} → ${item.publishName || "ok"}`);
    } catch (err) {
      item.status = "error";
      item.error = String(err.message || err);
      console.error(`FAILED ${item.id}: ${item.error}`);
    }
  }
  saveQueue(data);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
