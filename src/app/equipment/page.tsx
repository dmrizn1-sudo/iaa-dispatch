import { createSupabaseServer } from "@/lib/supabase/server";

export default async function EquipmentDashboardPage() {
  const supabase = createSupabaseServer();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id,vehicle_number,vehicle_type,status")
    .order("vehicle_number");

  const { data: checks } = await supabase
    .from("equipment_check_reports")
    .select("id,vehicle_id,date,shift,status,created_at")
    .order("date", { ascending: false });

  const { data: alerts } = await supabase
    .from("equipment_alerts")
    .select("id,vehicle_id,condition,message,resolved,created_at")
    .eq("resolved", false)
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  type EquipCheck = NonNullable<typeof checks>[number];
  const lastByVehicle = new Map<string, EquipCheck>();
  (checks || []).forEach((c) => {
    if (!lastByVehicle.has(c.vehicle_id)) lastByVehicle.set(c.vehicle_id, c);
  });

  const vehiclesNotCheckedToday =
    vehicles?.filter((v) => {
      const last = lastByVehicle.get(v.id);
      return !last || last.date !== today;
    }) || [];

  return (
    <main className="min-h-dvh bg-iaa-bg px-4 py-6 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">דשבורד ציוד</div>
          <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
            בדיקות ציוד אחרונות, חוסרים ואמבולנסים שלא נבדקו היום.
          </div>
        </div>

        <section className="rounded-3xl border border-iaa-blue/10 bg-white p-5 shadow-soft md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-lg font-extrabold text-iaa-blue md:text-xl">חוסרי ציוד פעילים</div>
            <div className="text-sm font-semibold text-iaa-blue/60">{alerts?.length ?? 0}</div>
          </div>
          <div className="mt-4 space-y-3">
            {alerts?.length ? (
              alerts.map((a) => {
                const v = vehicles?.find((x) => x.id === a.vehicle_id);
                return (
                  <div key={a.id} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                    <div>
                      {v ? `אמבולנס ${v.vehicle_number}` : "אמבולנס לא ידוע"} — {a.message}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-iaa-blue/10 bg-iaa-blue/[0.02] px-4 py-3 text-sm font-semibold text-iaa-blue/70">
                אין חוסרי ציוד פעילים.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-iaa-blue/10 bg-white p-5 shadow-soft md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-lg font-extrabold text-iaa-blue md:text-xl">אמבולנסים שלא נבדקו היום</div>
            <div className="text-sm font-semibold text-iaa-blue/60">{vehiclesNotCheckedToday.length}</div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {vehiclesNotCheckedToday.length ? (
              vehiclesNotCheckedToday.map((v) => (
                <div key={v.id} className="rounded-2xl border border-iaa-blue/15 bg-iaa-blue/[0.03] px-4 py-2 text-sm font-extrabold text-iaa-blue">
                  {v.vehicle_number}
                </div>
              ))
            ) : (
              <div className="text-sm font-semibold text-iaa-blue/70">כל האמבולנסים נבדקו היום.</div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-iaa-blue/10 bg-white p-5 shadow-soft md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-lg font-extrabold text-iaa-blue md:text-xl">בדיקה אחרונה לכל אמבולנס</div>
            <div className="text-sm font-semibold text-iaa-blue/60">{vehicles?.length ?? 0}</div>
          </div>
          <div className="mt-4 space-y-2">
            {vehicles?.map((v) => {
              const last = lastByVehicle.get(v.id);
              return (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-2xl border border-iaa-blue/10 bg-iaa-blue/[0.02] px-4 py-3 text-sm font-semibold text-iaa-blue">
                  <span>
                    אמבולנס {v.vehicle_number} ({v.vehicle_type})
                  </span>
                  <span className="text-iaa-blue/70">
                    {last ? `${last.date} • משמרת ${last.shift}` : "לא קיימת בדיקה"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

