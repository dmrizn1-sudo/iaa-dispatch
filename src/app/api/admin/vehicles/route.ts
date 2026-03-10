import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = createSupabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 as const, user: null };
  const { data: me } = await supabase.from("app_users").select("role,status").eq("auth_user_id", user.id).maybeSingle();
  if (me?.status !== "approved" || me?.role !== "admin") return { ok: false as const, status: 403 as const, user: null };
  return { ok: true as const, status: 200 as const, user };
}

const createSchema = z.object({
  vehicle_number: z.string().min(1),
  vehicle_type: z.enum(["אמבולנס ביטחון", "אמבולנס ALS", "אמבולנס רגיל"]),
  plate: z.string().min(1),
  status: z.enum(["פנוי", "במשימה", "תחזוקה"]).default("פנוי"),
  notes: z.string().optional().nullable()
});

const updateSchema = z.object({
  id: z.string().uuid(),
  vehicle_number: z.string().min(1).optional(),
  vehicle_type: z.enum(["אמבולנס ביטחון", "אמבולנס ALS", "אמבולנס רגיל"]).optional(),
  plate: z.string().min(1).optional(),
  status: z.enum(["פנוי", "במשימה", "תחזוקה"]).optional(),
  notes: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: "forbidden" }, { status: guard.status });
  try {
    const json = await req.json();
    const parsed = createSchema.parse(json);
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from("vehicles")
      .insert({
        vehicle_number: parsed.vehicle_number,
        vehicle_type: parsed.vehicle_type,
        plate: parsed.plate,
        status: parsed.status,
        notes: parsed.notes ?? null
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "bad_request" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: "forbidden" }, { status: guard.status });
  try {
    const json = await req.json();
    const parsed = updateSchema.parse(json);
    const admin = createSupabaseAdmin();
    const update: Record<string, unknown> = {};
    if (parsed.vehicle_number !== undefined) update.vehicle_number = parsed.vehicle_number;
    if (parsed.vehicle_type !== undefined) update.vehicle_type = parsed.vehicle_type;
    if (parsed.plate !== undefined) update.plate = parsed.plate;
    if (parsed.status !== undefined) update.status = parsed.status;
    if (parsed.notes !== undefined) update.notes = parsed.notes;
    const { error } = await admin.from("vehicles").update(update).eq("id", parsed.id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "bad_request" }, { status: 400 });
  }
}

