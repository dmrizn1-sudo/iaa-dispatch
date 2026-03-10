"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Combobox } from "@/components/ui/Combobox";
import { Modal } from "@/components/ui/Modal";
import { CALL_TYPES, HEALTH_FUNDS } from "@/lib/calls";

const schema = z.object({
  date: z.string().min(1, "שדה חובה"),
  time: z.string().min(1, "שדה חובה"),
  call_type: z.string().min(1, "שדה חובה"),
  first_name: z.string().min(1, "שדה חובה"),
  last_name: z.string().min(1, "שדה חובה"),
  national_id: z.string().min(5, "מספר זהות לא תקין"),
  from_place: z.string().min(1, "שדה חובה"),
  from_department: z.string().optional().default(""),
  to_place: z.string().min(1, "שדה חובה"),
  to_department: z.string().optional().default(""),
  health_fund: z.string().optional().default(""),
  contact_name: z.string().optional().default(""),
  contact_phone: z.string().optional().default(""),
  commitment_no: z.string().optional().default(""),
  driver: z.string().optional().default(""),
  vehicle_no: z.string().optional().default(""),
  notes: z.string().optional().default("")
});

type FormState = z.infer<typeof schema>;

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function nowHHMM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function NewCallPage() {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>({
    date: todayISO(),
    time: nowHHMM(),
    call_type: CALL_TYPES[0].value,
    first_name: "",
    last_name: "",
    national_id: "",
    from_place: "",
    from_department: "",
    to_place: "",
    to_department: "",
    health_fund: "",
    contact_name: "",
    contact_phone: "",
    commitment_no: "",
    driver: "",
    vehicle_no: "",
    notes: ""
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [showOptional, setShowOptional] = React.useState(false);
  const firstNameRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  const set = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function validate(): boolean {
    const res = schema.safeParse(form);
    if (res.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    for (const issue of res.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return false;
  }

  async function doSave() {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Log exactly what we're about to send to the API
      // so we can confirm submit is firing and payload shape.
      console.log("[NEW CALL] submitting payload", form);
      const r = await fetch("/api/calls", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await r.json()) as { ok: boolean; call_no?: number; error?: string };
      console.log("[NEW CALL] response status", r.status, "body", data);
      if (!r.ok || !data.ok || !data.call_no) {
        throw new Error(data.error || "שגיאה בשמירה");
      }
      // Visible Hebrew alert on success
      alert("הקריאה נשמרה");
      router.replace("/dashboard");
    } catch (e) {
      console.error("[NEW CALL] save failed", e);
      setSaveError(e instanceof Error ? e.message : "שגיאה בשמירה");
      // Visible Hebrew alert on failure
      alert(`שגיאה בשמירת הקריאה: ${e instanceof Error ? e.message : "שגיאה בשמירה"}`);
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await doSave();
  }

  return (
    <form className="pb-28 md:pb-32" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">קריאה חדשה</div>
          <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
            מילוי מהיר למגע — שדות גדולים, חיפוש, ושמירה דביקה
          </div>
        </div>
        <Button variant="secondary" size="lg" type="button" onClick={() => router.back()}>
          חזרה
        </Button>
      </div>

      {saveError ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
          {saveError}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="תאריך"
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
          required
          error={errors.date}
        />
        <Input
          label="שעה"
          type="time"
          value={form.time}
          onChange={(e) => set("time", e.target.value)}
          required
          error={errors.time}
        />

        <Combobox
          label="סוג קריאה"
          value={form.call_type}
          onChange={(v) => set("call_type", v)}
          options={CALL_TYPES.map((o) => ({ value: o.value, label: o.label }))}
          placeholder="בחר/י סוג"
          required
        />

        <Combobox
          label="קופת חולים"
          value={form.health_fund}
          onChange={(v) => set("health_fund", v)}
          options={HEALTH_FUNDS}
          placeholder="חיפוש/בחירה (אופציונלי)"
        />

        <Input
          label="שם פרטי"
          ref={(el) => {
            firstNameRef.current = el;
          }}
          value={form.first_name}
          onChange={(e) => set("first_name", e.target.value)}
          required
          error={errors.first_name}
          autoComplete="given-name"
          enterKeyHint="next"
        />
        <Input
          label="שם משפחה"
          value={form.last_name}
          onChange={(e) => set("last_name", e.target.value)}
          required
          error={errors.last_name}
          autoComplete="family-name"
          enterKeyHint="next"
        />

        <Input
          label="מספר זהות"
          value={form.national_id}
          onChange={(e) => set("national_id", e.target.value.replace(/[^\d]/g, ""))}
          required
          error={errors.national_id}
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="next"
          placeholder="לדוגמה: 123456789"
        />

        <Input
          label="מספר התחייבות"
          value={form.commitment_no}
          onChange={(e) => set("commitment_no", e.target.value)}
          inputMode="numeric"
          placeholder="אופציונלי"
        />

        <Combobox
          label="מאיזה מוסד / מקום"
          value={form.from_place}
          onChange={(v) => set("from_place", v)}
          options={[
            { value: "איכילוב", label: "איכילוב" },
            { value: "שיבא", label: "שיבא" },
            { value: "רמב״ם", label: "רמב״ם" },
            { value: "אחר", label: "אחר" }
          ]}
          placeholder="הקלד/י לחיפוש או הזן/י שם"
          required
        />

        <Input
          label="מאיזו מחלקה"
          value={form.from_department ?? ""}
          onChange={(e) => set("from_department", e.target.value)}
          placeholder="אופציונלי"
          enterKeyHint="next"
        />

        <Combobox
          label="לאיזה מוסד / מקום"
          value={form.to_place}
          onChange={(v) => set("to_place", v)}
          options={[
            { value: "איכילוב", label: "איכילוב" },
            { value: "שיבא", label: "שיבא" },
            { value: "רמב״ם", label: "רמב״ם" },
            { value: "אחר", label: "אחר" }
          ]}
          placeholder="הקלד/י לחיפוש או הזן/י שם"
          required
        />

        <Input
          label="לאיזו מחלקה"
          value={form.to_department ?? ""}
          onChange={(e) => set("to_department", e.target.value)}
          placeholder="אופציונלי"
          enterKeyHint="next"
        />

        <div className="md:col-span-2">
          <button
            type="button"
            className="w-full rounded-2xl border border-iaa-blue/10 bg-iaa-blue/[0.02] px-5 py-4 text-right font-extrabold text-iaa-blue"
            onClick={() => setShowOptional((p) => !p)}
          >
            {showOptional ? "הסתר פרטים נוספים" : "הצג פרטים נוספים (אופציונלי)"}
          </button>
        </div>

        {showOptional ? (
          <>
            <Input
              label="איש קשר"
              value={form.contact_name ?? ""}
              onChange={(e) => set("contact_name", e.target.value)}
              placeholder="אופציונלי"
              enterKeyHint="next"
            />
            <Input
              label="טלפון איש קשר"
              value={form.contact_phone ?? ""}
              onChange={(e) => set("contact_phone", e.target.value)}
              placeholder="05X-XXXXXXX"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
            />

            <Combobox
              label="נהג"
              value={form.driver ?? ""}
              onChange={(v) => set("driver", v)}
              options={[
                { value: "—", label: "—" },
                { value: "נהג 1", label: "נהג 1" },
                { value: "נהג 2", label: "נהג 2" }
              ]}
              placeholder="חיפוש/בחירה (אופציונלי)"
            />

            <Combobox
              label="מספר רכב"
              value={form.vehicle_no ?? ""}
              onChange={(v) => set("vehicle_no", v)}
              options={[
                { value: "—", label: "—" },
                { value: "אמבולנס 21", label: "אמבולנס 21" },
                { value: "אמבולנס 22", label: "אמבולנס 22" }
              ]}
              placeholder="חיפוש/בחירה (אופציונלי)"
            />

            <div className="md:col-span-2">
              <Textarea
                label="הערות"
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="פרטים חשובים למפעיל/נהג…"
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-iaa-blue/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={() => {
              if (validate()) setPreviewOpen(true);
            }}
          >
            תצוגה מקדימה
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={saving}>
            {saving ? "שומר..." : "שמירה"}
          </Button>
        </div>
      </div>

      <Modal
        open={previewOpen}
        title="תצוגה מקדימה לפני אישור"
        onClose={() => setPreviewOpen(false)}
        footer={
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="lg" className="flex-1" type="button" onClick={() => setPreviewOpen(false)}>
              חזרה לעריכה
            </Button>
            <Button
              size="lg"
              className="flex-1"
              type="button"
              onClick={async () => {
                setPreviewOpen(false);
                await doSave();
              }}
              disabled={saving}
            >
              אישור ושמירה
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PreviewItem label="תאריך/שעה" value={`${form.date} ${form.time}`} />
          <PreviewItem label="סוג קריאה" value={form.call_type} />
          <PreviewItem label="שם" value={`${form.first_name} ${form.last_name}`} />
          <PreviewItem label="ת״ז" value={form.national_id} />
          <PreviewItem label="מ־" value={`${form.from_place}${form.from_department ? ` — ${form.from_department}` : ""}`} />
          <PreviewItem label="ל־" value={`${form.to_place}${form.to_department ? ` — ${form.to_department}` : ""}`} />
          <PreviewItem label="קופת חולים" value={form.health_fund || "—"} />
          <PreviewItem label="איש קשר" value={form.contact_name || "—"} />
          <PreviewItem label="טלפון" value={form.contact_phone || "—"} />
          <PreviewItem label="התחייבות" value={form.commitment_no || "—"} />
          <PreviewItem label="נהג" value={form.driver || "—"} />
          <PreviewItem label="רכב" value={form.vehicle_no || "—"} />
          <div className="md:col-span-2">
            <PreviewItem label="הערות" value={form.notes || "—"} />
          </div>
        </div>
      </Modal>
    </form>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-iaa-blue/10 bg-iaa-blue/[0.02] px-4 py-3">
      <div className="text-sm font-extrabold text-iaa-blue/70">{label}</div>
      <div className="mt-1 text-base font-bold text-iaa-blue md:text-lg">{value}</div>
    </div>
  );
}

