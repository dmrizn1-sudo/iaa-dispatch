"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";

const PAYMENTS = ["לא שולם", "שולם מזומן", "שולם אשראי", "שולם קופת חולים", "שולם העברה בנקאית"] as const;

export default function FinanceClient({
  callId,
  initial
}: {
  callId: string;
  initial: {
    status: string;
    invoice_number: string | null;
    receipt_number: string | null;
    payment_status: string | null;
    payment_method: string | null;
    amount: number | null;
    finance_notes: string | null;
  };
}) {
  const [invoice, setInvoice] = React.useState(initial.invoice_number || "");
  const [receipt, setReceipt] = React.useState(initial.receipt_number || "");
  const [payment, setPayment] = React.useState((initial.payment_status as any) || "לא שולם");
  const [method, setMethod] = React.useState(initial.payment_method || "");
  const [amount, setAmount] = React.useState(initial.amount != null ? String(initial.amount) : "");
  const [notes, setNotes] = React.useState(initial.finance_notes || "");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function submit(close: boolean) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    const r = await fetch(`/api/calls/${encodeURIComponent(callId)}/finance`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        invoice_number: invoice,
        receipt_number: receipt,
        payment_status: payment,
        payment_method: method || null,
        amount: amount ? Number(amount) : null,
        finance_notes: notes || null,
        close
      })
    });
    const data = (await r.json()) as { ok: boolean; message?: string; error?: string };
    setBusy(false);
    if (!r.ok || !data.ok) {
      setErr(data.message || "לא ניתן לסגור קריאה ללא הזנת חשבונית וקבלה");
      return;
    }
    setMsg(close ? "נסגר בהצלחה" : "נשמר בהצלחה");
  }

  return (
    <div className="rounded-3xl border border-iaa-blue/10 bg-white p-5 shadow-soft md:p-6">
      {err ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">{err}</div> : null}
      {msg ? <div className="mb-5 rounded-2xl border border-iaa-gold/30 bg-white px-5 py-4 font-bold text-iaa-blue">{msg}</div> : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input label="מספר חשבונית" value={invoice} onChange={(e) => setInvoice(e.target.value)} required />
        <Input label="מספר קבלה" value={receipt} onChange={(e) => setReceipt(e.target.value)} required />
        <Combobox
          label="אמצעי תשלום"
          value={payment}
          onChange={(v) => setPayment((v as any) || "לא שולם")}
          allowCustom={false}
          options={PAYMENTS.map((p) => ({ value: p, label: p }))}
        />
        <Input label="סכום" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="אופציונלי" />
        <Input label="Payment method (אופציונלי)" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="למשל: אשראי / העברה / קופה" />
        <div className="md:col-span-2">
          <Textarea label="הערות" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <Button type="button" variant="secondary" size="lg" className="flex-1" disabled={busy} onClick={() => submit(false)}>
          {busy ? "שומר..." : "שמירה ללא סגירה"}
        </Button>
        <Button type="button" size="lg" className="flex-1" disabled={busy} onClick={() => submit(true)}>
          {busy ? "סוגר..." : "סגירה"}
        </Button>
      </div>
    </div>
  );
}

