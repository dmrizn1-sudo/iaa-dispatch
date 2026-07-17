#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { posts, brand } = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data/posts.json"), "utf8")
);

const carousels = posts.filter((p) => p.type === "carousel");
const feed = posts.filter((p) => p.type === "feed");

function mdEscape(s) {
  return s.replace(/\n/g, "\n");
}

// Instagram carousels
{
  const lines = [
    "# Instagram Carousel Scripts — Premium Brand Series (EN + HE)",
    "",
    "Design notes: dark navy / clean white / subtle steel-blue accent; premium medical aviation look; no emoji overload on slides; strong brand wordmark on slide 1; final slide = CTA (Call / WhatsApp).",
    "",
    "**Language:** Every caption is bilingual — English block, then Hebrew block (separated by ────────).",
    "",
    "Do not auto-publish. Copy after review.",
    ""
  ];
  for (const p of carousels) {
    lines.push(`## ${p.title}${p.titleHe ? ` / ${p.titleHe}` : ""}`);
    lines.push("");
    lines.push(`ID: \`${p.id}\``);
    lines.push("");
    lines.push("### Slides (EN)");
    p.slides.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.replace(/\n/g, " — ")}`);
    });
    if (p.slidesHe?.length) {
      lines.push("");
      lines.push("### Slides (HE)");
      p.slidesHe.forEach((s, i) => {
        lines.push(`${i + 1}. ${s.replace(/\n/g, " — ")}`);
      });
    }
    lines.push("");
    lines.push("### Caption (Instagram — bilingual)");
    lines.push("```");
    lines.push(p.copy.instagram);
    lines.push("```");
    lines.push("");
  }
  fs.writeFileSync(path.join(ROOT, "social/instagram-carousels.md"), lines.join("\n"));
}

// Facebook long-form (first 30 feed posts)
{
  const lines = [
    "# Facebook Posts — Long-form Professional (EN + HE)",
    "",
    "Tone: calm, trustworthy, family-oriented. **Every post is bilingual** (English first, then Hebrew). Always end with Call / WhatsApp CTA. Review before posting.",
    ""
  ];
  for (const p of feed.slice(0, 30)) {
    const heading = p.titleHe ? `${p.title} / ${p.titleHe}` : p.title;
    lines.push(`## Day ${p.day}: ${heading}`);
    lines.push("");
    lines.push("```");
    lines.push(p.copy.facebook);
    lines.push("```");
    lines.push("");
  }
  fs.writeFileSync(path.join(ROOT, "social/facebook-posts.md"), lines.join("\n"));
}

// LinkedIn
{
  const lines = [
    "# LinkedIn Posts — Professional Trust Series",
    "",
    "Focus: clinical coordination expertise, international routes, patient safety. Soft CTA.",
    ""
  ];
  for (const p of feed.filter((_, i) => i % 2 === 0).slice(0, 24)) {
    lines.push(`## Day ${p.day}: ${p.title}`);
    lines.push("");
    lines.push("```");
    lines.push(p.copy.linkedin);
    lines.push("```");
    lines.push("");
  }
  fs.writeFileSync(path.join(ROOT, "social/linkedin-posts.md"), lines.join("\n"));
}

// 90-day calendar
{
  const lines = [
    "# 90-Day International Content Calendar",
    "",
    `Brand: ${brand.name} · Phone: ${brand.phoneIntl} · Site: ${brand.website}`,
    "",
    "Cadence: 1 primary feed asset/day (IG + mirrored FB) · LinkedIn 4×/week · Threads 4×/week · Carousel every ~5 days.",
    "",
    "Platforms: Instagram · Facebook · LinkedIn · Threads",
    "",
    "| Day | Week | Theme | Title | IG | FB | LI | Threads | Asset |",
    "|-----|------|-------|-------|----|----|----|---------|-------|"
  ];
  for (const p of feed) {
    lines.push(
      `| ${p.day} | ${p.week} | ${p.theme} | ${p.title.replace(/\|/g, "/")} | ✅ | ✅ | ${p.day % 2 === 0 ? "✅" : "—"} | ${p.day % 2 === 1 ? "✅" : "—"} | Feed |`
    );
  }
  lines.push("");
  lines.push("## Carousel inserts");
  lines.push("");
  for (const p of carousels) {
    lines.push(`- Day ~${p.day}: **${p.title}** (\`${p.id}\`) — use as IG carousel; adapt caption to FB/LI`);
  }
  lines.push("");
  lines.push("## Weekly content pillars");
  lines.push("");
  lines.push("| Weekday | Pillar |");
  lines.push("|---------|--------|");
  lines.push("| Sun | Educational / how it works |");
  lines.push("| Mon | Route spotlight (city ↔ Israel) |");
  lines.push("| Tue | Equipment / ICU capability |");
  lines.push("| Wed | Crew / behind the scenes |");
  lines.push("| Thu | Medical repatriation / patient safety |");
  lines.push("| Fri | Emergency readiness / 24/7 CTA |");
  lines.push("| Sat | Trust / testimonials / mission story |");
  lines.push("");
  lines.push("All posts prepared in `data/posts.json` and the Review UI — **human approval required before publish**.");
  lines.push("");
  fs.writeFileSync(path.join(ROOT, "social/90-day-content-calendar.md"), lines.join("\n"));
}

console.log("Social markdown exported.");
