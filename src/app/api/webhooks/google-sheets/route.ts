import { NextResponse } from "next/server";
import { z } from "zod";
import { getOptionalEnv, requireEnv } from "@/lib/integrations/env";
import type { CallWebhookPayload } from "@/lib/integrations/types";

const payloadSchema = z.object({
  event: z.enum(["call.approved", "call.assigned"]),
  sent_at: z.string(),
  call: z.record(z.any())
});

export async function POST(req: Request) {
  try {
    const internalSecret = getOptionalEnv("INTERNAL_WEBHOOK_SECRET");
    if (internalSecret) {
      const got = req.headers.get("x-iaa-internal-secret");
      if (got !== internalSecret) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
    }

    const json = await req.json();
    payloadSchema.parse(json);
    const payload = json as CallWebhookPayload;

    const url = requireEnv("GOOGLE_SHEETS_WEBHOOK_URL");
    const secret = getOptionalEnv("GOOGLE_SHEETS_WEBHOOK_SECRET");

    const headers: Record<string, string> = { "content-type": "application/json" };
    if (secret) headers["x-iaa-webhook-secret"] = secret;

    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `upstream_${r.status}`, detail: text.slice(0, 500) }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "bad_request" },
      { status: 400 }
    );
  }
}

