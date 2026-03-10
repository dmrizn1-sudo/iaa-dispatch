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

const upsertSchema = z.object({
  items: z.array(
    z.object({
      equipment_id: z.string().uuid(),
      required_quantity: z.number().int().nonnegative()
    })
  )
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: "forbidden" }, { status: guard.status });
  const { id: vehicleId } = await ctx.params;
  const json = await req.json();
  const parsed = upsertSchema.parse(json);
  const admin = createSupabaseAdmin();

  // Clear existing assignments and reinsert (simple and explicit).
  await admin.from("vehicle_equipment").delete().eq("vehicle_id", vehicleId);
  if (parsed.items.length) {
    const rows = parsed.items.map((it) => ({
      vehicle_id: vehicleId,
      equipment_id: it.equipment_id,
      required_quantity: it.required_quantity
    }));
    const { error } = await admin.from("vehicle_equipment").insert(rows);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

