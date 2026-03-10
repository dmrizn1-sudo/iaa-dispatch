import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { CALL_STATUSES, STATUS_COLORS, type CallStatus } from "@/lib/calls";
import DriverClient from "./driverClient";

export default async function DriverDashboard() {
  const supabase = createSupabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const authId = user?.id || "";

  const { data: me } = authId
    ? await supabase.from("app_users").select("phone,full_name,role,status").eq("auth_user_id", authId).maybeSingle()
    : { data: null };

  const { data: drv } = me?.phone
    ? await supabase.from("drivers").select("id,name,status").eq("phone", me.phone).maybeSingle()
    : { data: null };

  const driverId = drv?.id || null;

  const { data: calls } = driverId
    ? await supabase
        .from("calls")
        .select("id,call_no,status,date,time,call_type,first_name,last_name,from_place,from_department,to_place,to_department,contact_name,contact_phone,vehicle_no")
        .eq("driver_id", driverId)
        .order("call_no", { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">מסך נהג</div>
          <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
            רואים רק קריאות משובצות אליך. פעולה מהירה: בדרך / הגיע / הסתיים
          </div>
        </div>
        <Link
          href="/dashboard"
          className="rounded-2xl border border-iaa-blue/15 bg-white px-5 py-3 text-base font-extrabold text-iaa-blue hover:bg-iaa-blue/[0.03]"
        >
          דשבורד מוקד
        </Link>
      </div>

      {!driverId ? (
        <div className="rounded-3xl border border-iaa-blue/10 bg-white p-6 font-bold text-iaa-blue shadow-soft">
          לא נמצא כרטיס נהג תואם לטלפון שלך. פנה/י לאדמין כדי ליצור נהג (Drivers) עם אותו מספר טלפון.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(calls || []).length ? (
            (calls || []).map((c) => {
              const status = (c.status && CALL_STATUSES.includes(c.status as CallStatus)
                ? (c.status as CallStatus)
                : "חדשה") as CallStatus;
              const color = STATUS_COLORS[status];
              return (
                <div key={c.id} className="rounded-3xl border border-iaa-blue/10 bg-white p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-extrabold text-iaa-blue">קריאה #{c.call_no}</div>
                    <span className={["rounded-2xl px-3 py-1 text-sm font-extrabold", color.bg, color.text].join(" ")}>
                      {c.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm font-semibold text-iaa-blue/80">
                    <div>
                      <span className="font-extrabold text-iaa-blue/70">תאריך/שעה:</span> {String(c.date)} {String(c.time)}
                    </div>
                    <div>
                      <span className="font-extrabold text-iaa-blue/70">מטופל:</span> {c.first_name} {c.last_name}
                    </div>
                    <div>
                      <span className="font-extrabold text-iaa-blue/70">איסוף:</span> {c.from_place}
                      {c.from_department ? ` — ${c.from_department}` : ""}
                    </div>
                    <div>
                      <span className="font-extrabold text-iaa-blue/70">יעד:</span> {c.to_place}
                      {c.to_department ? ` — ${c.to_department}` : ""}
                    </div>
                    <div>
                      <span className="font-extrabold text-iaa-blue/70">רכב:</span> {c.vehicle_no || "—"}
                    </div>
                    <div>
                      <span className="font-extrabold text-iaa-blue/70">איש קשר:</span>{" "}
                      {c.contact_name || "—"} {c.contact_phone ? `(${c.contact_phone})` : ""}
                    </div>
                  </div>

                  <div className="mt-4">
                    <DriverClient callId={c.id} currentStatus={c.status as string} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-iaa-blue/10 bg-iaa-blue/[0.02] p-6 text-center text-sm font-semibold text-iaa-blue/70">
              אין קריאות משובצות כרגע
            </div>
          )}
        </div>
      )}
    </div>
  );
}

