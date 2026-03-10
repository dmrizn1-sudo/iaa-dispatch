import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { encryptNationalId, last4 } from "@/lib/security/nationalId";

const schema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(7),
  national_id: z.string().min(5),
  role_requested: z.enum(["dispatcher", "driver"]).default("dispatcher"),
  notes: z.string().optional().nullable()
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.parse(json);

    const supabase = createSupabaseServer();
    const enc = encryptNationalId(parsed.national_id);

    const { error } = await supabase.from("registration_requests").insert({
      full_name: parsed.full_name,
      phone: parsed.phone,
      role_requested: parsed.role_requested,
      national_id_enc: enc,
      national_id_last4: last4(parsed.national_id),
      notes: parsed.notes ?? null,
      status: "pending"
    });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "bad_request" },
      { status: 400 }
    );
  }
}

