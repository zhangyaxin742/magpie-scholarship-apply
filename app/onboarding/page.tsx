import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Onboarding
        </p>
        <h1 className="text-4xl font-black text-slate-900 md:text-5xl">
          Let&apos;s build your scholarship profile
        </h1>
        <p className="text-lg text-slate-600">
          Upload your Common App once and Magpie will pre-fill every local
          scholarship for you.
        </p>
        <div className="mt-6 grid gap-6">
          <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-semibold text-blue-600">FASTEST (30 seconds)</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              Upload your Common App PDF
            </p>
            <p className="mt-2 text-sm text-slate-600">
              We&apos;ll extract your profile, essays, and awards instantly.
            </p>
            <button
              type="button"
              className="mt-6 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Choose File
            </button>
          </div>
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-x-0 h-px bg-slate-200" />
            <span className="relative bg-white px-3 text-xs font-semibold text-slate-500">
              OR
            </span>
          </div>
          <button
            type="button"
            className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 px-6 py-5 text-left transition hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span className="text-lg font-semibold text-slate-900">
              📝 Fill it out manually
            </span>
            <span className="text-sm text-slate-600">
              Takes about 10 minutes, but you can do it now.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
