# Negative Keyword Database — Israel Air Ambulance

Import `negative-keywords.csv` at **Account** level (Phrase match) before enabling campaigns.  
Regenerate via `node marketing/tools/generate-marketing-assets.mjs`.

---

## Categories

| Category | Examples | Why |
|----------|----------|-----|
| Jobs / careers | job, salary, hiring, paramedic jobs | Non-buyer traffic |
| Jobs IT (TikTok spill) | lavoro, assunzione, stipendio, cerco lavoro | Italian job-seeker spam |
| Jobs FR/DE/ES/RU/AR/TH | emploi, Stellenangebot, busco trabajo, вакансия, وظيفة | Global job-seeker spam — all destinations |
| Jobs HE | משרה, דרושים, קורות חיים, גיוס | Local job seekers |
| Training | course, emt school, how to become | Education seekers |
| Volunteer | volunteer, internship | Not private-pay missions |
| Free / cheap | free, cheap, coupon, cheapest | Wrong commercial intent |
| Insurance claims admin | insurance claim, medicare, nhs claim | Low private-lead quality |
| Local EMS / domestic | 911, MDA, near me, wheelchair transport, taxi | Not intl air ambulance |
| Medical tourism | medical tourism, dental tourism, ivf tourism | Explicitly excluded |
| Unrelated | toys, pets, reddit, documentary | Waste |
| Gov / NGO tenders | rfp, government tender, ngo tender | Not private-client focus |

---

## Shared list naming in Google Ads

- `IAA | Negatives | Account | Waste` ← full CSV  
- Optional campaign-level: `IAA | Negatives | Domestic Israel` for TO Israel campaigns if Hebrew domestic terms bleed  

---

## Hygiene cadence

| Cadence | Action |
|---------|--------|
| Daily (first 21 days) | Add irrelevant search terms |
| Weekly | Review Phrase collisions; promote Exact negatives for repeat offenders |
| Monthly | Export search terms 30d → harvest |

Never negative out core service terms (air ambulance, medical repatriation, medical escort, icu transport) unless combined with junk modifiers already covered.
