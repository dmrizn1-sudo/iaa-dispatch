export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-iaa-blue/10 bg-white p-6 shadow-soft">
        <div className="h-7 w-40 rounded-lg bg-iaa-blue/10" />
        <div className="mt-3 h-4 w-64 rounded-lg bg-iaa-blue/10" />
      </div>
      <div className="rounded-3xl border border-iaa-blue/10 bg-white p-6 shadow-soft">
        <div className="h-6 w-36 rounded-lg bg-iaa-blue/10" />
        <div className="mt-4 space-y-3">
          <div className="h-12 rounded-2xl bg-iaa-blue/[0.06]" />
          <div className="h-12 rounded-2xl bg-iaa-blue/[0.06]" />
          <div className="h-12 rounded-2xl bg-iaa-blue/[0.06]" />
        </div>
      </div>
    </div>
  );
}

