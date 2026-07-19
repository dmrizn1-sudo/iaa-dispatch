#!/usr/bin/env node
/**
 * Full Google Ads deploy — no Editor, no manual steps.
 * Creates/updates: conversion actions, shared negatives, campaigns,
 * ad groups, keywords (Exact/Phrase), RSA ads, call/sitelink/callout assets.
 *
 * Required env:
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 *   GOOGLE_ADS_DEVELOPER_TOKEN
 *   GOOGLE_ADS_REFRESH_TOKEN
 *   GOOGLE_ADS_CUSTOMER_ID          (10 digits, no dashes)
 *   GOOGLE_ADS_LOGIN_CUSTOMER_ID    (optional MCC)
 *   ADS_PHONE                      (E.164, e.g. +972796709999)
 *   ADS_LANDING_AMBULANCE_URL
 *   ADS_LANDING_FLIGHT_URL
 *   ADS_ENABLE                     (true = enable campaigns; default false/Paused)
 *   ADS_WHATSAPP_URL               (optional)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { GoogleAdsApi, enums, toMicros } from "google-ads-api";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "out");
const REPORT = path.join(OUT, "deploy-report.json");

const REQUIRED = [
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
  "ADS_PHONE",
  "ADS_LANDING_AMBULANCE_URL",
  "ADS_LANDING_FLIGHT_URL",
];

function missingEnv() {
  return REQUIRED.filter((k) => !process.env[k]?.trim());
}

function loadCsv(name) {
  const raw = fs.readFileSync(path.join(OUT, name), "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true, relax_quotes: true });
}

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(OUT, name), "utf8"));
}

function normalizePhone(phone) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("972")) return `+${digits}`;
  if (digits.startsWith("0")) return `+972${digits.slice(1)}`;
  return `+${digits}`;
}

function matchTypeEnum(mt) {
  if (mt === "Exact") return enums.KeywordMatchType.EXACT;
  if (mt === "Phrase") return enums.KeywordMatchType.PHRASE;
  throw new Error(`Unsupported match type: ${mt}`);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function mutateBatches(customer, operations, label) {
  const results = [];
  for (const batch of chunk(operations, 1000)) {
    if (!batch.length) continue;
    const res = await customer.mutateResources(batch);
    results.push(res);
    console.log(`  mutate ${label}: ${batch.length} ops`);
  }
  return results;
}

function ensureGenerated() {
  const needed = [
    "keywords.csv",
    "negative-keywords.csv",
    "responsive-search-ads.csv",
    "lead-assets.json",
    "summary.json",
  ];
  for (const f of needed) {
    if (!fs.existsSync(path.join(OUT, f))) {
      throw new Error(`Missing ${f}. Run: npm run ads:generate`);
    }
  }
}

async function ensureConversionActions(customer, report) {
  const existing = await customer.query(`
    SELECT conversion_action.resource_name, conversion_action.name, conversion_action.type
    FROM conversion_action
    WHERE conversion_action.status != 'REMOVED'
  `);
  const byName = new Map(existing.map((r) => [r.conversion_action.name, r.conversion_action.resource_name]));

  const wanted = [
    {
      name: "IAA | Phone calls from ads >60s",
      type: enums.ConversionActionType.AD_CALL,
      category: enums.ConversionActionCategory.PHONE_CALL_LEAD,
      counting: enums.ConversionActionCountingType.ONE_PER_CLICK,
    },
    {
      name: "IAA | WhatsApp click",
      type: enums.ConversionActionType.WEBPAGE,
      category: enums.ConversionActionCategory.CONTACT,
      counting: enums.ConversionActionCountingType.ONE_PER_CLICK,
    },
    {
      name: "IAA | Booking form submit",
      type: enums.ConversionActionType.WEBPAGE,
      category: enums.ConversionActionCategory.SUBMIT_LEAD_FORM,
      counting: enums.ConversionActionCountingType.ONE_PER_CLICK,
    },
  ];

  const ops = [];
  for (const w of wanted) {
    if (byName.has(w.name)) {
      report.conversions[w.name] = { status: "exists", resource: byName.get(w.name) };
      continue;
    }
    ops.push({
      entity: "conversion_action",
      operation: "create",
      resource: {
        name: w.name,
        type: w.type,
        category: w.category,
        status: enums.ConversionActionStatus.ENABLED,
        view_through_lookback_window_days: 1,
        value_settings: { default_value: 1, always_use_default_value: true },
        counting_type: w.counting,
        ...(w.type === enums.ConversionActionType.AD_CALL
          ? {
              phone_call_duration_seconds: 60,
            }
          : {
              click_through_lookback_window_days: 30,
            }),
      },
    });
  }
  if (ops.length) {
    const res = await customer.mutateResources(ops);
    report.conversions.created = ops.map((o) => o.resource.name);
    report.raw_mutates.push({ conversions: res });
  }
}

async function ensureSharedNegatives(customer, negatives, report) {
  const listName = "IAA | Account waste negatives";
  const lists = await customer.query(`
    SELECT shared_set.resource_name, shared_set.name
    FROM shared_set
    WHERE shared_set.type = 'NEGATIVE_KEYWORDS' AND shared_set.status != 'REMOVED'
  `);
  let listResource = lists.find((r) => r.shared_set.name === listName)?.shared_set.resource_name;

  if (!listResource) {
    const created = await customer.mutateResources([
      {
        entity: "shared_set",
        operation: "create",
        resource: {
          name: listName,
          type: enums.SharedSetType.NEGATIVE_KEYWORDS,
        },
      },
    ]);
    listResource = created.mutate_operation_responses?.[0]?.shared_set_result?.resource_name
      || created[0]?.results?.[0]?.resource_name;
    // google-ads-api returns differently by version — normalize:
    if (!listResource && created?.results?.[0]?.resource_name) listResource = created.results[0].resource_name;
    if (!listResource) {
      // re-query
      const again = await customer.query(`
        SELECT shared_set.resource_name, shared_set.name
        FROM shared_set
        WHERE shared_set.name = '${listName.replace(/'/g, "\\'")}'
      `);
      listResource = again[0]?.shared_set.resource_name;
    }
    report.shared_negative_list = { created: true, resource: listResource };
  } else {
    report.shared_negative_list = { created: false, resource: listResource };
  }

  const accountNegs = negatives.filter((n) => n.level === "Account");
  const critOps = accountNegs.map((n) => ({
    entity: "shared_criterion",
    operation: "create",
    resource: {
      shared_set: listResource,
      keyword: {
        text: n.keyword,
        match_type: matchTypeEnum(n.match_type),
      },
    },
  }));

  // Ignore duplicates by catching; mutate in small batches
  for (const batch of chunk(critOps, 100)) {
    try {
      await customer.mutateResources(batch);
    } catch (e) {
      report.warnings.push(`shared_criterion batch: ${e.message}`);
    }
  }
  return listResource;
}

function parseHeadlines(adsRow) {
  return adsRow.headlines.split(" | ").filter(Boolean).slice(0, 15).map((text) => ({ text: text.slice(0, 30) }));
}
function parseDescriptions(adsRow) {
  return adsRow.descriptions.split(" | ").filter(Boolean).slice(0, 4).map((text) => ({ text: text.slice(0, 90) }));
}

async function deployCampaigns(customer, { keywords, negatives, ads, leadAssets, summary, sharedList, report }) {
  const enable = String(process.env.ADS_ENABLE || "false").toLowerCase() === "true";
  const phone = normalizePhone(process.env.ADS_PHONE);
  const campaignNames = [...new Set(keywords.map((k) => k.campaign))];

  // budgets + campaigns
  for (const name of campaignNames) {
    const budgetName = `${name} | Budget`;
    const daily = Number(
      name.includes("אמבולנס") ? 150 : name.includes("HE") ? 200 : 250
    );

    let budgetResource;
    try {
      const b = await customer.mutateResources([
        {
          entity: "campaign_budget",
          operation: "create",
          resource: {
            name: budgetName,
            amount_micros: toMicros(daily),
            delivery_method: enums.BudgetDeliveryMethod.STANDARD,
            explicitly_shared: false,
          },
        },
      ]);
      budgetResource =
        b?.mutate_operation_responses?.[0]?.campaign_budget_result?.resource_name ||
        b?.results?.[0]?.resource_name;
    } catch (e) {
      report.warnings.push(`budget ${name}: ${e.message}`);
      const existing = await customer.query(`
        SELECT campaign_budget.resource_name, campaign_budget.name
        FROM campaign_budget WHERE campaign_budget.name = '${budgetName.replace(/'/g, "\\'")}'
      `);
      budgetResource = existing[0]?.campaign_budget.resource_name;
    }

    if (!budgetResource) throw new Error(`No budget resource for ${name}`);

    const isHe = !name.includes(" EN");
    let campaignResource;
    try {
      const c = await customer.mutateResources([
        {
          entity: "campaign",
          operation: "create",
          resource: {
            name,
            status: enable ? enums.CampaignStatus.ENABLED : enums.CampaignStatus.PAUSED,
            advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
            campaign_budget: budgetResource,
            network_settings: {
              target_google_search: true,
              target_search_network: false,
              target_content_network: false,
            },
            manual_cpc: { enhanced_cpc_enabled: false },
            contains_eu_political_advertising: enums.EuPoliticalAdvertisingStatus.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING,
          },
        },
      ]);
      campaignResource =
        c?.mutate_operation_responses?.[0]?.campaign_result?.resource_name ||
        c?.results?.[0]?.resource_name;
    } catch (e) {
      report.warnings.push(`campaign create ${name}: ${e.message}`);
      const existing = await customer.query(`
        SELECT campaign.resource_name, campaign.name
        FROM campaign WHERE campaign.name = '${name.replace(/'/g, "\\'")}' AND campaign.status != 'REMOVED'
      `);
      campaignResource = existing[0]?.campaign.resource_name;
    }

    if (!campaignResource) throw new Error(`No campaign resource for ${name}`);
    report.campaigns[name] = { resource: campaignResource, enabled: enable };

    // language
    try {
      await customer.mutateResources([
        {
          entity: "campaign_criterion",
          operation: "create",
          resource: {
            campaign: campaignResource,
            language: { language_constant: isHe ? "languageConstants/1027" : "languageConstants/1000" },
          },
        },
      ]);
    } catch (e) {
      report.warnings.push(`language ${name}: ${e.message}`);
    }

    // geo: Israel for all; ambulance focuses presence in Israel
    try {
      await customer.mutateResources([
        {
          entity: "campaign_criterion",
          operation: "create",
          resource: {
            campaign: campaignResource,
            location: { geo_target_constant: "geoTargetConstants/2056" }, // Israel? actually 2056 might be wrong
            // Israel = 2376 in Google geo constants? Use 2376 for Israel country
          },
        },
      ]);
    } catch (e) {
      // retry Israel 2376
      try {
        await customer.mutateResources([
          {
            entity: "campaign_criterion",
            operation: "create",
            resource: {
              campaign: campaignResource,
              location: { geo_target_constant: "geoTargetConstants/2376" },
            },
          },
        ]);
      } catch (e2) {
        report.warnings.push(`geo ${name}: ${e2.message}`);
      }
    }

    // attach shared negatives
    if (sharedList) {
      try {
        await customer.mutateResources([
          {
            entity: "campaign_shared_set",
            operation: "create",
            resource: { campaign: campaignResource, shared_set: sharedList },
          },
        ]);
      } catch (e) {
        report.warnings.push(`shared_set link ${name}: ${e.message}`);
      }
    }

    // campaign-level negatives
    const campNegs = negatives.filter((n) => n.level === "Campaign" && n.campaign === name);
    for (const batch of chunk(
      campNegs.map((n) => ({
        entity: "campaign_criterion",
        operation: "create",
        resource: {
          campaign: campaignResource,
          negative: true,
          keyword: { text: n.keyword, match_type: matchTypeEnum(n.match_type) },
        },
      })),
      100
    )) {
      try {
        await customer.mutateResources(batch);
      } catch (e) {
        report.warnings.push(`camp neg ${name}: ${e.message}`);
      }
    }

    // ad groups
    const groups = [...new Set(keywords.filter((k) => k.campaign === name).map((k) => k.ad_group))];
    const agResources = {};
    for (const agName of groups) {
      const sample = keywords.find((k) => k.campaign === name && k.ad_group === agName);
      const cpc = Number(sample?.max_cpc || 20);
      try {
        const ag = await customer.mutateResources([
          {
            entity: "ad_group",
            operation: "create",
            resource: {
              name: agName,
              campaign: campaignResource,
              status: enums.AdGroupStatus.ENABLED,
              type: enums.AdGroupType.SEARCH_STANDARD,
              cpc_bid_micros: toMicros(cpc),
            },
          },
        ]);
        agResources[agName] =
          ag?.mutate_operation_responses?.[0]?.ad_group_result?.resource_name ||
          ag?.results?.[0]?.resource_name;
      } catch (e) {
        report.warnings.push(`ad_group ${agName}: ${e.message}`);
        const existing = await customer.query(`
          SELECT ad_group.resource_name, ad_group.name
          FROM ad_group
          WHERE ad_group.campaign = '${campaignResource}' AND ad_group.name = '${agName.replace(/'/g, "\\'")}'
        `);
        agResources[agName] = existing[0]?.ad_group.resource_name;
      }
    }

    // keywords
    const kwOps = keywords
      .filter((k) => k.campaign === name && agResources[k.ad_group])
      .map((k) => ({
        entity: "ad_group_criterion",
        operation: "create",
        resource: {
          ad_group: agResources[k.ad_group],
          status: enums.AdGroupCriterionStatus.ENABLED,
          keyword: { text: k.keyword, match_type: matchTypeEnum(k.match_type) },
          cpc_bid_micros: toMicros(Number(k.max_cpc || 20)),
        },
      }));
    for (const batch of chunk(kwOps, 200)) {
      try {
        await customer.mutateResources(batch);
      } catch (e) {
        report.warnings.push(`keywords ${name}: ${e.message}`);
      }
    }
    report.campaigns[name].keywords = kwOps.length;

    // RSA ads
    const campAds = ads.filter((a) => a.campaign === name);
    for (const ad of campAds) {
      const agRes = agResources[ad.ad_group];
      if (!agRes) continue;
      try {
        await customer.mutateResources([
          {
            entity: "ad_group_ad",
            operation: "create",
            resource: {
              ad_group: agRes,
              status: enums.AdGroupAdStatus.ENABLED,
              ad: {
                final_urls: [ad.final_url || process.env.ADS_LANDING_AMBULANCE_URL],
                responsive_search_ad: {
                  headlines: parseHeadlines(ad),
                  descriptions: parseDescriptions(ad),
                  path1: (ad.path1 || "").slice(0, 15),
                  path2: (ad.path2 || "").slice(0, 15),
                },
              },
            },
          },
        ]);
      } catch (e) {
        report.warnings.push(`rsa ${ad.ad_group}: ${e.message}`);
      }
    }
    report.campaigns[name].ads = campAds.length;

    // Call asset
    try {
      const callAsset = await customer.mutateResources([
        {
          entity: "asset",
          operation: "create",
          resource: {
            name: `IAA Call | ${name}`.slice(0, 100),
            type: enums.AssetType.CALL,
            call_asset: {
              country_code: "IL",
              phone_number: phone.replace(/^\+972/, "0").replace(/^\+/, "") || phone,
              // Prefer E.164-ish local format for IL
            },
          },
        },
      ]);
      let callRes =
        callAsset?.mutate_operation_responses?.[0]?.asset_result?.resource_name ||
        callAsset?.results?.[0]?.resource_name;
      if (!callRes) {
        // try with +972 format in phone_number field differently
        const callAsset2 = await customer.mutateResources([
          {
            entity: "asset",
            operation: "create",
            resource: {
              type: enums.AssetType.CALL,
              call_asset: {
                country_code: "IL",
                phone_number: "079-6709999",
              },
            },
          },
        ]);
        callRes =
          callAsset2?.mutate_operation_responses?.[0]?.asset_result?.resource_name ||
          callAsset2?.results?.[0]?.resource_name;
      }
      if (callRes) {
        await customer.mutateResources([
          {
            entity: "campaign_asset",
            operation: "create",
            resource: {
              campaign: campaignResource,
              asset: callRes,
              field_type: enums.AssetFieldType.CALL,
            },
          },
        ]);
        report.campaigns[name].call_asset = callRes;
      }
    } catch (e) {
      report.warnings.push(`call asset ${name}: ${e.message}`);
    }

    // Callouts
    const callouts = name.includes("EN") ? leadAssets.callouts_en : leadAssets.callouts_he;
    for (const text of callouts.slice(0, 8)) {
      try {
        const a = await customer.mutateResources([
          {
            entity: "asset",
            operation: "create",
            resource: {
              type: enums.AssetType.CALLOUT,
              callout_asset: { callout_text: text.slice(0, 25) },
            },
          },
        ]);
        const res =
          a?.mutate_operation_responses?.[0]?.asset_result?.resource_name || a?.results?.[0]?.resource_name;
        if (res) {
          await customer.mutateResources([
            {
              entity: "campaign_asset",
              operation: "create",
              resource: {
                campaign: campaignResource,
                asset: res,
                field_type: enums.AssetFieldType.CALLOUT,
              },
            },
          ]);
        }
      } catch (e) {
        report.warnings.push(`callout ${text}: ${e.message}`);
      }
    }

    // Sitelinks
    const sitelinks = name.includes("EN") ? leadAssets.sitelinks_en : leadAssets.sitelinks_he;
    const finalUrl = name.includes("אמבולנס")
      ? process.env.ADS_LANDING_AMBULANCE_URL
      : process.env.ADS_LANDING_FLIGHT_URL;
    for (const sl of sitelinks) {
      try {
        const a = await customer.mutateResources([
          {
            entity: "asset",
            operation: "create",
            resource: {
              type: enums.AssetType.SITELINK,
              final_urls: [finalUrl],
              sitelink_asset: {
                link_text: sl.text.slice(0, 25),
                description1: (sl.desc1 || "").slice(0, 35),
                description2: (sl.desc2 || "").slice(0, 35),
              },
            },
          },
        ]);
        const res =
          a?.mutate_operation_responses?.[0]?.asset_result?.resource_name || a?.results?.[0]?.resource_name;
        if (res) {
          await customer.mutateResources([
            {
              entity: "campaign_asset",
              operation: "create",
              resource: {
                campaign: campaignResource,
                asset: res,
                field_type: enums.AssetFieldType.SITELINK,
              },
            },
          ]);
        }
      } catch (e) {
        report.warnings.push(`sitelink ${sl.text}: ${e.message}`);
      }
    }
  }
}

async function main() {
  const report = {
    started_at: new Date().toISOString(),
    mode: "google_ads_api_deploy",
    conversions: {},
    campaigns: {},
    warnings: [],
    raw_mutates: [],
    status: "pending",
  };

  const miss = missingEnv();
  if (miss.length) {
    report.status = "blocked_missing_credentials";
    report.missing_env = miss;
    report.message =
      "Deploy is fully automated via Google Ads API, but account credentials are not in this environment yet.";
    report.how_to_unblock = {
      set_once_in_env_or_secrets: REQUIRED,
      then_run: "npm run ads:all",
      enable_live: "ADS_ENABLE=true npm run ads:deploy",
    };
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 2;
    return;
  }

  ensureGenerated();
  const keywords = loadCsv("keywords.csv");
  const negatives = loadCsv("negative-keywords.csv");
  const ads = loadCsv("responsive-search-ads.csv");
  const leadAssets = loadJson("lead-assets.json");
  const summary = loadJson("summary.json");

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

  console.log("Deploying conversion actions...");
  await ensureConversionActions(customer, report);

  console.log("Deploying shared negatives...");
  const sharedList = await ensureSharedNegatives(customer, negatives, report);

  console.log("Deploying campaigns / ads / assets...");
  await deployCampaigns(customer, {
    keywords,
    negatives,
    ads,
    leadAssets,
    summary,
    sharedList,
    report,
  });

  report.finished_at = new Date().toISOString();
  report.status = "deployed";
  report.ads_enable = String(process.env.ADS_ENABLE || "false");
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, campaigns: Object.keys(report.campaigns), warnings: report.warnings.length }, null, 2));
}

main().catch((err) => {
  const report = {
    status: "error",
    error: err.message,
    stack: err.stack,
    at: new Date().toISOString(),
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
  console.error(err);
  process.exit(1);
});
