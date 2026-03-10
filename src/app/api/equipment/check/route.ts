import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  vehicle_id: z.string().uuid(),
  driver_id: z.string().uuid().optional().nullable(),
  shift: z.enum(["בוקר", "ערב", "לילה"]),
  date: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      equipment_id: z.string().uuid(),
      required_quantity: z.number().int().nonnegative(),
      actual_quantity: z.number().int().nonnegative(),
      condition: z.enum(["תקין", "חסר", "פגום"]),
      notes: z.string().optional().nullable()
    })
  ),
  // Signatures can be added later (signature pad). For now, we accept none.
});

export async function POST(req: Request) {
  const supabase = createSupabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const { data: me } = await supabase.from("app_users").select("role,status").eq("auth_user_id", user.id).maybeSingle();
  if (!me || me.status !== "approved") return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const json = await req.json();
  const parsed = schema.parse(json);

  const admin = createSupabaseAdmin();

  const reportDate = parsed.date ? new Date(parsed.date) : new Date();

  const { data: report, error } = await admin
    .from("equipment_check_reports")
    .insert({
      vehicle_id: parsed.vehicle_id,
      driver_id: parsed.driver_id ?? null,
      checked_by: user.id,
      date: reportDate.toISOString().slice(0, 10),
      shift: parsed.shift,
      status: "completed",
      notes: parsed.notes ?? null
    })
    .select("id")
    .single();

  if (error || !report) return NextResponse.json({ ok: false, error: error?.message || "insert_failed" }, { status: 400 });

  const rows = parsed.items.map((i) => ({
    report_id: report.id,
    equipment_id: i.equipment_id,
    required_quantity: i.required_quantity,
    actual_quantity: i.actual_quantity,
    condition: i.condition,
    notes: i.notes ?? null
  }));

  const { error: itemsErr } = await admin.from("equipment_check_items").insert(rows);
  if (itemsErr) return NextResponse.json({ ok: false, error: itemsErr.message }, { status: 400 });

  // Update aggregate info on vehicle_equipment and alerts
  for (const it of parsed.items) {
    await admin
      .from("vehicle_equipment")
      .update({ last_checked: new Date().toISOString(), status: it.condition })
      .eq("vehicle_id", parsed.vehicle_id)
      .eq("equipment_id", it.equipment_id);

    if (it.condition !== "תקין") {
      await admin.from("equipment_alerts").insert({
        vehicle_id: parsed.vehicle_id,
        report_id: report.id,
        equipment_id: it.equipment_id,
        condition: it.condition,
        message: it.condition === "חסר" ? "חוסר ציוד באמבולנס" : "ציוד פגום באמבולנס"
      });
    }
  }

  // Signatures can be implemented later with a dedicated table and signature pad UI.

  return NextResponse.json({ ok: true, report_id: report.id });
}

