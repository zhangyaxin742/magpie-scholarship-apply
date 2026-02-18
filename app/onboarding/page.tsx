import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PDFUploader } from "@/app/components/onboarding/PDFUploader";

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Onboarding
          </p>
          <h1 className="text-4xl font-black text-slate-900 md:text-5xl">
            Let&apos;s build your profile
          </h1>
          <p className="text-lg text-slate-600">
            Get matched with scholarships in 30 seconds. Upload your Common App or fill it out manually.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <PDFUploader />

          <div className="relative my-8 flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-slate-200" />
            <span className="relative bg-white px-3 text-xs font-semibold text-slate-500">
              OR
            </span>
          </div>

          <Link
            href="/onboarding/manual"
            className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 px-6 py-5 text-left transition hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <span className="text-lg font-semibold text-slate-900">📝 Fill Out Manually</span>
            <span className="text-sm text-slate-600">Takes about 10 minutes.</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
