'use client';

import { DashboardError } from '@/app/components/dashboard/DashboardError';

export default function KnowledgeError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} />;
}
