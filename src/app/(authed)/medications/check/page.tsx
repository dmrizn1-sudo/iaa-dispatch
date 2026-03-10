export default function MedicationsCheckPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-extrabold text-iaa-blue md:text-3xl">בדיקת תרופות משמרת</div>
        <div className="text-sm font-semibold text-iaa-blue/60 md:text-base">
          מסך זה יטעין תרופות משויכות לאמבולנס ויאפשר בדיקה (תקין/חסר/פג תוקף/פגום) — לאחר הפעלת מודול תרופות.
        </div>
      </div>

      <div className="rounded-3xl border border-iaa-blue/10 bg-white p-6 shadow-soft">
        <div className="text-sm font-semibold text-iaa-blue/70 md:text-base">
          מודול תרופות טרם הופעל בקוד. לאחר הוספת סכמת התרופות והמסכים, כאן יוצג טופס בדיקה מלא בדומה ל־`/equipment/check`.
        </div>
      </div>
    </div>
  );
}

