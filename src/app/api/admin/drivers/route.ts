import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { encryptNationalId, last4 } from "@/lib/security/nationalId";

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
  name: z.string().min(2),
  phone: z.string().min(7),
  national_id: z.string().min(5),
  license_type: z.string().optional().nullable(),
  status: z.enum(["פעיל", "לא פעיל"]).default("פעיל"),
  notes: z.string().optional().nullable()
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  national_id: z.string().min(5).optional(),
  license_type: z.string().optional().nullable(),
  status: z.enum(["פעיל", "לא פעיל"]).optional(),
  notes: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: "forbidden" }, { status: guard.status });
  try {
    const json = await req.json();
    const parsed = createSchema.parse(json);
    const admin = createSupabaseAdmin();
    const enc = encryptNationalId(parsed.national_id);
    const { data, error } = await admin
      .from("drivers")
      .insert({
        name: parsed.name,
        phone: parsed.phone,
        national_id_enc: enc,
        national_id_last4: last4(parsed.national_id),
        license_type: parsed.license_type ?? null,
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
    if (parsed.name !== undefined) update.name = parsed.name;
    if (parsed.phone !== undefined) update.phone = parsed.phone;
    if (parsed.license_type !== undefined) update.license_type = parsed.license_type;
    if (parsed.status !== undefined) update.status = parsed.status;
    if (parsed.notes !== undefined) update.notes = parsed.notes;
    if (parsed.national_id !== undefined) {
      update.national_id_enc = encryptNationalId(parsed.national_id);
      update.national_id_last4 = last4(parsed.national_id);
    }
    const { error } = await admin.from("drivers").update(update).eq("id", parsed.id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "bad_request" }, { status: 400 });
  }
}

