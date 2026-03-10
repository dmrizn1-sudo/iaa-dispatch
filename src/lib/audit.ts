import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { AppUserRole } from "@/lib/auth/appUser";

export async function logCallEvent(params: {
  call_id: string;
  actor_user_id?: string | null;
  actor_role?: AppUserRole | null;
  event_type: string;
  event_data?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdmin();
  await admin.from("call_audit_log").insert({
    call_id: params.call_id,
    actor_user_id: params.actor_user_id ?? null,
    actor_role: params.actor_role ?? null,
    event_type: params.event_type,
    event_data: params.event_data ?? {}
  });
}

