"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Combobox } from "@/components/ui/Combobox";
import { Button } from "@/components/ui/Button";

type Item = {
  id: string;
  item_name: string;
  category: string;
  required_quantity: number;
  equipment_type: string;
  notes: string | null;
  created_at: string;
};

const CATEGORIES = ["airway", "breathing", "circulation", "trauma", "monitoring", "medications", "immobilization", "general"] as const;
const TYPES = ["BLS", "ALS", "both"] as const;

export default function EquipmentAdminClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = React.useState<Item[]>(initialItems);
  const [q, setQ] = React.useState("");
  const [catFilter, setCatFilter] = React.useState<string>("");
  const [typeFilter, setTypeFilter] = React.useState<string>("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const [create, setCreate] = React.useState({
    item_name: "",
    category: "general" as string,
    required_quantity: "1",
    equipment_type: "both" as string,
    notes: ""
  });

  const filtered = React.useMemo(
    () =>
      items.filter((i) => {
        if (q && !i.item_name.includes(q) && !(i.notes || "").includes(q)) return false;
        if (catFilter && i.category !== catFilter) return false;
        if (typeFilter && i.equipment_type !== typeFilter) return false;
        return true;
      }),
    [items, q, catFilter, typeFilter]
  );

  async function createItem() {
    setBusy("create");
    setMsg(null);
    const body = {
      item_name: create.item_name,
      category: create.category,
      required_quantity: Number(create.required_quantity || "1"),
      equipment_type: create.equipment_type,
      notes: create.notes || null
    };
    const r = await fetch("/api/admin/equipment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = (await r.json()) as { ok: boolean; id?: string };
    setBusy(null);
    if (!r.ok || !data.ok || !data.id) {
      setMsg("יצירת פריט ציוד נכשלה.");
      return;
    }
    setMsg("נוסף פריט ציוד.");
    setCreate({ item_name: "", category: create.category, required_quantity: "1", equipment_type: create.equipment_type, notes: "" });
  }

  async function deleteItem(id: string) {
    if (!confirm("למחוק פריט ציוד זה?")) return;
    setBusy("del:" + id);
    setMsg(null);
    const r = await fetch(`/api/admin/equipment?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = (await r.json()) as { ok: boolean };
    setBusy(null);
    if (!r.ok || !data.ok) {
      setMsg("מחיקה נכשלה.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setMsg("נמחק.");
  }

  return (
    <div className="space-y-6">
      {msg ? <div className="rounded-2xl border border-iaa-blue/10 bg-white px-5 py-4 text-sm font-bold text-iaa-blue">{msg}</div> : null}

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">פילטרים</div>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-3 md:px-6">
          <Input label="חיפוש" value={q} onChange={(e) => setQ(e.target.value)} placeholder="שם פריט / הערה" />
          <Combobox
            label="קטגוריה"
            value={catFilter}
            onChange={setCatFilter}
            options={[{ value: "", label: "הכול" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
            allowCustom={false}
          />
          <Combobox
            label="סוג ציוד"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ value: "", label: "הכול" }, ...TYPES.map((t) => ({ value: t, label: t }))]}
            allowCustom={false}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">הוספת פריט ציוד</div>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2 md:px-6">
          <Input label="שם פריט" value={create.item_name} onChange={(e) => setCreate((p) => ({ ...p, item_name: e.target.value }))} />
          <Combobox
            label="קטגוריה"
            value={create.category}
            onChange={(v) => setCreate((p) => ({ ...p, category: v || "general" }))}
            allowCustom={false}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="כמות נדרשת"
            value={create.required_quantity}
            onChange={(e) => setCreate((p) => ({ ...p, required_quantity: e.target.value.replace(/[^\d]/g, "") }))}
            inputMode="numeric"
          />
          <Combobox
            label="סוג ציוד"
            value={create.equipment_type}
            onChange={(v) => setCreate((p) => ({ ...p, equipment_type: v || "both" }))}
            allowCustom={false}
            options={TYPES.map((t) => ({ value: t, label: t }))}
          />
          <div className="md:col-span-2">
            <Textarea label="הערות" value={create.notes} onChange={(e) => setCreate((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button type="button" size="lg" className="w-full" onClick={createItem} disabled={busy === "create"}>
              {busy === "create" ? "שומר..." : "הוספה"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="flex items-center justify-between gap-4 border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">רשימת ציוד</div>
          <div className="text-sm font-semibold text-iaa-blue/60">{filtered.length}</div>
        </div>
        <div className="divide-y divide-iaa-blue/10">
          {filtered.length ? (
            filtered.map((i) => (
              <div key={i.id} className="px-5 py-4 md:px-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-base font-extrabold text-iaa-blue md:text-lg">{i.item_name}</div>
                    <div className="text-xs font-semibold text-iaa-blue/60">
                      קטגוריה: {i.category} • סוג: {i.equipment_type} • כמות נדרשת: {i.required_quantity}
                    </div>
                    {i.notes ? <div className="mt-1 text-xs font-semibold text-iaa-blue/70">הערות: {i.notes}</div> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="danger" size="md" disabled={busy === "del:" + i.id} onClick={() => deleteItem(i.id)}>
                      מחיקה
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-sm font-semibold text-iaa-blue/60 md:px-6">אין פריטי ציוד</div>
          )}
        </div>
      </section>
    </div>
  );
}

