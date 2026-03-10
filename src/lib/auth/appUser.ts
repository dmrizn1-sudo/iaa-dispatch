import { createSupabaseServer } from "@/lib/supabase/server";

export type AppUserStatus = "pending" | "approved" | "rejected" | "blocked";
export type AppUserRole = "admin" | "dispatcher" | "driver";

export type AppUser = {
  id: string;
  auth_user_id: string;
  full_name: string;
  phone: string;
  role: AppUserRole;
  status: AppUserStatus;
  approved_at: string | null;
  approved_by: string | null;
};

export async function getCurrentAppUser(): Promise<AppUser | null> {
  const supabase = createSupabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("app_users")
    .select("id,auth_user_id,full_name,phone,role,status,approved_at,approved_by")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return (data as AppUser) || null;
}

