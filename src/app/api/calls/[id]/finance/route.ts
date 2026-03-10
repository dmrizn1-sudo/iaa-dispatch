import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { logCallEvent } from "@/lib/audit";

const schema = z.object({
  invoice_number: z.string().min(1),
  receipt_number: z.string().min(1),
  payment_status: z.enum(["לא שולם", "שולם מזומן", "שולם אשראי", "שולם קופת חולים", "שולם העברה בנקאית"]),
  payment_method: z.string().optional().nullable(),
  amount: z.number().nonnegative().optional().nullable(),
  finance_notes: z.string().optional().nullable(),
  close: z.boolean().optional().default(true)
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createSupabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const { data: me } = await supabase.from("app_users").select("role,status").eq("auth_user_id", user.id).maybeSingle();
  if (me?.status !== "approved" || (me?.role !== "admin" && me?.role !== "dispatcher")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const json = await req.json();
  const parsed = schema.parse(json);

  if (!parsed.invoice_number || !parsed.receipt_number) {
    return NextResponse.json(
      { ok: false, error: "missing_invoice_or_receipt", message: "לא ניתן לסגור קריאה ללא הזנת חשבונית וקבלה" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdmin();

  const update: Record<string, unknown> = {
    invoice_number: parsed.invoice_number,
    receipt_number: parsed.receipt_number,
    payment_status: parsed.payment_status,
    payment_method: parsed.payment_method ?? null,
    amount: parsed.amount ?? null,
    finance_notes: parsed.finance_notes ?? null
  };

  if (parsed.close) {
    update.status = "נסגר";
    update.closed_at = new Date().toISOString();
    update.closed_by = user.id;
  }

  const { data: before } = await admin.from("calls").select("status").eq("id", id).maybeSingle();
  const { error } = await admin.from("calls").update(update).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await logCallEvent({
    call_id: id,
    actor_user_id: user.id,
    actor_role: (me?.role as any) || null,
    event_type: "call.finance_updated",
    event_data: { invoice_number: parsed.invoice_number, receipt_number: parsed.receipt_number, payment_status: parsed.payment_status }
  });

  if (parsed.close) {
    await logCallEvent({
      call_id: id,
      actor_user_id: user.id,
      actor_role: (me?.role as any) || null,
      event_type: "call.closed",
      event_data: { from: before?.status, to: "נסגר" }
    });
  }

  return NextResponse.json({ ok: true });
}

