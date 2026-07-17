#!/usr/bin/env node
/**
 * One command: generate → deploy → audit attempt → write final status.
 * No Google Ads Editor. No manual checklist for H/*.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "out");
const ROOT = path.resolve(__dirname, "../..");

function run(cmd, args, allowFail = false) {
  console.log(`\n>>> ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: process.env });
  if (res.status !== 0 && !allowFail) {
    process.exit(res.status || 1);
  }
  return res.status || 0;
}

run("npm", ["run", "ads:generate"]);
const deployStatus = run("npm", ["run", "ads:deploy"], true);
const auditStatus = run("npm", ["run", "ads:audit"], true);

const deployReport = fs.existsSync(path.join(OUT, "deploy-report.json"))
  ? JSON.parse(fs.readFileSync(path.join(OUT, "deploy-report.json"), "utf8"))
  : { status: "missing" };

const final = {
  at: new Date().toISOString(),
  generate: "ok",
  deploy_exit: deployStatus,
  audit_exit: auditStatus,
  deploy: deployReport,
  next:
    deployReport.status === "deployed"
      ? "Live API deploy completed. Set ADS_ENABLE=true and re-run to enable if still paused."
      : "Inject GOOGLE_ADS_* credentials into the environment, then re-run npm run ads:all — zero Editor steps.",
};

fs.writeFileSync(path.join(OUT, "run-all-report.json"), JSON.stringify(final, null, 2));

// Rewrite QA checklist: H/G automated via API when credentials present
const qa = `# QA Checklist — fully automated pipeline

Updated: ${final.at}

## Automated locally (this run)
- [x] Generate keywords/ads/negatives/RSA
- [x] ads:all orchestrator executed
- [${deployReport.status === "deployed" ? "x" : " "}] API deploy to Google Ads
- [${auditStatus === 0 ? "x" : " "}] API search-terms audit

## Deploy status
\`\`\`json
${JSON.stringify({ status: deployReport.status, missing_env: deployReport.missing_env || [], warnings: (deployReport.warnings || []).slice(0, 5) }, null, 2)}
\`\`\`

## What replaces manual Editor (H1–H8)
\`npm run ads:deploy\` creates via API:
conversion actions, shared negatives, campaigns, ad groups, keywords, RSA, call/sitelink/callout assets, geo+language.

## Credentials required once (env/secrets — not Editor clicks)
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_REFRESH_TOKEN
GOOGLE_ADS_CUSTOMER_ID
GOOGLE_ADS_LOGIN_CUSTOMER_ID (optional MCC)
ADS_PHONE / ADS_LANDING_* / ADS_ENABLE

Then: \`npm run ads:all\`
`;
fs.writeFileSync(path.join(OUT, "qa-checklist.md"), qa);
console.log(JSON.stringify(final, null, 2));
if (deployStatus !== 0) process.exitCode = deployStatus;
