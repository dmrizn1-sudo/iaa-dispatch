#!/usr/bin/env node
/**
 * Check Meta token expiry and send push/alerts before it dies.
 *
 * Channels (any combination):
 *   1) ntfy.sh mobile push  — NOTIFY_NTFY_TOPIC (or default iaa-meta-token-alerts)
 *   2) generic webhook      — NOTIFY_WEBHOOK_URL (Make/Zapier → WhatsApp/SMS)
 *   3) GitHub Issue         — GITHUB_TOKEN + GITHUB_REPOSITORY (GitHub app push)
 *
 * Usage:
 *   FACEBOOK_PAGE_ACCESS_TOKEN=EAA... node marketing/tools/check-token-expiry.mjs
 *   ... --notify          # send alerts if within warn windows
 *   ... --force-notify    # always send status push
 *   ... --json            # machine-readable stdout
 *
 * Env:
 *   FACEBOOK_PAGE_ACCESS_TOKEN   required
 *   FACEBOOK_PAGE_ID             default 111799957012811
 *   WARN_DAYS=7,3,1              days-before thresholds (also warns at 6h)
 *   NOTIFY_NTFY_TOPIC            ntfy topic (default: iaa-meta-token-alerts)
 *   NOTIFY_NTFY_SERVER           default https://ntfy.sh
 *   NOTIFY_WEBHOOK_URL           optional POST JSON webhook
 *   GITHUB_TOKEN / GH_TOKEN      for issue upsert
 *   GITHUB_REPOSITORY            owner/repo
 *   DRY_RUN=1
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STATUS_PATH = path.join(ROOT, "data", "token-status.json");
const API = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${API}`;
const PAGE_ID = process.env.FACEBOOK_PAGE_ID || "111799957012811";
const NTFY_SERVER = (process.env.NOTIFY_NTFY_SERVER || "https://ntfy.sh").replace(/\/$/, "");
const NTFY_TOPIC = process.env.NOTIFY_NTFY_TOPIC || "iaa-meta-token-alerts";
const OWNER_WHATSAPP = "053-232-1101";
const OWNER_EMAIL = "david@israelairambulance.com";

function hasFlag(name) {
  return process.argv.includes(name);
}

function parseWarnDays() {
  const raw = process.env.WARN_DAYS || "7,3,1";
  return raw
    .split(",")
    .map((x) => Number(String(x).trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => b - a);
}

async function graphGet(urlPath, token, query = {}) {
  const u = new URL(`${BASE}${urlPath}`);
  for (const [k, v] of Object.entries(query)) {
    if (v != null) u.searchParams.set(k, String(v));
  }
  u.searchParams.set("access_token", token);
  const res = await fetch(u);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(JSON.stringify(json.error || { message: res.statusText }, null, 2));
  }
  return json;
}

/** Prefer Page token when a User token was pasted. */
async function resolveWorkingToken(token) {
  try {
    const page = await graphGet(`/${PAGE_ID}`, token, { fields: "access_token,name" });
    if (page.access_token && page.access_token !== token) {
      return { token: page.access_token, source: "page_from_user", pageName: page.name };
    }
  } catch {
    /* keep original */
  }
  return { token, source: "provided", pageName: null };
}

async function debugToken(inputToken, appToken) {
  const u = new URL(`${BASE}/debug_token`);
  u.searchParams.set("input_token", inputToken);
  u.searchParams.set("access_token", appToken || inputToken);
  const res = await fetch(u);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(JSON.stringify(json.error || { message: res.statusText }, null, 2));
  }
  return json.data || {};
}

function loadPrevStatus() {
  try {
    return JSON.parse(fs.readFileSync(STATUS_PATH, "utf8"));
  } catch {
    return null;
  }
}

function pickWarnLevel(secondsLeft, warnDays) {
  if (secondsLeft == null) return null; // never expires
  if (secondsLeft <= 0) return { level: "expired", label: "EXPIRED" };
  if (secondsLeft <= 6 * 3600) return { level: "6h", label: "under 6 hours" };
  for (const d of warnDays) {
    if (secondsLeft <= d * 86400) return { level: `${d}d`, label: `${d} day(s)` };
  }
  return null;
}

async function notifyNtfy({ title, body, priority, tags }) {
  const url = `${NTFY_SERVER}/${NTFY_TOPIC}`;
  // Fetch Headers only accept ByteString — keep title/tags ASCII; Hebrew goes in body.
  const asciiTitle = String(title || "IAA Meta token alert")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .trim()
    .slice(0, 90) || "IAA Meta token alert";
  const asciiTags = (tags || ["warning", "key"])
    .map((t) => String(t).replace(/[^\w_-]/g, ""))
    .filter(Boolean)
    .join(",");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Title: asciiTitle,
      Priority: String(priority || 4),
      Tags: asciiTags || "warning,key",
      "Content-Type": "text/plain; charset=utf-8"
    },
    body
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ntfy failed ${res.status}: ${t}`);
  }
  return { channel: "ntfy", url };
}

async function notifyWebhook(payload) {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) return null;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`webhook failed ${res.status}: ${t}`);
  }
  return { channel: "webhook", url: url.replace(/^(https?:\/\/[^/]+).*/, "$1/…") };
}

async function upsertGithubIssue({ title, body, labels }) {
  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!ghToken || !repo) return null;

  const headers = {
    Authorization: `Bearer ${ghToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
  const marker = "<!-- iaa-meta-token-expiry -->";
  const listUrl = `https://api.github.com/repos/${repo}/issues?state=open&labels=${encodeURIComponent(labels[0])}&per_page=20`;
  const listRes = await fetch(listUrl, { headers });
  const issues = listRes.ok ? await listRes.json() : [];
  const existing = Array.isArray(issues)
    ? issues.find((i) => String(i.body || "").includes(marker) || String(i.title || "").includes("Meta token"))
    : null;

  const fullBody = `${marker}\n${body}`;
  if (existing) {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues/${existing.number}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ title, body: fullBody, state: "open" })
    });
    if (!res.ok) throw new Error(`GitHub issue update failed: ${await res.text()}`);
    return { channel: "github_issue", number: existing.number, url: existing.html_url, updated: true };
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers,
    body: JSON.stringify({ title, body: fullBody, labels })
  });
  if (!res.ok) throw new Error(`GitHub issue create failed: ${await res.text()}`);
  const created = await res.json();
  return { channel: "github_issue", number: created.number, url: created.html_url, updated: false };
}

function buildMessages(status) {
  const when = status.expiresAtIso || "unknown";
  const left = status.humanLeft || "unknown";
  const heTitle =
    status.warn?.level === "expired"
      ? "⛔ טוקן Meta פג — פרסום נעצר"
      : `⚠️ טוקן Meta עומד לפוג (${status.warn?.label || left})`;
  const enTitle =
    status.warn?.level === "expired"
      ? "Meta token EXPIRED — publishing stopped"
      : `Meta token expiring soon (${status.warn?.label || left})`;

  const heBody = [
    heTitle,
    "",
    `תפוגה: ${when} (UTC)`,
    `נותר: ${left}`,
    `סוג: ${status.tokenType || "?"} · מקור: ${status.tokenSource || "?"}`,
    "",
    "מה לעשות עכשיו:",
    "1) Business Manager → System User → Generate token (לא פג)",
    "2) GitHub → Settings → Secrets → FACEBOOK_PAGE_ACCESS_TOKEN",
    "3) עדכן את הסוד והרץ Action: IAA Social Auto-Publish",
    "",
    `וואטסאפ לתיאום: ${OWNER_WHATSAPP}`,
    `מייל: ${OWNER_EMAIL}`,
    "מדריך: marketing/facebook/CONNECT-HE.md"
  ].join("\n");

  const enBody = [
    enTitle,
    "",
    `Expires: ${when} (UTC)`,
    `Time left: ${left}`,
    `Type: ${status.tokenType || "?"} · source: ${status.tokenSource || "?"}`,
    "",
    "Action:",
    "1) Business Manager → System User → Generate long-lived token",
    "2) GitHub Secret FACEBOOK_PAGE_ACCESS_TOKEN",
    "3) Re-run IAA Social Auto-Publish",
    "",
    `WhatsApp: ${OWNER_WHATSAPP}`,
    "Guide: marketing/facebook/CONNECT-HE.md"
  ].join("\n");

  return { heTitle, enTitle, heBody, enBody, pushBody: `${heBody}\n\n────────\n\n${enBody}` };
}

function humanizeSeconds(sec) {
  if (sec == null) return "does not expire";
  if (sec <= 0) return "expired";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

async function main() {
  const rawToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!rawToken) {
    console.error("Missing FACEBOOK_PAGE_ACCESS_TOKEN");
    process.exit(2);
  }

  const dry = process.env.DRY_RUN === "1" || hasFlag("--dry-run");
  const doNotify = hasFlag("--notify") || hasFlag("--force-notify");
  const force = hasFlag("--force-notify");
  const asJson = hasFlag("--json");
  const warnDays = parseWarnDays();

  const resolved = await resolveWorkingToken(rawToken);
  const dbg = await debugToken(resolved.token, rawToken);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = dbg.expires_at && dbg.expires_at > 0 ? dbg.expires_at : null;
  const secondsLeft = expiresAt == null ? null : expiresAt - now;
  const warn = pickWarnLevel(secondsLeft, warnDays);

  const status = {
    checkedAt: new Date().toISOString(),
    isValid: !!dbg.is_valid,
    tokenType: dbg.type || null,
    tokenSource: resolved.source,
    pageName: resolved.pageName,
    pageId: PAGE_ID,
    appId: dbg.app_id || null,
    scopes: dbg.scopes || [],
    expiresAt,
    expiresAtIso: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
    secondsLeft,
    humanLeft: humanizeSeconds(secondsLeft),
    neverExpires: expiresAt == null,
    warn,
    ntfy: { server: NTFY_SERVER, topic: NTFY_TOPIC, subscribeUrl: `${NTFY_SERVER}/${NTFY_TOPIC}` },
    owner: { whatsapp: OWNER_WHATSAPP, email: OWNER_EMAIL }
  };

  const prev = loadPrevStatus();
  const alreadySentLevel = prev?.lastAlertLevel || null;
  const shouldAlert =
    force ||
    (doNotify &&
      warn &&
      (warn.level !== alreadySentLevel || force || warn.level === "expired" || warn.level === "6h"));

  const notifications = [];
  if (shouldAlert && !dry) {
    const msg = buildMessages(status);
    const priority = warn?.level === "expired" || warn?.level === "6h" ? 5 : warn?.level === "1d" ? 4 : 3;
    try {
      notifications.push(
        await notifyNtfy({
          title: msg.heTitle,
          body: msg.pushBody,
      priority,
      tags: warn?.level === "expired" ? ["rotating_light", "x"] : ["warning", "key"]
    })
      );
    } catch (e) {
      notifications.push({ channel: "ntfy", error: String(e.message || e) });
    }
    try {
      const wh = await notifyWebhook({
        type: "iaa_meta_token_expiry",
        ...status,
        titleHe: msg.heTitle,
        titleEn: msg.enTitle,
        bodyHe: msg.heBody,
        bodyEn: msg.enBody,
        whatsappHint: OWNER_WHATSAPP
      });
      if (wh) notifications.push(wh);
    } catch (e) {
      notifications.push({ channel: "webhook", error: String(e.message || e) });
    }
    try {
      const issue = await upsertGithubIssue({
        title: `[IAA] ${msg.enTitle}`,
        body: msg.pushBody + `\n\nSubscribe for phone push: \`${status.ntfy.subscribeUrl}\``,
        labels: ["meta-token", "automation"]
      });
      if (issue) notifications.push(issue);
    } catch (e) {
      notifications.push({ channel: "github_issue", error: String(e.message || e) });
    }
    status.lastAlertLevel = warn?.level || "forced";
    status.lastAlertAt = new Date().toISOString();
  } else if (prev?.lastAlertLevel && !warn) {
    status.lastAlertLevel = null;
    status.lastAlertAt = prev.lastAlertAt || null;
  } else {
    status.lastAlertLevel = prev?.lastAlertLevel || null;
    status.lastAlertAt = prev?.lastAlertAt || null;
  }

  status.notifications = notifications;
  fs.mkdirSync(path.dirname(STATUS_PATH), { recursive: true });
  fs.writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));

  if (asJson) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log(
      `Token valid=${status.isValid} type=${status.tokenType} expires=${status.expiresAtIso || "never"} left=${status.humanLeft}`
    );
    if (warn) console.log(`WARN level=${warn.level} (${warn.label})`);
    if (shouldAlert) console.log(`Notify attempted → ${notifications.map((n) => n.channel + (n.error ? "(err)" : "")).join(", ") || "none"}`);
    console.log(`Phone push subscribe: ${status.ntfy.subscribeUrl}`);
    console.log(`Wrote ${STATUS_PATH}`);
  }

  // Exit codes for CI: 0 ok, 10 warn, 11 expired/invalid
  if (!status.isValid || (secondsLeft != null && secondsLeft <= 0)) process.exit(11);
  if (warn) process.exit(10);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
