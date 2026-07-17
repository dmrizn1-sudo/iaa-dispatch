#!/usr/bin/env node
/**
 * Publish a Facebook Page post (and optional Instagram photo post) for Israel Air Ambulance.
 *
 * Required env:
 *   FACEBOOK_PAGE_ID
 *   FACEBOOK_PAGE_ACCESS_TOKEN
 *
 * Optional:
 *   INSTAGRAM_USER_ID
 *   IMAGE_URL          (required for Instagram photo publish)
 *   MESSAGE / CAPTION  or pass --file path/to/post.json
 *   DRY_RUN=1
 *
 * Examples:
 *   FACEBOOK_PAGE_ID=... FACEBOOK_PAGE_ACCESS_TOKEN=... \
 *     MESSAGE="$(head -c 2000 marketing/social/facebook-posts.md)" \
 *     node marketing/tools/publish-facebook.mjs --platform facebook
 */
import fs from "node:fs";
import path from "node:path";

const API = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${API}`;

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? true;
}

function requireEnv(key) {
  const v = process.env[key];
  if (!v) {
    console.error(`Missing env: ${key}`);
    process.exit(1);
  }
  return v;
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
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(u, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const err = json.error || { message: res.statusText, code: res.status };
    throw new Error(JSON.stringify(err, null, 2));
  }
  return json;
}

function loadPayload() {
  const file = arg("--file");
  if (file) {
    const raw = fs.readFileSync(path.resolve(file), "utf8");
    return JSON.parse(raw);
  }
  return {
    platform: arg("--platform", process.env.PLATFORM || "facebook"),
    message: process.env.MESSAGE || "",
    caption: process.env.CAPTION || process.env.MESSAGE || "",
    link: process.env.LINK || "https://ambulancenter.com",
    image_url: process.env.IMAGE_URL || ""
  };
}

async function publishFacebook(pageId, token, { message, link }) {
  const body = { message };
  if (link) body.link = link;
  return graph("POST", `/${pageId}/feed`, { token, body });
}

async function publishInstagramPhoto(igUserId, token, { image_url, caption }) {
  if (!image_url) throw new Error("IMAGE_URL required for Instagram photo publish");
  const container = await graph("POST", `/${igUserId}/media`, {
    token,
    body: { image_url, caption }
  });
  // poll briefly
  for (let i = 0; i < 10; i++) {
    const st = await graph("GET", `/${container.id}`, {
      token,
      query: { fields: "status_code" }
    });
    if (st.status_code === "FINISHED") break;
    if (st.status_code === "ERROR") throw new Error("IG container ERROR");
    await new Promise((r) => setTimeout(r, 2000));
  }
  return graph("POST", `/${igUserId}/media_publish`, {
    token,
    body: { creation_id: container.id }
  });
}

async function main() {
  const pageId = requireEnv("FACEBOOK_PAGE_ID");
  const token = requireEnv("FACEBOOK_PAGE_ACCESS_TOKEN");
  const igUserId = process.env.INSTAGRAM_USER_ID || "";
  const dry = process.env.DRY_RUN === "1" || arg("--dry-run") === true;
  const payload = loadPayload();

  if (!payload.message && !payload.caption) {
    console.error("Provide MESSAGE/CAPTION env or --file post.json");
    process.exit(1);
  }

  console.log("Platform:", payload.platform);
  console.log("Page:", pageId);
  if (dry) {
    console.log("DRY_RUN payload:\n", JSON.stringify(payload, null, 2));
    return;
  }

  const results = {};
  if (payload.platform === "facebook" || payload.platform === "both") {
    results.facebook = await publishFacebook(pageId, token, {
      message: payload.message || payload.caption,
      link: payload.link
    });
    console.log("Facebook OK:", results.facebook);
  }
  if (payload.platform === "instagram" || payload.platform === "both") {
    if (!igUserId) throw new Error("INSTAGRAM_USER_ID required for Instagram");
    results.instagram = await publishInstagramPhoto(igUserId, token, {
      image_url: payload.image_url,
      caption: payload.caption || payload.message
    });
    console.log("Instagram OK:", results.instagram);
  }
}

main().catch((e) => {
  console.error("Publish failed:\n", e.message || e);
  process.exit(1);
});
