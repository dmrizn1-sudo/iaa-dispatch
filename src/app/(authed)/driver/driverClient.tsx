"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

export default function DriverClient({ callId, currentStatus }: { callId: string; currentStatus: string }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function setStatus(status: "בדרך" | "הגיע" | "הסתיים") {
    setBusy(status);
    setMsg(null);
    const r = await fetch(`/api/calls/${encodeURIComponent(callId)}/driver-status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = (await r.json()) as { ok: boolean; status?: string };
    setBusy(null);
    if (!r.ok || !data.ok) {
      setMsg("פעולה נכשלה.");
      return;
    }
    setMsg(`עודכן סטטוס: ${data.status || status}`);
  }

  const disabled = (s: string) => busy !== null;

  return (
    <div className="space-y-3">
      {msg ? <div className="rounded-2xl border border-iaa-blue/10 bg-iaa-blue/[0.02] px-4 py-3 text-sm font-bold text-iaa-blue">{msg}</div> : null}
      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant="secondary" disabled={disabled("בדרך")} onClick={() => setStatus("בדרך")}>
          בדרך
        </Button>
        <Button type="button" variant="secondary" disabled={disabled("הגיע")} onClick={() => setStatus("הגיע")}>
          הגיע
        </Button>
        <Button type="button" disabled={disabled("הסתיים")} onClick={() => setStatus("הסתיים")}>
          הסתיים
        </Button>
      </div>
      <div className="text-xs font-semibold text-iaa-blue/60">סטטוס נוכחי: {currentStatus}</div>
    </div>
  );
}

