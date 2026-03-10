import { createSupabaseServer } from "@/lib/supabase/server";
import AdminVehiclesClient from "./vehiclesClient";

export default async function AdminVehiclesPage() {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("vehicles")
    .select("id,vehicle_number,vehicle_type,plate,status,notes,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">רכבים / אמבולנסים</div>
        <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">ניהול צי — הוספה, עריכה, סטטוס</div>
      </div>
      <AdminVehiclesClient initialVehicles={data || []} />
    </div>
  );
}

