import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { logCallEvent } from "@/lib/audit";

const schema = z.object({
  driver_id: z.string().uuid(),
  vehicle_id: z.string().uuid()
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

  const admin = createSupabaseAdmin();

  const { data: drv, error: drvErr } = await admin.from("drivers").select("id,name,phone,status").eq("id", parsed.driver_id).single();
  if (drvErr || !drv || drv.status !== "פעיל") {
    return NextResponse.json({ ok: false, error: "driver_not_active" }, { status: 400 });
  }
  const { data: veh, error: vehErr } = await admin
    .from("vehicles")
    .select("id,vehicle_number,plate,status")
    .eq("id", parsed.vehicle_id)
    .single();
  if (vehErr || !veh) return NextResponse.json({ ok: false, error: "vehicle_not_found" }, { status: 400 });
  if (veh.status !== "פנוי") return NextResponse.json({ ok: false, error: "vehicle_not_available" }, { status: 400 });

  const { data: updated, error: upErr } = await admin
    .from("calls")
    .update({
      driver_id: drv.id,
      vehicle_id: veh.id,
      status: "שובצה",
      driver: drv.name,
      vehicle_no: veh.vehicle_number
    })
    .eq("id", id)
    .select(
      "id,call_no,created_at,created_by,status,date,time,call_type,first_name,last_name,national_id,from_place,from_department,to_place,to_department,health_fund,contact_name,contact_phone,obligation_number,driver,vehicle_no,notes,closed_at"
    )
    .single();

  if (upErr || !updated) return NextResponse.json({ ok: false, error: upErr?.message || "update_failed" }, { status: 400 });

  await admin.from("vehicles").update({ status: "במשימה" }).eq("id", veh.id);

  await logCallEvent({
    call_id: id,
    actor_user_id: user.id,
    actor_role: (me?.role as any) || null,
    event_type: "call.assigned",
    event_data: { driver_id: drv.id, vehicle_id: veh.id }
  });

  // WhatsApp notification (via internal webhook forwarder) — best effort
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const internalSecret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (baseUrl) {
    fetch(`${baseUrl.replace(/\/$/, "")}/api/webhooks/whatsapp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(internalSecret ? { "x-iaa-internal-secret": internalSecret } : {})
      },
      body: JSON.stringify({
        event: "call.assigned",
        sent_at: new Date().toISOString(),
        call: updated,
        assignment: {
          driver_name: drv.name,
          driver_phone: drv.phone,
          vehicle_number: veh.vehicle_number,
          vehicle_plate: veh.plate
        }
      })
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

