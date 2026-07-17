#!/usr/bin/env node
/**
 * Assign rotating AI air-ambulance images to every slot in publish-queue-90d.json.
 * Does not rebuild the queue or clear Facebook schedule IDs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listAiImageUrls, pickAiImageUrl, publicAssetBase } from "./ai-image-urls.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE = path.join(ROOT, "data/publish-queue-90d.json");

const queue = JSON.parse(fs.readFileSync(QUEUE, "utf8"));
const images = listAiImageUrls();
if (!images.length) {
  console.error("No AI images found in marketing/assets/ai-images");
  process.exit(1);
}

queue.imageLibrary = {
  base: publicAssetBase(),
  count: images.length,
  files: images.map((i) => i.file)
};
queue.imageUrl = images[0].url;

for (let i = 0; i < queue.slots.length; i++) {
  const slot = queue.slots[i];
  const url = pickAiImageUrl({
    title: slot.title || "",
    sourceId: slot.sourceId || "",
    seed: i + slot.dayIndex * 3 + slot.slot
  });
  slot.imageUrl = url;
  slot.platforms.instagram.imageUrl = url;
  slot.platforms.facebook.imageUrl = url;
}

fs.writeFileSync(QUEUE, JSON.stringify(queue, null, 2));
console.log(`Assigned AI images to ${queue.slots.length} slots`);
console.log(`Public base: ${publicAssetBase()}`);
console.log(`Sample: ${queue.slots[0].imageUrl}`);
