'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function DashboardError({ error, reset }: DashboardErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard error</h1>
        <p className="text-sm text-slate-600">
          Something went wrong while loading this page. Try again or head back to your dashboard.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
