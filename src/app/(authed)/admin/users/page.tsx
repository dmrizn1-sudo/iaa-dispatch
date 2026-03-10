import { createSupabaseServer } from "@/lib/supabase/server";
import AdminUsersClient from "./usersClient";

export default async function AdminUsersPage() {
  const supabase = createSupabaseServer();
  const { data: users } = await supabase
    .from("app_users")
    .select("auth_user_id,full_name,phone,role,status,approved_at,approved_by,national_id_last4,notes,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: requests } = await supabase
    .from("registration_requests")
    .select("id,full_name,phone,role_requested,status,national_id_last4,notes,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">ניהול משתמשים</div>
        <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
          אישור/חסימה משתמשים ובקשות הרשמה — מסך פשוט ונוח למובייל
        </div>
      </div>
      <AdminUsersClient initialUsers={users || []} initialRequests={requests || []} />
    </div>
  );
}

