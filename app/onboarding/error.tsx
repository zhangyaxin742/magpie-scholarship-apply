'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OnboardingErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OnboardingError({ error, reset }: OnboardingErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error('Onboarding error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="text-sm text-slate-600">We hit a snag while loading onboarding. Try again or return to the start.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push('/onboarding')}
            className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600"
          >
            Back to start
          </button>
        </div>
      </div>
    </div>
  );
}
