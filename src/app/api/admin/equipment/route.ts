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
  item_name: z.string().min(2),
  category: z.enum(["airway", "breathing", "circulation", "trauma", "monitoring", "medications", "immobilization", "general"]),
  required_quantity: z.number().int().nonnegative().default(1),
  equipment_type: z.enum(["BLS", "ALS", "both"]).default("both"),
  notes: z.string().optional().nullable()
});

const updateSchema = z.object({
  id: z.string().uuid(),
  item_name: z.string().min(2).optional(),
  category: z.enum(["airway", "breathing", "circulation", "trauma", "monitoring", "medications", "immobilization", "general"]).optional(),
  required_quantity: z.number().int().nonnegative().optional(),
  equipment_type: z.enum(["BLS", "ALS", "both"]).optional(),
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
      .from("equipment_master")
      .insert({
        item_name: parsed.item_name,
        category: parsed.category,
        required_quantity: parsed.required_quantity,
        equipment_type: parsed.equipment_type,
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
    if (parsed.item_name !== undefined) update.item_name = parsed.item_name;
    if (parsed.category !== undefined) update.category = parsed.category;
    if (parsed.required_quantity !== undefined) update.required_quantity = parsed.required_quantity;
    if (parsed.equipment_type !== undefined) update.equipment_type = parsed.equipment_type;
    if (parsed.notes !== undefined) update.notes = parsed.notes;
    const { error } = await admin.from("equipment_master").update(update).eq("id", parsed.id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "bad_request" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return NextResponse.json({ ok: false, error: "forbidden" }, { status: guard.status });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
  const admin = createSupabaseAdmin();
  const { error } = await admin.from("equipment_master").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

