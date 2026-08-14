#!/usr/bin/env node
/**
 * Build Thailand Facebook-groups campaign pack from
 * marketing/data/facebook-groups-thailand.json
 *
 * Outputs:
 *  - marketing/facebook/groups/THAILAND-GROUPS-HE.md
 *  - marketing/facebook/groups/ready/*.txt (HE+EN paste files)
 *  - marketing/facebook/groups/publish-tracker.json
 *  - marketing/facebook/groups/desk.html (copy desk)
 *
 * Usage:
 *   node marketing/tools/build-thailand-groups-campaign.mjs
 *   node marketing/tools/build-thailand-groups-campaign.mjs --audit-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const DATA = path.join(ROOT, "marketing/data/facebook-groups-thailand.json");
const OUT_DIR = path.join(ROOT, "marketing/facebook/groups");
const READY_DIR = path.join(OUT_DIR, "ready");

function load() {
  return JSON.parse(fs.readFileSync(DATA, "utf8"));
}

function ensureDirs() {
  fs.mkdirSync(READY_DIR, { recursive: true });
}

function bilingualBlock(post) {
  const order = post.preferLanguageOrder || ["en", "he"];
  if (order[0] === "he") {
    return `${post.he}\n\n────────\n\n${post.en}\n`;
  }
  return `${post.en}\n\n────────\n\n${post.he}\n`;
}

function writeReadyPosts(campaign) {
  const written = [];
  for (const post of campaign.posts) {
    const file = path.join(READY_DIR, `${post.id}.txt`);
    const body = [
      `# ${post.titleEn} / ${post.titleHe}`,
      `# id: ${post.id}`,
      `# tone: ${post.tone}`,
      `# destinations: ${(post.destinations || []).join(", ")}`,
      `# contacts: ${campaign.contacts.phoneIntl} · WhatsApp ${campaign.contacts.whatsappLocal}`,
      ``,
      `=== ENGLISH ===`,
      post.en,
      ``,
      `=== עברית ===`,
      post.he,
      ``,
      (post.preferLanguageOrder && post.preferLanguageOrder[0] === "he"
        ? `=== BILINGUAL (HE then EN) — מומלץ לקבוצות בעברית ===`
        : `=== BILINGUAL (EN then HE) — paste this in most groups ===`),
      bilingualBlock(post).trimEnd(),
      ``
    ].join("\n");
    fs.writeFileSync(file, body, "utf8");
    written.push(path.relative(ROOT, file));
  }
  return written;
}

function buildTracker(campaign) {
  const postsById = Object.fromEntries(campaign.posts.map((p) => [p.id, p]));
  const items = [];
  for (const g of campaign.groups) {
    const postIds = g.audit?.recommendedPostIds || [];
    for (const postId of postIds) {
      items.push({
        groupId: g.id,
        groupNameHe: g.nameHe,
        groupNameEn: g.nameEn,
        searchUrl: g.searchUrl,
        postId,
        postTitleHe: postsById[postId]?.titleHe || postId,
        canPublishLikely: g.audit?.canPublishLikely || "unknown",
        publishMethod: g.audit?.publishMethod || "manual",
        status: g.audit?.canPublishLikely?.startsWith("no")
          ? "blocked_pending_rules"
          : "ready_to_audit_then_post",
        postedAt: null,
        postedBy: null,
        facebookUrl: null,
        notes: g.audit?.notesHe || ""
      });
    }
  }
  return {
    campaignId: campaign.campaignId,
    updatedAt: new Date().toISOString(),
    apiAutoPublish: false,
    summary: {
      groups: campaign.groups.length,
      posts: campaign.posts.length,
      queueItems: items.length,
      readyMaybe: items.filter((i) => i.status === "ready_to_audit_then_post").length,
      blocked: items.filter((i) => i.status === "blocked_pending_rules").length
    },
    items
  };
}

function markdownGuide(campaign, tracker) {
  const groupRows = campaign.groups
    .map((g) => {
      const a = g.audit || {};
      const members = g.approxMembers ? `~${g.approxMembers.toLocaleString("en-US")}` : "—";
      return `| ${g.nameHe} | ${members} | ${a.canPublishLikely || "?"} | ${a.commercialPosts || "?"} | ${(a.recommendedPostIds || []).join(", ")} | [חיפוש](${g.searchUrl}) |`;
    })
    .join("\n");

  const postList = campaign.posts
    .map((p) => `- **${p.id}** — ${p.titleHe} / ${p.titleEn} → \`marketing/facebook/groups/ready/${p.id}.txt\``)
    .join("\n");

  return `# קמפיין קבוצות פייסבוק — תאילנד → ישראל (טיסות רפואיות)

**קמפיין:** \`${campaign.campaignId}\`  
**דף:** ${campaign.page.name} (\`${campaign.page.pageId}\`)  
**יעד:** מטיילים ישראלים בתאילנד — כללי + קוסמוי + פטאיה + בנגקוק  
**שפות:** עברית + אנגלית בכל פוסט

---

## חשוב — מגבלת Meta

מאז **22.4.2024** Meta ביטלה את **Groups API** (כולל \`publish_to_groups\`).

| מה רוצים | האם אפשרי אוטומטית? |
|----------|---------------------|
| פרסום לדף שלנו | כן (Graph API / Page token) |
| פרסום לקבוצות פייסבוק | **לא** דרך API |
| תיוג קבוצות בפוסט בדף | ידני עם \`@\` אם פייסבוק מציע השלמה |

**לכן הקמפיין הזה** = ביקורת קבוצות + טקסטים מוכנים + שולחן הדבקה ידני + מעקב סטטוס.

---

## יעדים בקמפיין

${campaign.destinations.map((d) => `- **${d.nameHe}** (${d.nameEn}) — ${d.focus}`).join("\n")}

---

## ביקורת קבוצות (מחקר ראשוני)

| קבוצה | חברים | סיכוי פרסום | מסחרי | פוסטים מומלצים | קישור |
|-------|--------|-------------|--------|----------------|--------|
${groupRows}

### איך בודקים כל קבוצה (5 דקות)

1. פתחו את קישור החיפוש והצטרפו לקבוצה הפעילה ביותר בשם הזה
2. קראו **כללי קבוצה** (Group rules)
3. בדקו אם אפשר לפרסם **כדף** (Pages allowed) או רק כפרופיל
4. אם אסור פרסום מסחרי — בקשו אישור אדמין **או** השתמשו רק ב־\`th-emergency-only-he-en\`
5. עדכנו סטטוס ב־\`publish-tracker.json\` / בשולחן \`desk.html\`

---

## פוסטים מוכנים (HE + EN)

${postList}

שולחן העתקה: [\`desk.html\`](./desk.html)  
מעקב: [\`publish-tracker.json\`](./publish-tracker.json)

---

## סדר פעולה מומלץ (היום)

1. **דף** — פרסמו \`page-tag-thailand-he-en\` בדף, ונסו לתאג \`@\` את הקבוצות
2. **הצטרפות** — תאילנד למשפחות · תאילנד שאלות ותשובות · ישראלים בקוסמוי · ישראלים בפטאיה · ישראלים בבנגקוק
3. **ביקורת כללים** — סמנו לכל קבוצה: אפשר / אדמין / חסום
4. **פרסום** — לכל קבוצה שאושרה: הדביקו את הפוסט הדו־לשוני מהקובץ \`ready/\`
5. **מעקב** — סמנו \`posted\` בטראקר עם לינק לפוסט

### תורים מוכנים עכשיו

- פריטי תור: **${tracker.summary.queueItems}**
- מוכנים לביקורת+פרסום: **${tracker.summary.readyMaybe}**
- חסומים/זהירות: **${tracker.summary.blocked}**

---

## אנשי קשר בכל פוסט

- טלפון: ${campaign.contacts.phoneIntl}
- וואטסאפ: ${campaign.contacts.whatsappLocal}
- אתר: ${campaign.contacts.website}

---

## פקודות

\`\`\`bash
# בנייה מחדש של הקמפיין + קבצי ready + desk
npm run marketing:thailand-groups

# ביקורת מבנית + סיכום מה ניתן לפרסם
npm run marketing:thailand-groups-audit
\`\`\`

---

## תאימות לכללי קבוצות

${campaign.compliance.rulesHe.map((r) => `- ${r}`).join("\n")}
`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildDeskHtml(campaign, tracker) {
  const groupsJson = JSON.stringify(campaign.groups);
  const postsJson = JSON.stringify(campaign.posts);
  const trackerJson = JSON.stringify(tracker);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>IAA — שולחן פרסום קבוצות תאילנד</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&family=Manrope:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #0f1c24;
      --panel: #162832;
      --panel2: #1c3340;
      --ink: #e8f1f4;
      --muted: #9db4be;
      --accent: #3d8f9e;
      --line: rgba(255,255,255,.08);
      --ok: #3dba8a;
      --warn: #e0b35a;
      --bad: #e07a6a;
      --cta: #1f8f7a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Heebo, Manrope, sans-serif;
      background:
        radial-gradient(1200px 600px at 10% -10%, rgba(31,143,122,.28), transparent 55%),
        radial-gradient(900px 500px at 100% 0%, rgba(62,110,150,.25), transparent 50%),
        var(--bg);
      color: var(--ink);
      min-height: 100vh;
    }
    header {
      padding: 28px 20px 12px;
      max-width: 1100px;
      margin: 0 auto;
    }
    header h1 {
      margin: 0 0 8px;
      font-size: clamp(1.5rem, 3vw, 2.1rem);
      letter-spacing: -.02em;
    }
    header p { margin: 0; color: var(--muted); max-width: 70ch; line-height: 1.55; }
    .banner {
      margin-top: 16px;
      padding: 12px 14px;
      border: 1px solid rgba(224,179,90,.35);
      background: rgba(224,179,90,.1);
      border-radius: 12px;
      color: #f3dfb0;
      font-size: .95rem;
    }
    main {
      max-width: 1100px;
      margin: 0 auto;
      padding: 12px 20px 48px;
      display: grid;
      gap: 14px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0,1fr));
      gap: 10px;
    }
    @media (max-width: 800px) {
      .stats { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
    .stat {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px;
    }
    .stat b { display: block; font-size: 1.4rem; }
    .stat span { color: var(--muted); font-size: .85rem; }
    .card {
      background: linear-gradient(180deg, var(--panel), var(--panel2));
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 16px;
    }
    .card h2 { margin: 0 0 10px; font-size: 1.15rem; }
    .meta { color: var(--muted); font-size: .88rem; margin-bottom: 10px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .chip {
      font-size: .78rem;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,.03);
    }
    .chip.ok { color: var(--ok); border-color: rgba(61,186,138,.35); }
    .chip.warn { color: var(--warn); border-color: rgba(224,179,90,.35); }
    .chip.bad { color: var(--bad); border-color: rgba(224,122,106,.35); }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
    button, a.btn {
      appearance: none;
      border: 0;
      border-radius: 10px;
      padding: 10px 12px;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      color: white;
      background: var(--cta);
    }
    button.secondary, a.btn.secondary {
      background: transparent;
      border: 1px solid var(--line);
      color: var(--ink);
    }
    textarea {
      width: 100%;
      min-height: 220px;
      resize: vertical;
      border-radius: 12px;
      border: 1px solid var(--line);
      background: rgba(0,0,0,.25);
      color: var(--ink);
      padding: 12px;
      font: inherit;
      line-height: 1.5;
    }
    details { margin-top: 8px; }
    summary { cursor: pointer; color: var(--muted); }
    .toast {
      position: fixed;
      bottom: 18px;
      left: 50%;
      transform: translateX(-50%);
      background: #12352e;
      border: 1px solid rgba(61,186,138,.45);
      color: #d9fff0;
      padding: 10px 14px;
      border-radius: 999px;
      opacity: 0;
      pointer-events: none;
      transition: .2s ease;
      z-index: 20;
    }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>
  <header>
    <h1>שולחן פרסום · קבוצות תאילנד</h1>
    <p>קמפיין טיסות רפואיות לישראל למטיילים ישראלים — תאילנד, קוסמוי, פטאיה, בנגקוק. כל פוסט בעברית ובאנגלית. העתיקו והדביקו ידנית בכל קבוצה שאושרה.</p>
    <div class="banner">Meta ביטלה Groups API (אפריל 2024) — אין פרסום אוטומטי לקבוצות. הדף שלנו ממשיך ב-API; קבוצות = ידני / תיוג @ בדף.</div>
  </header>
  <main>
    <section class="stats" id="stats"></section>
    <section id="groups"></section>
  </main>
  <div class="toast" id="toast">הועתק</div>
  <script>
    const GROUPS = ${groupsJson};
    const POSTS = ${postsJson};
    const TRACKER = ${trackerJson};
    const postsById = Object.fromEntries(POSTS.map(p => [p.id, p]));

    function chipClass(v) {
      const s = String(v || '');
      if (s.startsWith('no') || s.includes('banned') || s === 'unlikely') return 'bad';
      if (s === 'maybe' || s === 'ask_admin' || s === 'unknown') return 'warn';
      return 'ok';
    }

    function bilingual(p) {
      return p.en + "\\n\\n────────\\n\\n" + p.he;
    }

    async function copyText(text) {
      await navigator.clipboard.writeText(text);
      const t = document.getElementById('toast');
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 1200);
    }

    function render() {
      const stats = document.getElementById('stats');
      stats.innerHTML = [
        ['קבוצות', TRACKER.summary.groups],
        ['פוסטים', TRACKER.summary.posts],
        ['תור פרסום', TRACKER.summary.queueItems],
        ['מוכנים לביקורת', TRACKER.summary.readyMaybe]
      ].map(([label, val]) => \`<div class="stat"><b>\${val}</b><span>\${label}</span></div>\`).join('');

      const root = document.getElementById('groups');
      root.innerHTML = GROUPS.map(g => {
        const a = g.audit || {};
        const rec = (a.recommendedPostIds || []).map(id => postsById[id]).filter(Boolean);
        const postsHtml = rec.map(p => {
          const text = (p.preferLanguageOrder && p.preferLanguageOrder[0] === 'he')
              ? (p.he + "\\n\\n────────\\n\\n" + p.en)
              : bilingual(p);
          return \`
            <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06)">
              <div class="meta">\${p.titleHe} · <code>\${p.id}</code></div>
              <div class="actions">
                <button data-copy="\${encodeURIComponent(text)}">העתק דו־לשוני</button>
                <button class="secondary" data-copy="\${encodeURIComponent(p.he)}">העתק עברית</button>
                <button class="secondary" data-copy="\${encodeURIComponent(p.en)}">העתק English</button>
              </div>
              <details>
                <summary>תצוגה מקדימה</summary>
                <textarea readonly>\${text.replaceAll('<','&lt;')}</textarea>
              </details>
            </div>\`;
        }).join('');

        return \`
          <article class="card">
            <h2>\${g.nameHe}</h2>
            <div class="meta">\${g.nameEn}\${g.approxMembers ? ' · ~' + g.approxMembers.toLocaleString('en-US') + ' חברים' : ''}</div>
            <div class="chips">
              <span class="chip \${chipClass(a.canPublishLikely)}">פרסום: \${a.canPublishLikely || '?'}</span>
              <span class="chip \${chipClass(a.commercialPosts)}">מסחרי: \${a.commercialPosts || '?'}</span>
              <span class="chip">שיטה: \${a.publishMethod || 'manual'}</span>
            </div>
            <p class="meta">\${a.notesHe || g.postingPolicyHint || ''}</p>
            <div class="actions">
              <a class="btn secondary" href="\${g.searchUrl}" target="_blank" rel="noopener">חיפוש / הצטרפות לקבוצה</a>
            </div>
            \${postsHtml}
          </article>\`;
      }).join('');

      root.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => copyText(decodeURIComponent(btn.getAttribute('data-copy'))));
      });
    }

    render();
  </script>
</body>
</html>
`;
}

function printAudit(campaign, tracker) {
  console.log("Campaign:", campaign.campaignId);
  console.log("API auto-publish to groups:", campaign.apiReality.autoPublishPossible);
  console.log("Groups:", campaign.groups.length);
  console.log("Posts:", campaign.posts.length);
  console.log("Queue items:", tracker.summary.queueItems);
  console.log("\nPer-group publish likelihood:");
  for (const g of campaign.groups) {
    const a = g.audit || {};
    console.log(
      `- ${g.id}: canPublish=${a.canPublishLikely}; commercial=${a.commercialPosts}; method=${a.publishMethod}`
    );
  }
  const publishable = campaign.groups.filter((g) => {
    const v = g.audit?.canPublishLikely || "";
    return v === "maybe" || v === "yes";
  });
  console.log(`\nGroups to prepare posts for now: ${publishable.length}/${campaign.groups.length}`);
  for (const g of publishable) {
    console.log(`  ✓ ${g.nameHe} → ${(g.audit.recommendedPostIds || []).join(", ")}`);
  }
}

function main() {
  const auditOnly = process.argv.includes("--audit-only");
  const campaign = load();
  ensureDirs();
  const tracker = buildTracker(campaign);

  if (!auditOnly) {
    const ready = writeReadyPosts(campaign);
    fs.writeFileSync(
      path.join(OUT_DIR, "publish-tracker.json"),
      JSON.stringify(tracker, null, 2) + "\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(OUT_DIR, "THAILAND-GROUPS-HE.md"),
      markdownGuide(campaign, tracker),
      "utf8"
    );
    fs.writeFileSync(path.join(OUT_DIR, "desk.html"), buildDeskHtml(campaign, tracker), "utf8");
    console.log("Wrote ready posts:", ready.length);
    console.log("Wrote publish-tracker.json, THAILAND-GROUPS-HE.md, desk.html");
  }

  printAudit(campaign, tracker);
}

main();
