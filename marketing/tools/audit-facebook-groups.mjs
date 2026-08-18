#!/usr/bin/env node
/**
 * Structural audit for Thailand Facebook-groups campaign.
 * Meta Groups API is deprecated — this does not call Graph for group feeds.
 *
 * Usage: node marketing/tools/audit-facebook-groups.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const builder = path.join(here, "build-thailand-groups-campaign.mjs");
const res = spawnSync(process.execPath, [builder, "--audit-only"], {
  stdio: "inherit"
});
process.exit(res.status ?? 1);
