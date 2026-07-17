#!/usr/bin/env node
/**
 * Publish due Instagram (and optional Facebook) items from publish-queue-90d.json.
 *
 * Designed for GitHub Actions / cron:
 *   node marketing/tools/publish-due.mjs --instagram
 *   node marketing/tools/publish-due.mjs --instagram --facebook
 *
 * Window: publishes slots whose scheduledUnix is within the last LOOKBACK_MIN
 * minutes and the next AHEAD_MIN minutes (default 90 / 30).
 *
 * Env:
 *   FACEBOOK_PAGE_ID
 *   FACEBOOK_PAGE_ACCESS_TOKEN   (long-lived Page or System User token)
 *   INSTAGRAM_USER_ID
 *   IMAGE_URL                    (fallback public image)
 *   LOOKBACK_MIN=90
 *   AHEAD_MIN=30
 *   DRY_RUN=1
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pickAiImageUrl, listAiImageUrls } from "./ai-image-urls.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const QUEUE_PATH = path.join(ROOT, "data", "publish-queue-90d.json");
const API = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${API}`;

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
    throw new Error(JSON.stringify(json.error || { message: res.statusText }, null, 2));
  }
  return json;
}

async function resolveImage(token, pageId, preferred) {
  if (preferred) return preferred;
  if (process.env.IMAGE_URL) return process.env.IMAGE_URL;
  const ai = listAiImageUrls();
  if (ai.length) return ai[0].url;
  const cover = await graph("GET", `/${pageId}`, {
    token,
    query: { fields: "cover" }
  });
  return cover?.cover?.source || null;
}

async function publishFacebookPhoto(token, pageId, { message, imageUrl, scheduledUnix }) {
  const body = {
    url: imageUrl,
    caption: message
  };
  if (scheduledUnix) {
    body.published = "false";
    body.scheduled_publish_time = String(scheduledUnix);
  } else {
    body.published = "true";
  }
  return graph("POST", `/${pageId}/photos`, { token, body });
}

async function publishInstagram(token, igUserId, { imageUrl, caption }) {
  const container = await graph("POST", `/${igUserId}/media`, {
    token,
    body: { image_url: imageUrl, caption }
  });
  for (let i = 0; i < 20; i++) {
    const st = await graph("GET", `/${container.id}`, {
      token,
      query: { fields: "status_code,status" }
    });
    if (st.status_code === "FINISHED") {
      await new Promise((r) => setTimeout(r, 4000));
      break;
    }
    if (st.status_code === "ERROR") {
      throw new Error(`IG container ERROR: ${JSON.stringify(st)}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  let pub;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      pub = await graph("POST", `/${igUserId}/media_publish`, {
        token,
        body: { creation_id: container.id }
      });
      break;
    } catch (e) {
      if (attempt === 4) throw e;
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
  const media = await graph("GET", `/${pub.id}`, {
    token,
    query: { fields: "id,permalink,timestamp" }
  });
  return media;
}

async function publishFacebookNow(token, pageId, { message, link }) {
  return graph("POST", `/${pageId}/feed`, {
    token,
    body: { message, link: link || "https://ambulancenter.com" }
  });
}

async function main() {
  const doIg = hasFlag("--instagram") || (!hasFlag("--facebook") && !hasFlag("--instagram") && !hasFlag("--schedule-facebook"));
  const doFbPublish = hasFlag("--facebook");
  const doFbSchedule = hasFlag("--schedule-facebook") || hasFlag("--roll-facebook");
  const dry = process.env.DRY_RUN === "1" || hasFlag("--dry-run");
  const lookback = Number(process.env.LOOKBACK_MIN || 90) * 60;
  const ahead = Number(process.env.AHEAD_MIN || 30) * 60;
  const maxDaysAhead = Number(process.env.FB_MAX_DAYS_AHEAD || 25);
  const now = Math.floor(Date.now() / 1000);

  if (!fs.existsSync(QUEUE_PATH)) {
    console.error(`Missing queue: ${QUEUE_PATH}. Run schedule-90-days.mjs --build first.`);
    process.exit(1);
  }

  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token && !dry) {
    console.error("Missing FACEBOOK_PAGE_ACCESS_TOKEN");
    process.exit(1);
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"));
  const pageId = process.env.FACEBOOK_PAGE_ID || queue.pageId;
  const igUserId = process.env.INSTAGRAM_USER_ID || queue.igUserId;
  const imageUrl = token
    ? await resolveImage(token, pageId, queue.imageUrl || process.env.IMAGE_URL)
    : queue.imageUrl || process.env.IMAGE_URL;

  // Rolling Facebook schedule (Meta ~30-day window)
  if (doFbSchedule && token) {
    const maxUnix = now + maxDaysAhead * 24 * 3600;
    let scheduled = 0;
    for (const slot of queue.slots) {
      const fb = slot.platforms.facebook;
      if (fb.status === "scheduled" || fb.status === "published") continue;
      if (slot.scheduledUnix < now + 600 || slot.scheduledUnix > maxUnix) continue;
      if (dry) {
        fb.status = "dry_run_schedule";
        scheduled += 1;
        continue;
      }
      try {
        const img =
          fb.imageUrl ||
          slot.imageUrl ||
          imageUrl ||
          pickAiImageUrl({ title: slot.title || "", sourceId: slot.sourceId || "", seed: slot.dayIndex });
        const res = img
          ? await publishFacebookPhoto(token, pageId, {
              message: fb.message,
              imageUrl: img,
              scheduledUnix: slot.scheduledUnix
            })
          : await graph("POST", `/${pageId}/feed`, {
              token,
              body: {
                message: fb.message,
                link: fb.link || "https://ambulancenter.com",
                published: "false",
                scheduled_publish_time: String(slot.scheduledUnix)
              }
            });
        fb.status = "scheduled";
        fb.postId = res.id || res.post_id || null;
        fb.imageUrl = img || fb.imageUrl;
        fb.error = null;
        scheduled += 1;
        console.log(`FB roll-schedule ${slot.id} → ${fb.postId}${img ? " (photo)" : ""}`);
        await new Promise((r) => setTimeout(r, 300));
      } catch (e) {
        const msg = String(e.message || e);
        if (/scheduled publish time is invalid/i.test(msg)) {
          fb.status = "pending";
          fb.error = "Outside Meta schedule window; will retry later";
          console.warn(`FB window end at ${slot.id}`);
          break;
        }
        fb.status = "error";
        fb.error = msg;
        console.error(`FB schedule fail ${slot.id}:`, msg);
        if (/session has expired|#190/i.test(msg)) break;
      }
    }
    console.log(`FB roll-schedule done: ${scheduled}`);
  }

  const due = queue.slots.filter((s) => {
    const t = s.scheduledUnix;
    return t >= now - lookback && t <= now + ahead;
  });

  console.log(
    `Due slots: ${due.length} (window -${lookback / 60}/+${ahead / 60} min) · IG=${doIg} FB=${doFbPublish} dry=${dry}`
  );

  let published = 0;
  for (const slot of due) {
    if (doFbPublish) {
      const fb = slot.platforms.facebook;
      if (fb.status === "pending" || fb.status === "error" || fb.status === "skipped_too_soon") {
        if (dry) {
          fb.status = "dry_run";
        } else {
          try {
            const res = await publishFacebookNow(token, pageId, {
              message: fb.message,
              link: fb.link
            });
            fb.status = "published";
            fb.postId = res.id;
            fb.error = null;
            published += 1;
            console.log(`FB published ${slot.id} → ${res.id}`);
          } catch (e) {
            fb.status = "error";
            fb.error = String(e.message || e);
            console.error(`FB fail ${slot.id}:`, fb.error);
          }
        }
      }
    }

    if (doIg) {
      const ig = slot.platforms.instagram;
      if (ig.status === "pending" || ig.status === "error") {
        if (dry) {
          ig.status = "dry_run";
        } else {
          try {
            const img =
              ig.imageUrl ||
              slot.imageUrl ||
              imageUrl ||
              pickAiImageUrl({
                title: slot.title || "",
                sourceId: slot.sourceId || "",
                seed: slot.dayIndex
              });
            if (!img) throw new Error("No IMAGE_URL / AI asset for Instagram");
            let caption = ig.caption || "";
            if (caption.length > 2200) {
              caption = caption.split("\n\n#")[0].slice(0, 2190);
            }
            const media = await publishInstagram(token, igUserId, {
              imageUrl: img,
              caption
            });
            ig.status = "published";
            ig.mediaId = media.id;
            ig.permalink = media.permalink || null;
            ig.imageUrl = img;
            ig.error = null;
            published += 1;
            console.log(`IG published ${slot.id} → ${media.permalink || media.id}`);
          } catch (e) {
            ig.status = "error";
            ig.error = String(e.message || e);
            console.error(`IG fail ${slot.id}:`, ig.error);
          }
        }
      }
    }
  }

  queue.lastDueRun = {
    at: new Date().toISOString(),
    due: due.map((s) => s.id),
    published,
    dry
  };
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  console.log(`Done. published=${published}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
