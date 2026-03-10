import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ControlCenterPage({
  searchParams
}: {
  searchParams?: Promise<{ from?: string; to?: string }>;
}) {
  const supabase = createSupabaseServer();
  const sp = (await searchParams) || {};
  const today = new Date().toISOString().slice(0, 10);

  const { count: openCallsCount } = await supabase
    .from("calls")
    .select("id", { head: true, count: "exact" })
    .in("status", ["חדשה", "שובצה", "בדרך", "הגיע"]);
  const openCalls = openCallsCount ?? 0;

  const { count: inProgressCallsCount } = await supabase
    .from("calls")
    .select("id", { head: true, count: "exact" })
    .in("status", ["שובצה", "בדרך", "הגיע"]);
  const inProgressCalls = inProgressCallsCount ?? 0;

  const { count: finishedTodayCount } = await supabase
    .from("calls")
    .select("id", { head: true, count: "exact" })
    .eq("date", today)
    .in("status", ["הסתיים", "ממתין חשבונית", "נסגר"]);
  const finishedToday = finishedTodayCount ?? 0;

  const { count: waitingInvoiceCount } = await supabase
    .from("calls")
    .select("id", { head: true, count: "exact" })
    .eq("status", "ממתין חשבונית");
  const waitingInvoice = waitingInvoiceCount ?? 0;

  const { count: activeDriversCount } = await supabase
    .from("drivers")
    .select("id", { head: true, count: "exact" })
    .eq("status", "פעיל");
  const activeDrivers = activeDriversCount ?? 0;

  const { count: activeVehiclesCount } = await supabase
    .from("vehicles")
    .select("id", { head: true, count: "exact" })
    .eq("status", "פנוי");
  const activeVehicles = activeVehiclesCount ?? 0;

  const { count: maintVehiclesCount } = await supabase
    .from("vehicles")
    .select("id", { head: true, count: "exact" })
    .eq("status", "תחזוקה");
  const maintVehicles = maintVehiclesCount ?? 0;

  const { count: openEquipmentAlertsCount } = await supabase
    .from("equipment_alerts")
    .select("id", { head: true, count: "exact" })
    .eq("resolved", false);
  const openEquipmentAlerts = openEquipmentAlertsCount ?? 0;

  const { count: pendingUsersCount } = await supabase
    .from("app_users")
    .select("id", { head: true, count: "exact" })
    .eq("status", "pending");
  const pendingUsers = pendingUsersCount ?? 0;

  const { data: liveCalls } = await supabase
    .from("calls")
    .select(
      "id,call_no,call_type,first_name,last_name,from_place,to_place,status,time,driver,vehicle_no,date"
    )
    .gte("date", sp.from || today)
    .lte("date", sp.to || today)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: pendingReqs } = await supabase
    .from("registration_requests")
    .select("id,full_name,phone,role_requested,created_at,status")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(20);

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id,vehicle_number,vehicle_type,status,created_at")
    .order("vehicle_number");

  const { data: lastEquipChecks } = await supabase
    .from("equipment_check_reports")
    .select("id,vehicle_id,date,shift,created_at")
    .order("date", { ascending: false });

  type EquipCheck = NonNullable<typeof lastEquipChecks>[number];
  const lastEquipByVehicle = new Map<string, EquipCheck>();
  (lastEquipChecks ?? []).forEach((r) => {
    if (!lastEquipByVehicle.has(r.vehicle_id)) lastEquipByVehicle.set(r.vehicle_id, r);
  });

  // Simple recent activity feed from call_audit_log
  const { data: activity } = await supabase
    .from("call_audit_log")
    .select("id,call_id,event_type,event_data,created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className="min-h-dvh bg-iaa-bg px-4 py-6 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header + filters + quick actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">מרכז בקרה מנהלי</div>
            <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
              תמונת מצב חיה של כל הפעילות — קריאות, צי, ציוד, תרופות, כספים ודוחות.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/calls/new"
              className="rounded-2xl bg-iaa-gold px-4 py-2 text-sm font-extrabold text-iaa-blue shadow-soft hover:bg-iaa-gold2 md:text-base"
            >
              קריאה חדשה
            </Link>
            <Link
              href="/admin/users"
              className="rounded-2xl border border-iaa-blue/15 bg-white px-4 py-2 text-sm font-extrabold text-iaa-blue hover:bg-iaa-blue/5 md:text-base"
            >
              משתמש חדש
            </Link>
            <Link
              href="/admin/drivers"
              className="rounded-2xl border border-iaa-blue/15 bg-white px-4 py-2 text-sm font-extrabold text-iaa-blue hover:bg-iaa-blue/5 md:text-base"
            >
              נהג חדש
            </Link>
            <Link
              href="/admin/vehicles"
              className="rounded-2xl border border-iaa-blue/15 bg-white px-4 py-2 text-sm font-extrabold text-iaa-blue hover:bg-iaa-blue/5 md:text-base"
            >
              אמבולנס חדש
            </Link>
            <Link
              href="/equipment/check"
              className="rounded-2xl border border-iaa-blue/15 bg-white px-4 py-2 text-sm font-extrabold text-iaa-blue hover:bg-iaa-blue/5 md:text-base"
            >
              בדיקת ציוד
            </Link>
            <Link
              href="/medications/check"
              className="rounded-2xl border border-iaa-blue/15 bg-white px-4 py-2 text-sm font-extrabold text-iaa-blue hover:bg-iaa-blue/5 md:text-base"
            >
              בדיקת תרופות
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <KpiCard title="קריאות פתוחות" value={openCalls} tone="primary" />
          <KpiCard title="קריאות בטיפול" value={inProgressCalls} tone="primary" />
          <KpiCard title="הסתיימו היום" value={finishedToday} tone="success" />
          <KpiCard title="ממתינות חשבונית" value={waitingInvoice} tone="warning" />
          <KpiCard title="נהגים פעילים" value={activeDrivers} tone="muted" />
          <KpiCard title="אמבולנסים פעילים" value={activeVehicles} tone="muted" />
          <KpiCard title="אמבולנסים בתחזוקה" value={maintVehicles} tone="danger" />
          <KpiCard title="חוסרי ציוד" value={openEquipmentAlerts} tone="danger" />
          <KpiCard title="משתמשים ממתינים" value={pendingUsers} tone="warning" />
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Operations table + map */}
          <section className="xl:col-span-2 space-y-4">
            <div className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
              <div className="flex items-center justify-between gap-4 border-b border-iaa-blue/10 px-5 py-4 md:px-6">
                <div className="text-lg font-extrabold text-iaa-blue md:text-xl">שולחן שיבוץ חי</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-right text-sm md:text-base">
                  <thead className="bg-iaa-blue/[0.03] text-xs font-extrabold text-iaa-blue md:text-sm">
                    <tr>
                      <th className="px-3 py-2">מס׳</th>
                      <th className="px-3 py-2">סוג</th>
                      <th className="px-3 py-2">מטופל</th>
                      <th className="px-3 py-2">מוצא</th>
                      <th className="px-3 py-2">יעד</th>
                      <th className="px-3 py-2">נהג</th>
                      <th className="px-3 py-2">רכב</th>
                      <th className="px-3 py-2">סטטוס</th>
                      <th className="px-3 py-2">שעה</th>
                      <th className="px-3 py-2">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-iaa-blue/10 text-iaa-blue/90">
                    {(liveCalls || []).map((c) => (
                      <tr key={c.id} className="hover:bg-iaa-blue/[0.02]">
                        <td className="px-3 py-2 font-extrabold">{c.call_no}</td>
                        <td className="px-3 py-2">{c.call_type}</td>
                        <td className="px-3 py-2">
                          {c.first_name} {c.last_name}
                        </td>
                        <td className="px-3 py-2">{c.from_place}</td>
                        <td className="px-3 py-2">{c.to_place}</td>
                        <td className="px-3 py-2">{c.driver || "—"}</td>
                        <td className="px-3 py-2">{c.vehicle_no || "—"}</td>
                        <td className="px-3 py-2">{c.status}</td>
                        <td className="px-3 py-2">{c.time}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            <Link href={`/calls/${c.id}`} className="text-xs font-extrabold text-iaa-blue underline">
                              קריאה
                            </Link>
                            <Link
                              href={`/calls/${c.id}/finance`}
                              className="text-xs font-extrabold text-iaa-blue underline"
                            >
                              פיננסי
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!liveCalls?.length ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-sm text-iaa-blue/60" colSpan={10}>
                          אין קריאות פעילות בטווח שנבחר.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Map + alerts */}
          <section className="space-y-4">
            <div className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
              <div className="flex items-center justify-between gap-4 border-b border-iaa-blue/10 px-5 py-4 md:px-6">
                <div className="text-lg font-extrabold text-iaa-blue md:text-xl">מפת אמבולנסים</div>
                <Link
                  href="/map"
                  className="text-xs font-extrabold text-iaa-blue underline md:text-sm"
                >
                  מפה מלאה
                </Link>
              </div>
              <div className="p-4">
                <div className="flex h-56 items-center justify-center rounded-2xl bg-iaa-blue/[0.04] text-sm font-semibold text-iaa-blue/60">
                  ווידג׳ט מפה מוטמע (לדוגמה: iframe / ספריית מפות) יוצג כאן.
                </div>
                <div className="mt-3 text-xs font-semibold text-iaa-blue/60">
                  לחיצה על אייקון אמבולנס במפה המלאה תפתח כרטיס רכב/קריאה.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
              <div className="border-b border-iaa-blue/10 px-5 py-4 text-lg font-extrabold text-iaa-blue md:px-6 md:text-xl">
                פעילות אחרונה
              </div>
              <div className="max-h-72 space-y-2 overflow-auto px-5 py-4 md:px-6">
                {(activity || []).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl bg-iaa-blue/[0.03] px-3 py-2 text-xs font-semibold text-iaa-blue/80 md:text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-extrabold text-iaa-blue">{a.event_type}</span>
                      <span className="text-[10px] text-iaa-blue/60">
                        {new Date(a.created_at).toLocaleString("he-IL")}
                      </span>
                    </div>
                  </div>
                ))}
                {!activity?.length ? (
                  <div className="rounded-2xl bg-iaa-blue/[0.02] px-3 py-3 text-xs font-semibold text-iaa-blue/70">
                    אין פעילות אחרונה להצגה.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        {/* Users / fleet / alerts / finance quick summaries */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
            <div className="flex items-center justify-between gap-4 border-b border-iaa-blue/10 px-5 py-4 md:px-6">
              <div className="text-lg font-extrabold text-iaa-blue md:text-xl">משתמשים ממתינים לאישור</div>
            </div>
            <div className="divide-y divide-iaa-blue/10">
              {(pendingReqs || []).map((r) => (
                <div key={r.id} className="px-5 py-3 text-sm font-semibold text-iaa-blue/90 md:px-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-extrabold text-iaa-blue">{r.full_name}</div>
                      <div className="text-xs text-iaa-blue/70">
                        טלפון: {r.phone} • תפקיד: {r.role_requested}
                      </div>
                    </div>
                    <span className="text-xs text-iaa-blue/60">
                      {new Date(r.created_at).toLocaleString("he-IL")}
                    </span>
                  </div>
                </div>
              ))}
              {!pendingReqs?.length ? (
                <div className="px-5 py-6 text-sm font-semibold text-iaa-blue/60 md:px-6">
                  אין משתמשים ממתינים.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
            <div className="flex items-center justify-between gap-4 border-b border-iaa-blue/10 px-5 py-4 md:px-6">
              <div className="text-lg font-extrabold text-iaa-blue md:text-xl">צי (Fleet)</div>
            </div>
            <div className="max-h-80 space-y-2 overflow-auto px-5 py-4 md:px-6">
              {(vehicles || []).map((v) => {
                const last = lastEquipByVehicle.get(v.id);
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-iaa-blue/[0.02] px-3 py-2 text-xs font-semibold text-iaa-blue/80 md:text-sm"
                  >
                    <div>
                      <div className="font-extrabold text-iaa-blue">
                        {v.vehicle_number} ({v.vehicle_type})
                      </div>
                      <div className="text-[11px] text-iaa-blue/60">
                        סטטוס: {v.status} • בדיקת ציוד אחרונה:{" "}
                        {last ? `${last.date} (${last.shift})` : "לא נבדק"}
                      </div>
                    </div>
                    <Link
                      href={`/admin/vehicles/${v.id}/equipment`}
                      className="text-[11px] font-extrabold text-iaa-blue underline"
                    >
                      ציוד
                    </Link>
                  </div>
                );
              })}
              {!vehicles?.length ? (
                <div className="rounded-2xl bg-iaa-blue/[0.02] px-3 py-3 text-xs font-semibold text-iaa-blue/70">
                  אין רכבים במערכת.
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

type KpiTone = "primary" | "success" | "warning" | "danger" | "muted";

function KpiCard({ title, value, tone }: { title: string; value: number; tone: KpiTone }) {
  const toneClasses: Record<KpiTone, string> = {
    primary: "bg-iaa-blue text-white",
    success: "bg-emerald-100 text-emerald-900",
    warning: "bg-amber-100 text-amber-900",
    danger: "bg-red-100 text-red-900",
    muted: "bg-white text-iaa-blue border border-iaa-blue/10"
  };

  return (
    <div className={["rounded-3xl p-4 shadow-soft", toneClasses[tone]].join(" ")}>
      <div className="text-xs font-semibold opacity-80 md:text-sm">{title}</div>
      <div className="mt-2 text-xl font-extrabold md:text-2xl">{value}</div>
    </div>
  );
}

