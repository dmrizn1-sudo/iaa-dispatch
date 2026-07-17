#!/usr/bin/env node
/**
 * Assign diverse AI images across publish-queue-90d.json (anti-repeat).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assignImagesToSlots, listAiImageUrls, publicAssetBase } from "./ai-image-urls.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE = path.join(ROOT, "data/publish-queue-90d.json");

const queue = JSON.parse(fs.readFileSync(QUEUE, "utf8"));
const images = listAiImageUrls();
if (!images.length) {
  console.error("No AI images found");
  process.exit(1);
}

const { usage } = assignImagesToSlots(queue.slots);
queue.imageLibrary = {
  base: publicAssetBase(),
  count: images.length,
  files: images.map((i) => i.file),
  usage
};
queue.imageUrl = images[0].url;
queue.approval =
  (queue.approval || "") +
  (queue.approval?.includes("diverse AI")
    ? ""
    : " · diverse AI aviation imagery (anti-repeat)");

fs.writeFileSync(QUEUE, JSON.stringify(queue, null, 2));
console.log(`Assigned ${images.length} image variants across ${queue.slots.length} slots`);
console.log("Usage:", usage);
const files = queue.slots.slice(0, 12).map((s) => s.imageUrl.split("/").pop());
console.log("First 12:", files);
