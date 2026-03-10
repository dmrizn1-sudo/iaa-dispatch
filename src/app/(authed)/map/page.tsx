export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">מפה</div>
        <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
          מפה חיה של אמבולנסים ו‑GPS (הטמעה לפי ספק מפות שתבחר/י).
        </div>
      </div>

      <div className="rounded-3xl border border-iaa-blue/10 bg-white p-6 shadow-soft">
        <div className="flex h-[360px] items-center justify-center rounded-2xl bg-iaa-blue/[0.04] text-center text-sm font-semibold text-iaa-blue/70 md:text-base">
          כדי להציג מפה חיה בפרודקשן, חבר/י ספק מפות (Google Maps / Mapbox) והגדיר/י `MAPS_API_KEY` ב‑Vercel.
        </div>
        <div className="mt-4 text-sm font-semibold text-iaa-blue/70">
          מומלץ: להציג כאן שכבת רכבים פעילים עם “עדכון אחרון”, מספר רכב, ונהג — ולחיצה פותחת כרטיס רכב/קריאה.
        </div>
      </div>
    </div>
  );
}

