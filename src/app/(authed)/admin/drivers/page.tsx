import { createSupabaseServer } from "@/lib/supabase/server";
import AdminDriversClient from "./driversClient";

export default async function AdminDriversPage() {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("drivers")
    .select("id,name,phone,license_type,status,national_id_last4,notes,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">נהגים</div>
        <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">ניהול נהגים — הוספה, עריכה, הפעלה/השבתה</div>
      </div>
      <AdminDriversClient initialDrivers={data || []} />
    </div>
  );
}

