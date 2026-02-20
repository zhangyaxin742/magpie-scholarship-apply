export default function SettingsLoading() {
  return (
    <section className="space-y-6">
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="mt-3 h-7 w-48 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 rounded bg-slate-200" />
      </div>

      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex gap-2">
          <div className="h-10 w-24 rounded-full bg-slate-200" />
          <div className="h-10 w-28 rounded-full bg-slate-200" />
          <div className="h-10 w-24 rounded-full bg-slate-200" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-56 rounded bg-slate-200" />
              <div className="mt-4 h-10 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
