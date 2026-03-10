"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Combobox } from "@/components/ui/Combobox";
import { Modal } from "@/components/ui/Modal";

type VehicleRow = {
  id: string;
  vehicle_number: string;
  vehicle_type: "אמבולנס ביטחון" | "אמבולנס ALS" | "אמבולנס רגיל";
  plate: string;
  status: "פנוי" | "במשימה" | "תחזוקה";
  notes: string | null;
  created_at: string;
};

const VEHICLE_TYPES: VehicleRow["vehicle_type"][] = ["אמבולנס ביטחון", "אמבולנס ALS", "אמבולנס רגיל"];
const VEHICLE_STATUSES: VehicleRow["status"][] = ["פנוי", "במשימה", "תחזוקה"];

export default function AdminVehiclesClient({ initialVehicles }: { initialVehicles: VehicleRow[] }) {
  const [vehicles, setVehicles] = React.useState<VehicleRow[]>(initialVehicles);
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [create, setCreate] = React.useState({
    vehicle_number: "",
    vehicle_type: "אמבולנס רגיל" as VehicleRow["vehicle_type"],
    plate: "",
    status: "פנוי" as VehicleRow["status"],
    notes: ""
  });

  const [edit, setEdit] = React.useState<null | VehicleRow>(null);

  const filtered = React.useMemo(() => {
    const s = q.trim();
    if (!s) return vehicles;
    return vehicles.filter(
      (v) =>
        v.vehicle_number.includes(s) ||
        v.plate.includes(s) ||
        v.vehicle_type.includes(s) ||
        v.status.includes(s) ||
        (v.notes || "").includes(s)
    );
  }, [vehicles, q]);

  async function createVehicle() {
    setBusy("create");
    setMsg(null);
    const r = await fetch("/api/admin/vehicles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(create)
    });
    const data = (await r.json()) as { ok: boolean; id?: string };
    setBusy(null);
    if (!r.ok || !data.ok || !data.id) {
      setMsg("יצירת רכב נכשלה. בדוק/י פרטים ותוודא/י הרשאות אדמין.");
      return;
    }
    setMsg("נוסף רכב בהצלחה");
    setCreate({ vehicle_number: "", vehicle_type: "אמבולנס רגיל", plate: "", status: "פנוי", notes: "" });
  }

  async function updateVehicle(id: string, patch: Record<string, unknown>) {
    setBusy("edit:" + id);
    setMsg(null);
    const r = await fetch("/api/admin/vehicles", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...patch })
    });
    const data = (await r.json()) as { ok: boolean };
    setBusy(null);
    if (!r.ok || !data.ok) {
      setMsg("עדכון רכב נכשל.");
      return;
    }
    setVehicles((prev) => prev.map((v) => (v.id === id ? ({ ...v, ...(patch as any) } as VehicleRow) : v)));
    setEdit(null);
    setMsg("עודכן בהצלחה");
  }

  return (
    <div className="space-y-6">
      {msg ? <div className="rounded-2xl border border-iaa-blue/10 bg-white px-5 py-4 font-bold text-iaa-blue">{msg}</div> : null}

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">חיפוש</div>
        </div>
        <div className="px-5 py-5 md:px-6">
          <Input label="חיפוש רכב" value={q} onChange={(e) => setQ(e.target.value)} placeholder="מספר רכב / לוחית / סוג / סטטוס" />
        </div>
      </section>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">הוספת רכב</div>
        </div>
        <div className="grid grid-cols-1 gap-5 px-5 py-5 md:grid-cols-2 md:px-6">
          <Input label="מספר רכב" value={create.vehicle_number} onChange={(e) => setCreate((p) => ({ ...p, vehicle_number: e.target.value }))} required />
          <Input label="לוחית רישוי" value={create.plate} onChange={(e) => setCreate((p) => ({ ...p, plate: e.target.value }))} required />
          <Combobox
            label="סוג רכב"
            value={create.vehicle_type}
            onChange={(v) => setCreate((p) => ({ ...p, vehicle_type: (v as any) || "אמבולנס רגיל" }))}
            allowCustom={false}
            options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <Combobox
            label="סטטוס"
            value={create.status}
            onChange={(v) => setCreate((p) => ({ ...p, status: (v as any) || "פנוי" }))}
            allowCustom={false}
            options={VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))}
          />
          <div className="md:col-span-2">
            <Textarea label="הערות" value={create.notes} onChange={(e) => setCreate((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button type="button" size="lg" className="w-full" onClick={createVehicle} disabled={busy === "create"}>
              {busy === "create" ? "שומר..." : "הוספה"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="flex items-center justify-between gap-4 border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">רשימת רכבים</div>
          <div className="text-sm font-semibold text-iaa-blue/60">{filtered.length}</div>
        </div>
        <div className="divide-y divide-iaa-blue/10">
          {filtered.length ? (
            filtered.map((v) => (
              <div key={v.id} className="px-5 py-4 md:px-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-base font-extrabold text-iaa-blue md:text-lg">{v.vehicle_number}</div>
                    <div className="text-sm font-semibold text-iaa-blue/70">
                      סוג: {v.vehicle_type} • לוחית: {v.plate} • סטטוס: {v.status}
                    </div>
                    {v.notes ? <div className="mt-2 text-sm font-semibold text-iaa-blue/70">הערות: {v.notes}</div> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    <Button type="button" variant="secondary" onClick={() => setEdit(v)}>
                      עריכה
                    </Button>
                    <Combobox
                      label="סטטוס מהיר"
                      value={v.status}
                      onChange={(st) => updateVehicle(v.id, { status: st })}
                      allowCustom={false}
                      options={VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-sm font-semibold text-iaa-blue/60 md:px-6">לא נמצאו רכבים</div>
          )}
        </div>
      </section>

      <Modal
        open={!!edit}
        title="עריכת רכב"
        onClose={() => setEdit(null)}
        footer={
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="lg" className="flex-1" type="button" onClick={() => setEdit(null)}>
              ביטול
            </Button>
            <Button
              size="lg"
              className="flex-1"
              type="button"
              onClick={() =>
                edit
                  ? updateVehicle(edit.id, {
                      vehicle_number: edit.vehicle_number,
                      vehicle_type: edit.vehicle_type,
                      plate: edit.plate,
                      status: edit.status,
                      notes: edit.notes
                    })
                  : null
              }
              disabled={busy?.startsWith("edit:") || false}
            >
              שמירה
            </Button>
          </div>
        }
      >
        {edit ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input label="מספר רכב" value={edit.vehicle_number} onChange={(e) => setEdit((p) => (p ? { ...p, vehicle_number: e.target.value } : p))} />
            <Input label="לוחית רישוי" value={edit.plate} onChange={(e) => setEdit((p) => (p ? { ...p, plate: e.target.value } : p))} />
            <Combobox
              label="סוג רכב"
              value={edit.vehicle_type}
              onChange={(v) => setEdit((p) => (p ? { ...p, vehicle_type: (v as any) || "אמבולנס רגיל" } : p))}
              allowCustom={false}
              options={VEHICLE_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <Combobox
              label="סטטוס"
              value={edit.status}
              onChange={(v) => setEdit((p) => (p ? { ...p, status: (v as any) || "פנוי" } : p))}
              allowCustom={false}
              options={VEHICLE_STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <div className="md:col-span-2">
              <Textarea label="הערות" value={edit.notes || ""} onChange={(e) => setEdit((p) => (p ? { ...p, notes: e.target.value } : p))} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

