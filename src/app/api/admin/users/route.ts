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

const createUserSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(7),
  national_id: z.string().min(5),
  role: z.enum(["admin", "dispatcher", "driver"]).default("dispatcher"),
  password: z.string().min(8),
  notes: z.string().optional().nullable()
});

const updateStatusSchema = z.object({
  auth_user_id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "blocked"])
});

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: "forbidden" }, { status: guard.status });

  try {
    const json = await req.json();
    const parsed = createUserSchema.parse(json);
    const supabaseAdmin = createSupabaseAdmin();

    const phoneNorm = parsed.phone.replace(/[^\d+]/g, "");
    const email = `${phoneNorm}@phone.local`;

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: parsed.password,
      email_confirm: true
    });

    if (createErr || !created.user) {
      return NextResponse.json({ ok: false, error: createErr?.message || "create_user_failed" }, { status: 400 });
    }

    const enc = encryptNationalId(parsed.national_id);

    const { error: appErr } = await supabaseAdmin.from("app_users").insert({
      auth_user_id: created.user.id,
      full_name: parsed.full_name,
      phone: parsed.phone,
      role: parsed.role,
      status: "pending",
      national_id_enc: enc,
      national_id_last4: last4(parsed.national_id),
      notes: parsed.notes ?? null
    });

    if (appErr) {
      return NextResponse.json({ ok: false, error: appErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, auth_user_id: created.user.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "bad_request" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: "forbidden" }, { status: guard.status });

  try {
    const json = await req.json();
    const parsed = updateStatusSchema.parse(json);
    const supabaseAdmin = createSupabaseAdmin();

    const update: Record<string, unknown> = { status: parsed.status };
    if (parsed.status === "approved") {
      update.approved_at = new Date().toISOString();
      update.approved_by = guard.user!.id;
    }

    const { error } = await supabaseAdmin.from("app_users").update(update).eq("auth_user_id", parsed.auth_user_id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "bad_request" },
      { status: 400 }
    );
  }
}

