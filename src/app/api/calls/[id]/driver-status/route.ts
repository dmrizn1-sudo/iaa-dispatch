import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { logCallEvent } from "@/lib/audit";

const schema = z.object({
  status: z.enum(["בדרך", "הגיע", "הסתיים"])
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const supabase = createSupabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const { data: me } = await supabase.from("app_users").select("role,status,phone").eq("auth_user_id", user.id).maybeSingle();
  if (me?.status !== "approved" || me?.role !== "driver") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const json = await req.json();
  const parsed = schema.parse(json);

  const admin = createSupabaseAdmin();

  const { data: drv } = await admin.from("drivers").select("id,phone,status").eq("phone", me.phone).maybeSingle();
  if (!drv || drv.status !== "פעיל") return NextResponse.json({ ok: false, error: "driver_not_active" }, { status: 400 });

  const { data: call } = await admin.from("calls").select("id,status,driver_id,vehicle_id").eq("id", id).maybeSingle();
  if (!call || call.driver_id !== drv.id) return NextResponse.json({ ok: false, error: "not_assigned" }, { status: 403 });

  let nextStatus: string = parsed.status;
  if (parsed.status === "הסתיים") nextStatus = "ממתין חשבונית";

  const { error } = await admin.from("calls").update({ status: nextStatus }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await logCallEvent({
    call_id: id,
    actor_user_id: user.id,
    actor_role: "driver",
    event_type: "call.status_change",
    event_data: { from: call.status, to: nextStatus }
  });

  if (parsed.status === "הסתיים" && call.vehicle_id) {
    await admin.from("vehicles").update({ status: "פנוי" }).eq("id", call.vehicle_id);
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}

