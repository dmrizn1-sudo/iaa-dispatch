# AI medical aviation images

AI-generated visuals for Israel Air Ambulance social posts (private air ambulance / medical aircraft). Used by the 90-day auto-publish queue.

| File | Use |
|------|-----|
| `air-ambulance-jet-tarmac.jpg` | Routes / city flights |
| `air-ambulance-icu-cabin.jpg` | ICU / equipment / crew |
| `ambulance-jet-handoff.jpg` | Bedside-to-bedside / repatriation |
| `air-ambulance-inflight.jpg` | In-flight / international routes |
| `stretcher-boarding-night.jpg` | Emergency / night transfer |
| `air-ambulance-nose-square.jpg` | Brand / general (square) |

Assign to queue:

```bash
node marketing/tools/assign-ai-images.mjs
```

Public URLs (after push):

`https://raw.githubusercontent.com/dmrizn1-sudo/iaa-dispatch/<branch>/marketing/assets/ai-images/<file>.jpg`
