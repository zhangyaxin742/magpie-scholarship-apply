import { headers } from 'next/headers';

import { PendingReviewClient } from '@/app/components/admin/PendingReviewClient';

const allowedStatuses = ['pending', 'needs_review', 'approved', 'rejected'] as const;
type ReviewStatus = (typeof allowedStatuses)[number];

type PendingItem = {
  id: string;
  source_url: string;
  raw_page_text: string | null;
  extracted_data: Record<string, unknown> | null;
  extraction_model: string | null;
  extraction_confidence: string | number | null;
  status: string | null;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  scholarship_id: string | null;
  created_at: string | null;
};

const normalizeStatus = (status?: string): ReviewStatus => {
  if (!status) return 'pending';
  return (allowedStatuses as readonly string[]).includes(status) ? (status as ReviewStatus) : 'pending';
};

const buildBaseUrl = async () => {
  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');

  if (host) {
    const protocol = requestHeaders.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
    return `${protocol}://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
};

const fetchPendingItems = async (
  baseUrl: string,
  status: ReviewStatus,
  pipelineSecret: string
): Promise<PendingItem[]> => {
  const response = await fetch(`${baseUrl}/api/admin/pending?status=${status}&limit=100`, {
    headers: {
      Authorization: `Bearer ${pipelineSecret}`
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? 'Failed to load pending scholarships');
  }

  const payload = (await response.json()) as { items?: Array<Record<string, unknown>> };

  return (payload.items ?? []).map((item) => ({
    id: String(item.id ?? ''),
    source_url: typeof item.source_url === 'string' ? item.source_url : '',
    raw_page_text: typeof item.raw_page_text === 'string' ? item.raw_page_text : null,
    extracted_data:
      item.extracted_data && typeof item.extracted_data === 'object'
        ? (item.extracted_data as Record<string, unknown>)
        : null,
    extraction_model: typeof item.extraction_model === 'string' ? item.extraction_model : null,
    extraction_confidence:
      typeof item.extraction_confidence === 'string' || typeof item.extraction_confidence === 'number'
        ? item.extraction_confidence
        : null,
    status: typeof item.status === 'string' ? item.status : null,
    reviewer_notes: typeof item.reviewer_notes === 'string' ? item.reviewer_notes : null,
    reviewed_by: typeof item.reviewed_by === 'string' ? item.reviewed_by : null,
    reviewed_at: item.reviewed_at ? new Date(String(item.reviewed_at)).toISOString() : null,
    scholarship_id: typeof item.scholarship_id === 'string' ? item.scholarship_id : null,
    created_at: item.created_at ? new Date(String(item.created_at)).toISOString() : null
  }));
};

export default async function AdminPendingPage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialStatus = normalizeStatus(resolvedSearchParams.status);
  const pipelineSecret = process.env.PIPELINE_SECRET;

  if (!pipelineSecret) {
    return (
      <section className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-2xl font-bold text-red-700">Scholarship Review Queue</h1>
        <p className="text-sm text-red-600">PIPELINE_SECRET must be configured to load admin pending items.</p>
      </section>
    );
  }

  try {
    const baseUrl = await buildBaseUrl();
    const [initialItems, pendingItems, needsReviewItems] = await Promise.all([
      fetchPendingItems(baseUrl, initialStatus, pipelineSecret),
      fetchPendingItems(baseUrl, 'pending', pipelineSecret),
      fetchPendingItems(baseUrl, 'needs_review', pipelineSecret)
    ]);

    return (
      <PendingReviewClient
        initialItems={initialItems}
        initialStatus={initialStatus}
        initialPendingCount={pendingItems.length}
        initialNeedsReviewCount={needsReviewItems.length}
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load admin queue';

    return (
      <section className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-2xl font-bold text-red-700">Scholarship Review Queue</h1>
        <p className="text-sm text-red-600">{message}</p>
      </section>
    );
  }
}
