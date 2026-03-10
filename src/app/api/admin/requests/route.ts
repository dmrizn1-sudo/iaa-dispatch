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

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "blocked"])
});

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: "forbidden" }, { status: guard.status });

  try {
    const json = await req.json();
    const parsed = updateSchema.parse(json);
    const admin = createSupabaseAdmin();

    const update: Record<string, unknown> = {
      status: parsed.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: guard.user!.id
    };

    const { error } = await admin.from("registration_requests").update(update).eq("id", parsed.id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "bad_request" },
      { status: 400 }
    );
  }
}

