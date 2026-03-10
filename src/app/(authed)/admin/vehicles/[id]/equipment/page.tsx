import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import VehicleEquipmentClient from "./vehicleEquipmentClient";

export default async function VehicleEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServer();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id,vehicle_number,vehicle_type,plate")
    .eq("id", id)
    .maybeSingle();
  if (!vehicle) return notFound();

  const { data: master } = await supabase
    .from("equipment_master")
    .select("id,item_name,category,required_quantity,equipment_type")
    .order("category")
    .order("item_name");

  const { data: assigned } = await supabase
    .from("vehicle_equipment")
    .select("equipment_id,required_quantity")
    .eq("vehicle_id", id);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">ציוד לאמבולנס {vehicle.vehicle_number}</div>
        <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
          שייך/י ציוד לאמבולנס זה וקבע/י כמויות נדרשות.
        </div>
      </div>
      <VehicleEquipmentClient vehicleId={vehicle.id} master={master || []} assigned={assigned || []} />
    </div>
  );
}

