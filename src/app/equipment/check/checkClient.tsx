"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Textarea } from "@/components/ui/Textarea";

type Vehicle = { id: string; vehicle_number: string; vehicle_type: string; status: string };
type Master = { id: string; item_name: string; category: string; required_quantity: number; equipment_type: string };
type VehicleEquipment = { vehicle_id: string; equipment_id: string; required_quantity: number };

type ItemRow = {
  equipment_id: string;
  item_name: string;
  required_quantity: number;
  actual_quantity: string;
  condition: "תקין" | "חסר" | "פגום";
  notes: string;
};

export default function EquipmentCheckClient({
  vehicles,
  master,
  vehicleEquipment
}: {
  vehicles: Vehicle[];
  master: Master[];
  vehicleEquipment: VehicleEquipment[];
}) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = React.useState<string>("");
  const [shift, setShift] = React.useState<"בוקר" | "ערב" | "לילה">("בוקר");
  const [driverName, setDriverName] = React.useState("");
  const [crewName, setCrewName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!vehicleId) {
      setItems([]);
      return;
    }
    const list = vehicleEquipment.filter((ve) => ve.vehicle_id === vehicleId);
    const merged: ItemRow[] = list.map((ve) => {
      const eq = master.find((m) => m.id === ve.equipment_id);
      if (!eq) return null;
      return {
        equipment_id: eq.id,
        item_name: eq.item_name,
        required_quantity: ve.required_quantity || eq.required_quantity,
        actual_quantity: "",
        condition: "תקין",
        notes: ""
      };
    }).filter(Boolean) as ItemRow[];
    setItems(merged);
  }, [vehicleId, master, vehicleEquipment]);

  async function submit() {
    setBusy(true);
    setMsg(null);
    setError(null);
    if (!vehicleId) {
      setError("בחר/י אמבולנס לבדיקה.");
      setBusy(false);
      return;
    }
    const rows = items.map((it) => ({
      equipment_id: it.equipment_id,
      required_quantity: it.required_quantity,
      actual_quantity: Number(it.actual_quantity || "0"),
      condition: it.condition,
      notes: it.notes || null
    }));
    const r = await fetch("/api/equipment/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        vehicle_id: vehicleId,
        driver_id: null,
        shift,
        notes,
        items: rows
      })
    });
    const data = (await r.json()) as { ok: boolean; report_id?: string; error?: string };
    setBusy(false);
    if (!r.ok || !data.ok) {
      setError("שמירת בדיקה נכשלה.");
      return;
    }
    setMsg("בדיקת ציוד נשמרה בהצלחה.");
    if (data.report_id) {
      // ניתן לחבר בהמשך לתצוגה להדפסה
    }
  }

  return (
    <main className="min-h-dvh bg-iaa-bg px-4 py-6 md:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">בדיקת ציוד משמרת</div>
          <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
            בדיקת ציוד לאמבולנס בתחילת משמרת — מותאם למובייל/iPad.
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{error}</div> : null}
        {msg ? <div className="rounded-2xl border border-iaa-gold/30 bg-white px-5 py-4 text-sm font-bold text-iaa-blue">{msg}</div> : null}

        <section className="rounded-3xl border border-iaa-blue/10 bg-white p-5 shadow-soft md:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Combobox
              label="אמבולנס"
              value={vehicleId}
              onChange={setVehicleId}
              allowCustom={false}
              options={vehicles.map((v) => ({
                value: v.id,
                label: `${v.vehicle_number} (${v.vehicle_type})`
              }))}
              placeholder="בחר/י אמבולנס"
            />
            <Combobox
              label="סוג משמרת"
              value={shift}
              onChange={(v) => setShift((v as any) || "בוקר")}
              allowCustom={false}
              options={[
                { value: "בוקר", label: "בוקר" },
                { value: "ערב", label: "ערב" },
                { value: "לילה", label: "לילה" }
              ]}
            />
            <Input label="נהג" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
            <Input label="איש צוות" value={crewName} onChange={(e) => setCrewName(e.target.value)} />
            <div className="md:col-span-2">
              <Textarea label="הערות כלליות" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </section>

        {items.length ? (
          <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
            <div className="border-b border-iaa-blue/10 px-5 py-4 text-lg font-extrabold text-iaa-blue md:px-6 md:text-xl">
              ציוד נדרש
            </div>
            <div className="divide-y divide-iaa-blue/10">
              {items.map((it, idx) => (
                <div key={it.equipment_id} className="px-5 py-3 md:px-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-iaa-blue md:text-base">
                        {idx + 1}. {it.item_name}
                      </div>
                      <div className="text-xs font-semibold text-iaa-blue/60">כמות נדרשת: {it.required_quantity}</div>
                    </div>
                    <div className="flex w-full flex-col gap-2 md:w-[320px]">
                      <Input
                        label="כמות קיימת"
                        value={it.actual_quantity}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((row) =>
                              row.equipment_id === it.equipment_id
                                ? { ...row, actual_quantity: e.target.value.replace(/[^\d]/g, "") }
                                : row
                            )
                          )
                        }
                        inputMode="numeric"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {["תקין", "חסר", "פגום"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={[
                              "h-10 rounded-xl text-sm font-extrabold",
                              it.condition === c ? "bg-iaa-blue text-white" : "bg-iaa-blue/[0.05] text-iaa-blue"
                            ].join(" ")}
                            onClick={() =>
                              setItems((prev) =>
                                prev.map((row) =>
                                  row.equipment_id === it.equipment_id ? { ...row, condition: c as any } : row
                                )
                              )
                            }
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : vehicleId ? (
          <div className="rounded-3xl border border-iaa-blue/10 bg-iaa-blue/[0.02] p-6 text-center text-sm font-semibold text-iaa-blue/70">
            לא הוגדרה רשימת ציוד לאמבולנס זה. יש להגדיר ב־`/admin/vehicles/[id]/equipment`.
          </div>
        ) : null}

        <div className="sticky bottom-0 border-t border-iaa-blue/10 bg-white/95 px-4 py-3 backdrop-blur">
          <Button type="button" size="lg" className="w-full" disabled={busy || !vehicleId || !items.length} onClick={submit}>
            {busy ? "שומר..." : "שמירה"}
          </Button>
        </div>
      </div>
    </main>
  );
}

