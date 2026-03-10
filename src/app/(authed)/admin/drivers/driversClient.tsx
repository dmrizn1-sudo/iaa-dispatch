"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Combobox } from "@/components/ui/Combobox";
import { Modal } from "@/components/ui/Modal";

type DriverRow = {
  id: string;
  name: string;
  phone: string;
  license_type: string | null;
  status: "פעיל" | "לא פעיל";
  national_id_last4: string | null;
  notes: string | null;
  created_at: string;
};

export default function AdminDriversClient({ initialDrivers }: { initialDrivers: DriverRow[] }) {
  const [drivers, setDrivers] = React.useState<DriverRow[]>(initialDrivers);
  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [create, setCreate] = React.useState({
    name: "",
    phone: "",
    national_id: "",
    license_type: "",
    status: "פעיל" as "פעיל" | "לא פעיל",
    notes: ""
  });

  const [edit, setEdit] = React.useState<null | (DriverRow & { national_id?: string })>(null);

  const filtered = React.useMemo(() => {
    const s = q.trim();
    if (!s) return drivers;
    return drivers.filter(
      (d) =>
        d.name.includes(s) ||
        d.phone.includes(s) ||
        (d.license_type || "").includes(s) ||
        (d.national_id_last4 || "").includes(s)
    );
  }, [drivers, q]);

  async function createDriver() {
    setBusy("create");
    setMsg(null);
    const r = await fetch("/api/admin/drivers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(create)
    });
    const data = (await r.json()) as { ok: boolean; id?: string };
    setBusy(null);
    if (!r.ok || !data.ok || !data.id) {
      setMsg("יצירת נהג נכשלה. בדוק/י פרטים ותוודא/י הרשאות אדמין.");
      return;
    }
    setMsg("נוסף נהג בהצלחה");
    setCreate({ name: "", phone: "", national_id: "", license_type: "", status: "פעיל", notes: "" });
    // Lightweight refresh: fetch newest list is omitted for speed; user can refresh if needed.
  }

  async function updateDriver(patch: Record<string, unknown>) {
    if (!edit) return;
    setBusy("edit");
    setMsg(null);
    const r = await fetch("/api/admin/drivers", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: edit.id, ...patch })
    });
    const data = (await r.json()) as { ok: boolean };
    setBusy(null);
    if (!r.ok || !data.ok) {
      setMsg("עדכון נהג נכשל.");
      return;
    }
    setDrivers((prev) =>
      prev.map((d) => (d.id === edit.id ? ({ ...d, ...(patch as any) } as DriverRow) : d))
    );
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
          <Input label="חיפוש נהג" value={q} onChange={(e) => setQ(e.target.value)} placeholder="שם / טלפון / רישיון / 4 אחרונות ת״ז" />
        </div>
      </section>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">הוספת נהג</div>
        </div>
        <div className="grid grid-cols-1 gap-5 px-5 py-5 md:grid-cols-2 md:px-6">
          <Input label="שם נהג" value={create.name} onChange={(e) => setCreate((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="מספר טלפון" value={create.phone} onChange={(e) => setCreate((p) => ({ ...p, phone: e.target.value }))} required inputMode="tel" />
          <Input label="תעודת זהות" value={create.national_id} onChange={(e) => setCreate((p) => ({ ...p, national_id: e.target.value.replace(/[^\d]/g, "") }))} required inputMode="numeric" />
          <Input label="סוג רישיון" value={create.license_type} onChange={(e) => setCreate((p) => ({ ...p, license_type: e.target.value }))} placeholder="B / C / ... (אופציונלי)" />
          <Combobox
            label="סטטוס"
            value={create.status}
            onChange={(v) => setCreate((p) => ({ ...p, status: (v as any) || "פעיל" }))}
            allowCustom={false}
            options={[
              { value: "פעיל", label: "פעיל" },
              { value: "לא פעיל", label: "לא פעיל" }
            ]}
          />
          <div className="md:col-span-2">
            <Textarea label="הערות" value={create.notes} onChange={(e) => setCreate((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button type="button" size="lg" className="w-full" onClick={createDriver} disabled={busy === "create"}>
              {busy === "create" ? "שומר..." : "הוספה"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="flex items-center justify-between gap-4 border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">רשימת נהגים</div>
          <div className="text-sm font-semibold text-iaa-blue/60">{filtered.length}</div>
        </div>
        <div className="divide-y divide-iaa-blue/10">
          {filtered.length ? (
            filtered.map((d) => (
              <div key={d.id} className="px-5 py-4 md:px-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-base font-extrabold text-iaa-blue md:text-lg">{d.name}</div>
                    <div className="text-sm font-semibold text-iaa-blue/70">
                      טלפון: {d.phone} • רישיון: {d.license_type || "—"} • סטטוס: {d.status} • ת״ז (4 אחרונות): {d.national_id_last4 || "—"}
                    </div>
                    {d.notes ? <div className="mt-2 text-sm font-semibold text-iaa-blue/70">הערות: {d.notes}</div> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    <Button type="button" variant="secondary" onClick={() => setEdit(d)}>
                      עריכה
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => updateDriver({ status: d.status === "פעיל" ? "לא פעיל" : "פעיל" })}
                      disabled={busy === "edit"}
                    >
                      {d.status === "פעיל" ? "השבתה" : "הפעלה"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-sm font-semibold text-iaa-blue/60 md:px-6">לא נמצאו נהגים</div>
          )}
        </div>
      </section>

      <Modal
        open={!!edit}
        title="עריכת נהג"
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
                updateDriver({
                  name: edit?.name,
                  phone: edit?.phone,
                  license_type: edit?.license_type,
                  status: edit?.status,
                  notes: edit?.notes,
                  ...(edit?.national_id ? { national_id: edit.national_id } : {})
                })
              }
              disabled={busy === "edit"}
            >
              שמירה
            </Button>
          </div>
        }
      >
        {edit ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input label="שם נהג" value={edit.name} onChange={(e) => setEdit((p) => (p ? { ...p, name: e.target.value } : p))} />
            <Input label="מספר טלפון" value={edit.phone} onChange={(e) => setEdit((p) => (p ? { ...p, phone: e.target.value } : p))} />
            <Input
              label="תעודת זהות (חדש)"
              value={edit.national_id || ""}
              onChange={(e) => setEdit((p) => (p ? { ...p, national_id: e.target.value.replace(/[^\d]/g, "") } : p))}
              placeholder="להשאיר ריק כדי לא לשנות"
              inputMode="numeric"
            />
            <Input
              label="סוג רישיון"
              value={edit.license_type || ""}
              onChange={(e) => setEdit((p) => (p ? { ...p, license_type: e.target.value } : p))}
            />
            <Combobox
              label="סטטוס"
              value={edit.status}
              onChange={(v) => setEdit((p) => (p ? { ...p, status: (v as any) || "פעיל" } : p))}
              allowCustom={false}
              options={[
                { value: "פעיל", label: "פעיל" },
                { value: "לא פעיל", label: "לא פעיל" }
              ]}
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

