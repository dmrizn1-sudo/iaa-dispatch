import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { CALL_STATUSES, STATUS_COLORS, type CallStatus } from "@/lib/calls";
import AssignClient from "./assignClient";

export default async function CallDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServer();

  const { data: call } = await supabase
    .from("calls")
    .select(
      "id,call_no,created_at,status,date,time,call_type,ambulance_type,first_name,last_name,from_place,from_department,to_place,to_department,contact_name,contact_phone,driver_id,vehicle_id,driver,vehicle_no,invoice_number,receipt_number,payment_status,amount,notes"
    )
    .eq("id", id)
    .maybeSingle();

  if (!call) return notFound();

  const { data: drivers } = await supabase.from("drivers").select("id,name,phone,status").eq("status", "פעיל").order("name");
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id,vehicle_number,plate,status")
    .eq("status", "פנוי")
    .order("vehicle_number");

  const { data: audit } = await supabase
    .from("call_audit_log")
    .select("id,event_type,event_data,created_at,actor_role")
    .eq("call_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  const status = (call.status && CALL_STATUSES.includes(call.status as CallStatus)
    ? (call.status as CallStatus)
    : "חדשה") as CallStatus;
  const color = STATUS_COLORS[status];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">קריאה #{call.call_no}</div>
          <div className="mt-2 flex items-center gap-2">
            <span className={["rounded-2xl px-3 py-1 text-sm font-extrabold", color.bg, color.text].join(" ")}>
              {call.status}
            </span>
            <span className="text-sm font-semibold text-iaa-blue/60">
              {String(call.date)} {String(call.time)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-2xl border border-iaa-blue/15 bg-white px-5 py-3 text-base font-extrabold text-iaa-blue hover:bg-iaa-blue/[0.03]"
          >
            חזרה לדשבורד
          </Link>
          <Link
            href={`/calls/${call.id}/finance`}
            className="rounded-2xl bg-iaa-gold px-5 py-3 text-base font-extrabold text-iaa-blue shadow-soft hover:bg-iaa-gold2"
          >
            סגירה פיננסית
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoCard title="מטופל" value={`${call.first_name} ${call.last_name}`} />
        <InfoCard title="סוג קריאה" value={call.call_type} />
        <InfoCard title="סוג אמבולנס" value={call.ambulance_type || "—"} />
        <InfoCard title="מקום האירוע / איסוף" value={`${call.from_place}${call.from_department ? ` — ${call.from_department}` : ""}`} />
        <InfoCard title="יעד הפינוי" value={`${call.to_place}${call.to_department ? ` — ${call.to_department}` : ""}`} />
        <InfoCard title="שם המזמין" value={`${call.contact_name || "—"} ${call.contact_phone ? `(${call.contact_phone})` : ""}`} />
        <InfoCard title="הערות" value={call.notes || "—"} />
      </section>

      <AssignPanel callId={call.id} driverId={call.driver_id} vehicleId={call.vehicle_id} drivers={drivers || []} vehicles={vehicles || []} />

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">מצב פיננסי</div>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2 md:px-6">
          <InfoCard title="חשבונית" value={call.invoice_number || "—"} />
          <InfoCard title="קבלה" value={call.receipt_number || "—"} />
          <InfoCard title="סטטוס תשלום" value={call.payment_status || "—"} />
          <InfoCard title="סכום" value={call.amount != null ? String(call.amount) : "—"} />
        </div>
      </section>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">Audit Log</div>
          <div className="text-sm font-semibold text-iaa-blue/60">שינויים אחרונים</div>
        </div>
        <div className="divide-y divide-iaa-blue/10">
          {(audit || []).length ? (
            (audit || []).map((a) => (
              <div key={a.id} className="px-5 py-4 text-sm font-semibold text-iaa-blue/80 md:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-extrabold text-iaa-blue">{a.event_type}</div>
                  <div className="text-xs font-bold text-iaa-blue/60">{new Date(a.created_at).toLocaleString("he-IL")}</div>
                </div>
                <div className="mt-2 text-xs text-iaa-blue/60">{JSON.stringify(a.event_data)}</div>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-sm font-semibold text-iaa-blue/60 md:px-6">אין אירועים</div>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-iaa-blue/10 bg-white p-5 shadow-soft">
      <div className="text-sm font-extrabold text-iaa-blue/60">{title}</div>
      <div className="mt-2 text-base font-extrabold text-iaa-blue md:text-lg">{value}</div>
    </div>
  );
}

function AssignPanel({
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
  return (
    <div className="rounded-3xl border border-iaa-blue/10 bg-white p-5 shadow-soft">
      <div className="text-lg font-extrabold text-iaa-blue md:text-xl">שיבוץ נהג ורכב</div>
      <div className="mt-2 text-sm font-semibold text-iaa-blue/60">לאחר שיבוץ, הסטטוס יהפוך ל־“שובצה” והנהג יקבל הודעת WhatsApp (אם מוגדר).</div>
      <AssignClient callId={callId} driverId={driverId} vehicleId={vehicleId} drivers={drivers} vehicles={vehicles} />
    </div>
  );
}

