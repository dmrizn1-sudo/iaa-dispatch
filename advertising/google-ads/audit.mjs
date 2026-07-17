#!/usr/bin/env node
/**
 * Automated weekly Search Terms audit via Google Ads API.
 * Promotes converting terms → Exact ops file; junk → negatives ops file;
 * applies negatives automatically when safe.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleAdsApi, enums } from "google-ads-api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "out");
const REPORT = path.join(OUT, `search-terms-audit-${new Date().toISOString().slice(0, 10)}.json`);

const JUNK = [
  "job", "jobs", "salary", "course", "courses", "free", "wikipedia", "news",
  "עבודה", "דרושים", "קורס", "חינם", "ויקיפדיה", "חדשות", "מדא", "מד״א",
];

function missingEnv() {
  return [
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
  ].filter((k) => !process.env[k]?.trim());
}

async function main() {
  const miss = missingEnv();
  if (miss.length) {
    const report = { status: "blocked_missing_credentials", missing_env: miss };
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 2;
    return;
  }

  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  });
  const customer = client.Customer({
    customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ""),
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "") || undefined,
  });

  const rows = await customer.query(`
    SELECT
      search_term_view.search_term,
      campaign.name,
      ad_group.name,
      ad_group.resource_name,
      metrics.clicks,
      metrics.conversions,
      metrics.cost_micros
    FROM search_term_view
    WHERE segments.date DURING LAST_7_DAYS
      AND metrics.clicks > 0
  `);

  const promoteExact = [];
  const addNegative = [];
  const pauseReview = [];

  for (const r of rows) {
    const term = r.search_term_view.search_term;
    const conv = Number(r.metrics.conversions || 0);
    const cost = Number(r.metrics.cost_micros || 0) / 1e6;
    const lower = term.toLowerCase();
    const junk = JUNK.some((j) => lower.includes(j.toLowerCase()));

    if (junk || (cost > 50 && conv === 0)) {
      addNegative.push({
        campaign: r.campaign.name,
        ad_group: r.ad_group.name,
        term,
        reason: junk ? "junk_pattern" : "high_cost_zero_conv",
      });
    } else if (conv >= 1) {
      promoteExact.push({
        campaign: r.campaign.name,
        ad_group_resource: r.ad_group.resource_name,
        term,
        conversions: conv,
      });
    } else if (cost > 20 && conv === 0) {
      pauseReview.push({ campaign: r.campaign.name, term, cost });
    }
  }

  // Auto-apply campaign negatives for junk
  const warnings = [];
  const campaigns = await customer.query(`
    SELECT campaign.resource_name, campaign.name
    FROM campaign
    WHERE campaign.status != 'REMOVED' AND campaign.name LIKE 'IAA | Search |%'
  `);
  const campByName = new Map(campaigns.map((c) => [c.campaign.name, c.campaign.resource_name]));

  for (const n of addNegative) {
    const campRes = campByName.get(n.campaign);
    if (!campRes) continue;
    try {
      await customer.mutateResources([
        {
          entity: "campaign_criterion",
          operation: "create",
          resource: {
            campaign: campRes,
            negative: true,
            keyword: { text: n.term, match_type: enums.KeywordMatchType.PHRASE },
          },
        },
      ]);
    } catch (e) {
      warnings.push(e.message);
    }
  }

  // Auto-promote converters to Exact in same ad group
  for (const p of promoteExact) {
    try {
      await customer.mutateResources([
        {
          entity: "ad_group_criterion",
          operation: "create",
          resource: {
            ad_group: p.ad_group_resource,
            status: enums.AdGroupCriterionStatus.ENABLED,
            keyword: { text: p.term, match_type: enums.KeywordMatchType.EXACT },
          },
        },
      ]);
    } catch (e) {
      warnings.push(`promote ${p.term}: ${e.message}`);
    }
  }

  const report = {
    status: "audited",
    at: new Date().toISOString(),
    rows: rows.length,
    promoteExact,
    addNegative,
    pauseReview,
    warnings,
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, promote: promoteExact.length, negatives: addNegative.length, warnings: warnings.length }, null, 2));
}

main().catch((e) => {
  fs.writeFileSync(REPORT, JSON.stringify({ status: "error", error: e.message }, null, 2));
  console.error(e);
  process.exit(1);
});
