import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendApprovedCallToIntegrations } from "@/lib/integrations/webhookOut";
import type { CallWebhookPayload } from "@/lib/integrations/types";

const schema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  call_type: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  national_id: z.string().min(5),
  from_place: z.string().min(1),
  from_department: z.string().optional().nullable(),
  to_place: z.string().min(1),
  to_department: z.string().optional().nullable(),
  health_fund: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  commitment_no: z.string().optional().nullable(),
  driver: z.string().optional().nullable(),
  vehicle_no: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.parse(json);

    // Use admin client for inserts so that RLS/auth
    // do not block creating new calls. No login required.
    const admin = createSupabaseAdmin();
    const supabase = createSupabaseServer();

    const { data, error } = await admin
      .from("calls")
      .insert({
        ...parsed,
        status: "חדשה"
      })
      .select("id,call_no")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const { data: full } = await supabase
      .from("calls")
      .select(
        "id,call_no,created_at,created_by,status,date,time,call_type,first_name,last_name,national_id,from_place,from_department,to_place,to_department,health_fund,contact_name,contact_phone,commitment_no,driver,vehicle_no,notes,closed_at"
      )
      .eq("id", data.id)
      .single();

    if (full) {
      const payload: CallWebhookPayload = {
        event: "call.approved",
        sent_at: new Date().toISOString(),
        call: {
          id: full.id,
          call_no: full.call_no,
          created_at: full.created_at,
          created_by: full.created_by,
          status: full.status,
          date: String(full.date),
          time: String(full.time),
          call_type: full.call_type,
          first_name: full.first_name,
          last_name: full.last_name,
          national_id: full.national_id,
          from_place: full.from_place,
          from_department: full.from_department ?? null,
          to_place: full.to_place,
          to_department: full.to_department ?? null,
          health_fund: full.health_fund ?? null,
          contact_name: full.contact_name ?? null,
          contact_phone: full.contact_phone ?? null,
          commitment_no: full.commitment_no ?? null,
          driver: full.driver ?? null,
          vehicle_no: full.vehicle_no ?? null,
          notes: full.notes ?? null,
          closed_at: full.closed_at ?? null
        }
      };

      // Best-effort: do not block call creation if integrations fail.
      sendApprovedCallToIntegrations(payload).catch(() => {});
    }

    return NextResponse.json({ ok: true, call_no: data.call_no }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "invalid_request" },
      { status: 400 }
    );
  }
}

