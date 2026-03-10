"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type MasterItem = {
  id: string;
  item_name: string;
  category: string;
  required_quantity: number;
  equipment_type: string;
};

type AssignedRow = {
  equipment_id: string;
  required_quantity: number;
};

export default function VehicleEquipmentClient({
  vehicleId,
  master,
  assigned
}: {
  vehicleId: string;
  master: MasterItem[];
  assigned: AssignedRow[];
}) {
  const [map, setMap] = React.useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const row of assigned) {
      m[row.equipment_id] = String(row.required_quantity);
    }
    return m;
  });
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const items = Object.entries(map)
      .map(([equipment_id, qty]) => ({ equipment_id, required_quantity: Number(qty || "0") }))
      .filter((x) => x.required_quantity > 0);

    const r = await fetch(`/api/admin/vehicles/${encodeURIComponent(vehicleId)}/equipment`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items })
    });
    const data = (await r.json()) as { ok: boolean };
    setBusy(false);
    if (!r.ok || !data.ok) {
      setMsg("שמירת ציוד נכשלה.");
      return;
    }
    setMsg("נשמר בהצלחה.");
  }

  return (
    <div className="space-y-4">
      {msg ? <div className="rounded-2xl border border-iaa-blue/10 bg-white px-5 py-4 text-sm font-bold text-iaa-blue">{msg}</div> : null}
      <div className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 text-lg font-extrabold text-iaa-blue md:px-6 md:text-xl">
          רשימת ציוד משויך
        </div>
        <div className="divide-y divide-iaa-blue/10">
          {master.length ? (
            master.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 px-5 py-3 md:px-6">
                <div>
                  <div className="text-sm font-extrabold text-iaa-blue md:text-base">{i.item_name}</div>
                  <div className="text-xs font-semibold text-iaa-blue/60">
                    קטגוריה: {i.category} • סוג: {i.equipment_type} • ברירת מחדל: {i.required_quantity}
                  </div>
                </div>
                <div className="w-28">
                  <Input
                    label="כמות"
                    value={map[i.id] ?? ""}
                    onChange={(e) =>
                      setMap((p) => ({
                        ...p,
                        [i.id]: e.target.value.replace(/[^\d]/g, "")
                      }))
                    }
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-sm font-semibold text-iaa-blue/60 md:px-6">אין פריטי ציוד ברשימת האב</div>
          )}
        </div>
      </div>
      <div className="sticky bottom-0 border-t border-iaa-blue/10 bg-white/95 px-4 py-3 backdrop-blur">
        <Button type="button" size="lg" className="w-full" onClick={save} disabled={busy}>
          {busy ? "שומר..." : "שמירה"}
        </Button>
      </div>
    </div>
  );
}

