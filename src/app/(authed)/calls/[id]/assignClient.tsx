"use client";

import * as React from "react";
import { Combobox } from "@/components/ui/Combobox";
import { Button } from "@/components/ui/Button";

export default function AssignClient({
  callId,
  driverId,
  vehicleId,
  drivers,
  vehicles
}: {
  callId: string;
  driverId: string | null;
  vehicleId: string | null;
  drivers: { id: string; name: string; phone: string; status: string }[];
  vehicles: { id: string; vehicle_number: string; plate: string; status: string }[];
}) {
  const [driver, setDriver] = React.useState(driverId || "");
  const [vehicle, setVehicle] = React.useState(vehicleId || "");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const driverOptions = drivers.map((d) => ({ value: d.id, label: `${d.name} (${d.phone})` }));
  const vehicleOptions = vehicles.map((v) => ({ value: v.id, label: `${v.vehicle_number} (${v.plate})` }));

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Combobox label="נהג" value={driver} onChange={setDriver} options={driverOptions} placeholder="חיפוש נהג" allowCustom={false} />
      <Combobox label="רכב" value={vehicle} onChange={setVehicle} options={vehicleOptions} placeholder="חיפוש רכב פנוי" allowCustom={false} />

      {msg ? (
        <div className="md:col-span-2 rounded-2xl border border-iaa-blue/10 bg-iaa-blue/[0.02] px-5 py-4 font-bold text-iaa-blue">
          {msg}
        </div>
      ) : null}

      <div className="md:col-span-2">
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={busy || !driver || !vehicle}
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            const r = await fetch(`/api/calls/${encodeURIComponent(callId)}/assign`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ driver_id: driver, vehicle_id: vehicle })
            });
            const data = (await r.json()) as { ok: boolean; error?: string };
            setBusy(false);
            if (!r.ok || !data.ok) {
              setMsg(data.error === "vehicle_not_available" ? "הרכב לא פנוי. רענן/י ובחר/י רכב אחר." : "שיבוץ נכשל.");
              return;
            }
            setMsg("שובץ בהצלחה. ניתן לרענן את העמוד כדי לראות סטטוס מעודכן.");
          }}
        >
          {busy ? "משבץ..." : "שיבוץ"}
        </Button>
      </div>
    </div>
  );
}

