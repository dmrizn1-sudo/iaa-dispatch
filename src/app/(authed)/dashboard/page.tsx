import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { CALL_STATUSES, STATUS_COLORS, type CallStatus } from "@/lib/calls";

type CallRow = {
  id: string;
  call_no: number;
  date: string;
  time: string;
  call_type: string;
  ambulance_type?: string | null;
  first_name: string;
  last_name: string;
  from_place: string;
  to_place: string;
  status: string;
  closed_at: string | null;
  driver: string | null;
  vehicle_no: string | null;
};

function fmtDate(d: string) {
  return d;
}

function CallCard({ c }: { c: CallRow }) {
  const status = (c.status && CALL_STATUSES.includes(c.status as CallStatus)
    ? (c.status as CallStatus)
    : "חדשה") as CallStatus;
  const color = STATUS_COLORS[status];
  return (
    <div className="rounded-3xl border border-iaa-blue/10 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-extrabold text-iaa-blue">קריאה #{c.call_no}</div>
        <span className={["rounded-2xl px-3 py-1 text-sm font-extrabold", color.bg, color.text].join(" ")}>
          {c.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm font-semibold text-iaa-blue/80">
        <div>
          <span className="font-extrabold text-iaa-blue/70">תאריך/שעה:</span> {fmtDate(c.date)} {c.time}
        </div>
        <div>
          <span className="font-extrabold text-iaa-blue/70">סוג:</span> {c.call_type}
        </div>
        <div>
          <span className="font-extrabold text-iaa-blue/70">שם:</span> {c.first_name} {c.last_name}
        </div>
        <div>
          <span className="font-extrabold text-iaa-blue/70">מ־</span> {c.from_place}
        </div>
        <div>
          <span className="font-extrabold text-iaa-blue/70">ל־</span> {c.to_place}
        </div>
        <div>
          <span className="font-extrabold text-iaa-blue/70">נהג:</span> {c.driver || "—"}
        </div>
        <div>
          <span className="font-extrabold text-iaa-blue/70">רכב:</span> {c.vehicle_no || "—"}
        </div>
        <Link
          href={`/calls/${c.id}`}
          className="mt-2 inline-flex h-12 items-center justify-center rounded-2xl bg-iaa-blue px-4 text-base font-extrabold text-white shadow-soft hover:bg-iaa-blue2"
        >
          פתיחה
        </Link>
      </div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ saved?: string; call?: string }>;
}) {
  const sp = (await searchParams) || {};
  const supabase = createSupabaseServer();

  const { data: openCalls } = await supabase
    .from("calls")
    .select("id,call_no,date,time,call_type,ambulance_type,first_name,last_name,from_place,to_place,status,closed_at,driver,vehicle_no")
    .is("closed_at", null)
    .order("call_no", { ascending: false })
    .limit(50);

  const { data: closedCalls } = await supabase
    .from("calls")
    .select("id,call_no,date,time,call_type,ambulance_type,first_name,last_name,from_place,to_place,status,closed_at,driver,vehicle_no")
    .not("closed_at", "is", null)
    .order("closed_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      {sp.saved === "1" && sp.call ? (
        <div className="rounded-2xl border border-iaa-gold/30 bg-white px-5 py-4 shadow-soft">
          <div className="text-base font-extrabold text-iaa-blue md:text-lg">
            נשמר בהצלחה — מספר קריאה: <span className="text-iaa-gold">{sp.call}</span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">דשבורד</div>
          <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">קריאות פתוחות וסגורות</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/driver"
            className="inline-flex h-14 items-center justify-center rounded-2xl border border-iaa-blue/15 bg-white px-5 text-base font-extrabold text-iaa-blue hover:bg-iaa-blue/[0.03]"
          >
            מסך נהג
          </Link>
          <Link
            href="/calls/new"
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-iaa-gold px-6 text-lg font-extrabold text-iaa-blue shadow-soft hover:bg-iaa-gold2"
          >
            קריאה חדשה
          </Link>
        </div>
      </div>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="flex items-center justify-between gap-4 border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">קריאות פתוחות</div>
          <div className="text-sm font-semibold text-iaa-blue/60">{openCalls?.length ?? 0}</div>
        </div>
        {/* Mobile cards */}
        <div className="grid grid-cols-1 gap-4 p-5 md:hidden">
          {(openCalls || []).map((c: CallRow) => (
            <CallCard key={c.id} c={c} />
          ))}
          {!openCalls?.length ? (
            <div className="rounded-3xl border border-iaa-blue/10 bg-iaa-blue/[0.02] p-6 text-center text-sm font-semibold text-iaa-blue/70">
              אין קריאות פתוחות
            </div>
          ) : null}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-right">
            <thead className="bg-iaa-blue/[0.03] text-sm font-extrabold text-iaa-blue">
              <tr>
                <th className="px-4 py-3">מס׳</th>
                <th className="px-4 py-3">תאריך/שעה</th>
                <th className="px-4 py-3">מטופל</th>
                <th className="px-4 py-3">מ־</th>
                <th className="px-4 py-3">ל־</th>
                <th className="px-4 py-3">נהג</th>
                <th className="px-4 py-3">רכב</th>
                <th className="px-4 py-3">סטטוס</th>
                <th className="px-4 py-3">פעולות</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-iaa-blue/90 md:text-base">
              {(openCalls || []).map((c: CallRow) => {
                const status = (c.status && CALL_STATUSES.includes(c.status as CallStatus)
                  ? (c.status as CallStatus)
                  : "חדשה") as CallStatus;
                const color = STATUS_COLORS[status];
                return (
                  <tr key={c.id} className="border-t border-iaa-blue/10 hover:bg-iaa-blue/[0.02]">
                    <td className="px-4 py-3 font-extrabold text-iaa-blue">{c.call_no}</td>
                    <td className="px-4 py-3">
                      {fmtDate(c.date)} {c.time}
                    </td>
                    <td className="px-4 py-3">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="px-4 py-3">{c.from_place}</td>
                    <td className="px-4 py-3">{c.to_place}</td>
                    <td className="px-4 py-3">{c.driver || "—"}</td>
                    <td className="px-4 py-3">{c.vehicle_no || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={["rounded-xl px-3 py-1 font-extrabold", color.bg, color.text].join(" ")}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/calls/${c.id}`} className="font-extrabold text-iaa-blue underline">
                        פתיחה
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!openCalls?.length ? (
                <tr>
                  <td className="px-4 py-6 text-iaa-blue/60" colSpan={9}>
                    אין קריאות פתוחות
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-iaa-blue/10 bg-white shadow-soft">
        <div className="flex items-center justify-between gap-4 border-b border-iaa-blue/10 px-5 py-4 md:px-6">
          <div className="text-lg font-extrabold text-iaa-blue md:text-xl">קריאות סגורות</div>
          <div className="text-sm font-semibold text-iaa-blue/60">{closedCalls?.length ?? 0}</div>
        </div>
        {/* Mobile cards */}
        <div className="grid grid-cols-1 gap-4 p-5 md:hidden">
          {(closedCalls || []).map((c: CallRow) => (
            <CallCard key={c.id} c={c} />
          ))}
          {!closedCalls?.length ? (
            <div className="rounded-3xl border border-iaa-blue/10 bg-iaa-blue/[0.02] p-6 text-center text-sm font-semibold text-iaa-blue/70">
              אין קריאות סגורות
            </div>
          ) : null}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-right">
            <thead className="bg-iaa-blue/[0.03] text-sm font-extrabold text-iaa-blue">
              <tr>
                <th className="px-4 py-3">מס׳</th>
                <th className="px-4 py-3">תאריך/שעה</th>
                <th className="px-4 py-3">סוג</th>
                <th className="px-4 py-3">שם</th>
                <th className="px-4 py-3">מ־</th>
                <th className="px-4 py-3">ל־</th>
                <th className="px-4 py-3">סטטוס</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-iaa-blue/90 md:text-base">
              {(closedCalls || []).map((c: CallRow) => (
                <tr key={c.id} className="border-t border-iaa-blue/10 hover:bg-iaa-blue/[0.02]">
                  <td className="px-4 py-3 font-extrabold text-iaa-blue">{c.call_no}</td>
                  <td className="px-4 py-3">
                    {fmtDate(c.date)} {c.time}
                  </td>
                  <td className="px-4 py-3">{c.call_type}</td>
                  <td className="px-4 py-3">
                    {c.first_name} {c.last_name}
                  </td>
                  <td className="px-4 py-3">{c.from_place}</td>
                  <td className="px-4 py-3">{c.to_place}</td>
                  <td className="px-4 py-3">{c.status}</td>
                </tr>
              ))}
              {!closedCalls?.length ? (
                <tr>
                  <td className="px-4 py-6 text-iaa-blue/60" colSpan={7}>
                    אין קריאות סגורות
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

