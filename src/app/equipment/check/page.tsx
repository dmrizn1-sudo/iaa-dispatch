import { createSupabaseServer } from "@/lib/supabase/server";
import EquipmentCheckClient from "./checkClient";

export default async function EquipmentCheckPage() {
  const supabase = createSupabaseServer();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id,vehicle_number,vehicle_type,status")
    .order("vehicle_number");

  const { data: equipment } = await supabase
    .from("equipment_master")
    .select("id,item_name,category,required_quantity,equipment_type")
    .order("category")
    .order("item_name");

  const { data: vehicleEquipment } = await supabase
    .from("vehicle_equipment")
    .select("vehicle_id,equipment_id,required_quantity");

  return (
    <EquipmentCheckClient vehicles={vehicles || []} master={equipment || []} vehicleEquipment={vehicleEquipment || []} />
  );
}

