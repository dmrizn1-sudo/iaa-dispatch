import { getOptionalEnv } from "@/lib/integrations/env";
import type { CallWebhookPayload } from "@/lib/integrations/types";

async function postWebhook(url: string, secret: string | null, payload: CallWebhookPayload, internalSecret?: string | null) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) headers["x-iaa-webhook-secret"] = secret;
  if (internalSecret) headers["x-iaa-internal-secret"] = internalSecret;

  const r = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Webhook failed (${r.status}): ${text.slice(0, 300)}`);
  }
}

export async function sendApprovedCallToIntegrations(payload: CallWebhookPayload) {
  // These are INTERNAL webhook endpoints in this app.
  // They forward to the external URLs configured in env.
  const baseUrl = getOptionalEnv("NEXT_PUBLIC_SITE_URL") || null;
  const internalSecret = getOptionalEnv("INTERNAL_WEBHOOK_SECRET");

  // Optional: allow disabling individual internal forwards by leaving external URLs empty.
  const hasWhatsapp = Boolean(getOptionalEnv("WHATSAPP_WEBHOOK_URL"));
  const hasSheets = Boolean(getOptionalEnv("GOOGLE_SHEETS_WEBHOOK_URL"));
  if (!hasWhatsapp && !hasSheets) return;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL (required when webhooks are enabled)");
  }

  const whatsappUrl = `${baseUrl.replace(/\/$/, "")}/api/webhooks/whatsapp`;
  const sheetsUrl = `${baseUrl.replace(/\/$/, "")}/api/webhooks/google-sheets`;

  const tasks: Promise<void>[] = [];
  if (hasWhatsapp) tasks.push(postWebhook(whatsappUrl, null, payload, internalSecret));
  if (hasSheets) tasks.push(postWebhook(sheetsUrl, null, payload, internalSecret));

  const results = await Promise.allSettled(tasks);
  const rejected = results.filter((x) => x.status === "rejected") as PromiseRejectedResult[];
  if (rejected.length) {
    // Best-effort: allow call creation to succeed; upstream can inspect logs in deployment.
    // We still throw so caller can decide whether to surface error or ignore.
    throw new Error(rejected.map((r) => String(r.reason?.message || r.reason)).join(" | "));
  }
}

