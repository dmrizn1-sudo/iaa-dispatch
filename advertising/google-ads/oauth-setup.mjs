#!/usr/bin/env node
/**
 * One-time OAuth helper — opens Google consent and prints REFRESH_TOKEN.
 *
 * Needs first:
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 *
 * Usage:
 *   node advertising/google-ads/oauth-setup.mjs
 */
import http from "node:http";
import { URL } from "node:url";

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;
const PORT = Number(process.env.OAUTH_PORT || 3456);
const REDIRECT = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/adwords";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(`
חסרים GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET.

1) Google Cloud Console → APIs & Services → Credentials
2) Create OAuth client (Desktop app או Web עם redirect:
   ${REDIRECT})
3) העתק Client ID + Secret ל-env והרץ שוב:
   export GOOGLE_ADS_CLIENT_ID="..."
   export GOOGLE_ADS_CLIENT_SECRET="..."
   node advertising/google-ads/oauth-setup.mjs
`);
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (u.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const code = u.searchParams.get("code");
    if (!code) throw new Error("No code in callback");

    const body = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(json));

    const html = `<h1>OK — אפשר לסגור את החלון</h1>
<pre>GOOGLE_ADS_REFRESH_TOKEN=${json.refresh_token || "(missing — נסה שוב עם prompt=consent)"}</pre>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);

    console.log("\n===== שמור ב-Secrets / env =====");
    console.log(`GOOGLE_ADS_REFRESH_TOKEN=${json.refresh_token}`);
    console.log("================================\n");
    setTimeout(() => process.exit(0), 500);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(String(e.message || e));
    console.error(e);
    process.exit(1);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("\nפתח בדפדפן והתחבר עם חשבון Google Ads:\n");
  console.log(authUrl.toString());
  console.log(`\nממתין ל-callback על ${REDIRECT} ...\n`);
});
