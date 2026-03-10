import Link from "next/link";

export default function MedicationsDashboardPlaceholder() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">דשבורד תרופות</div>
          <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
            מסך זה מציג התראות מלאי ותוקף לפי אמבולנס (לאחר הפעלת מודול תרופות).
          </div>
        </div>
        <Link
          href="/medications/check"
          className="rounded-2xl bg-iaa-gold px-5 py-3 text-base font-extrabold text-iaa-blue shadow-soft hover:bg-iaa-gold2"
        >
          בדיקת תרופות
        </Link>
      </div>

      <div className="rounded-3xl border border-iaa-blue/10 bg-white p-6 shadow-soft">
        <div className="text-base font-extrabold text-iaa-blue md:text-lg">הפעלה</div>
        <div className="mt-2 text-sm font-semibold text-iaa-blue/70 md:text-base">
          כדי להפעיל את מודול התרופות בפרודקשן יש ליצור את טבלאות התרופות ב‑Supabase ולהוסיף את מסכי הניהול:
          `/admin/medications` ו‑`/admin/vehicles/[id]/medications`.
        </div>
      </div>
    </div>
  );
}

