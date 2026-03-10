"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Combobox } from "@/components/ui/Combobox";

export default function RequestAccessPage() {
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [nationalId, setNationalId] = React.useState("");
  const [role, setRole] = React.useState<"dispatcher" | "driver">("dispatcher");
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-iaa-blue to-[#071a3a] px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-3xl bg-white/95 p-6 shadow-soft backdrop-blur md:p-8">
          <div className="mb-2 text-2xl font-extrabold text-iaa-blue md:text-3xl">בקשת הרשמה</div>
          <div className="mb-8 text-base font-semibold text-iaa-blue/70 md:text-lg">
            לאחר שליחה, הבקשה תעבור לאישור אדמין.
          </div>

          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setResult(null);
              const r = await fetch("/api/auth/request-access", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  full_name: fullName,
                  phone,
                  national_id: nationalId,
                  role_requested: role,
                  notes
                })
              });
              const data = (await r.json()) as { ok: boolean; error?: string };
              setLoading(false);
              if (!r.ok || !data.ok) {
                setResult({ ok: false, message: "לא הצלחנו לשלוח את הבקשה. בדוק/י פרטים ונסה/י שוב." });
                return;
              }
              setResult({ ok: true, message: "הבקשה נשלחה בהצלחה. תקבל/י עדכון לאחר בדיקת אדמין." });
              setFullName("");
              setPhone("");
              setNationalId("");
              setRole("dispatcher");
              setNotes("");
            }}
          >
            <Input
              label="שם מלא"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="שם פרטי + שם משפחה"
            />
            <Input
              label="מספר טלפון"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="053-2321101"
              inputMode="tel"
              autoComplete="tel"
            />
            <Input
              label="תעודת זהות"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value.replace(/[^\d]/g, ""))}
              required
              inputMode="numeric"
              placeholder="123456789"
            />
            <Combobox
              label="תפקיד"
              value={role}
              onChange={(v) => setRole((v as "dispatcher" | "driver") || "dispatcher")}
              options={[
                { value: "dispatcher", label: "מוקד/ת שיבוץ" },
                { value: "driver", label: "נהג/ת" }
              ]}
              allowCustom={false}
              required
            />
            <Textarea label="הערות" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="אופציונלי" />

            {result ? (
              <div
                className={[
                  "rounded-2xl px-5 py-4 font-bold",
                  result.ok ? "border border-iaa-gold/30 bg-white text-iaa-blue" : "border border-red-200 bg-red-50 text-red-700"
                ].join(" ")}
              >
                {result.message}
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "שולח..." : "שליחת בקשה"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

