import { createSupabaseServer } from "@/lib/supabase/server";
import EquipmentAdminClient from "./equipmentClient";

export default async function EquipmentAdminPage() {
  const supabase = createSupabaseServer();
  const { data } = await supabase
    .from("equipment_master")
    .select("id,item_name,category,required_quantity,equipment_type,notes,created_at")
    .order("category")
    .order("item_name");

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">ציוד — רשימת אב</div>
        <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
          ניהול רשימת ציוד BLS/ALS — עריכה מותרת לאדמין בלבד.
        </div>
      </div>
      <EquipmentAdminClient initialItems={data || []} />
    </div>
  );
}

