export default function NewCallLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-iaa-blue/10 bg-white p-6 shadow-soft">
        <div className="h-7 w-40 rounded-lg bg-iaa-blue/10" />
        <div className="mt-3 h-4 w-72 rounded-lg bg-iaa-blue/10" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-14 rounded-2xl bg-white shadow-soft" />
        <div className="h-14 rounded-2xl bg-white shadow-soft" />
        <div className="h-14 rounded-2xl bg-white shadow-soft" />
        <div className="h-14 rounded-2xl bg-white shadow-soft" />
      </div>
    </div>
  );
}

