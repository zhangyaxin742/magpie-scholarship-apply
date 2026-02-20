export default function CartLoading() {
  return (
    <section className="space-y-6">
      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="h-8 w-52 rounded bg-slate-200" />
            <div className="h-4 w-64 rounded bg-slate-200" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 rounded-lg bg-slate-200" />
            <div className="h-10 w-36 rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex gap-2">
          <div className="h-10 w-28 rounded-full bg-slate-200" />
          <div className="h-10 w-28 rounded-full bg-slate-200" />
          <div className="h-10 w-28 rounded-full bg-slate-200" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="h-5 w-56 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-72 rounded bg-slate-200" />
              <div className="mt-4 h-16 rounded bg-slate-100" />
              <div className="mt-4 flex justify-between">
                <div className="h-10 w-28 rounded-lg bg-slate-200" />
                <div className="h-5 w-16 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
