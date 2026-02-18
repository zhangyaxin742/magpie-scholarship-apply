'use client';

import { DashboardError } from '@/app/components/dashboard/DashboardError';

export default function DashboardErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} />;
}
