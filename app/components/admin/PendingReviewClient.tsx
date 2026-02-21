'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

const reviewStatuses = ['pending', 'needs_review', 'approved', 'rejected'] as const;
type ReviewStatus = (typeof reviewStatuses)[number];

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

interface PendingReviewClientProps {
  initialItems: PendingItem[];
  initialStatus: ReviewStatus;
  initialPendingCount: number;
  initialNeedsReviewCount: number;
}

type PendingResponse = {
  items: PendingItem[];
};

type PipelineRunResult = {
  queried: number;
  urlsDiscovered: number;
  urlsNewToDb: number;
  pagesFetched: number;
  extracted: number;
  queued: number;
  skippedDeadline: number;
  errors: string[];
};

type PipelineResponse = {
  success: boolean;
  result: PipelineRunResult;
};

type ItemActionPayload = {
  id: string;
  reviewerNotes?: string;
};

const normalizeStatus = (value: string | null): ReviewStatus => {
  if (!value) return 'pending';
  return (reviewStatuses as readonly string[]).includes(value) ? (value as ReviewStatus) : 'pending';
};

const fetchJson = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatDate = (value: string | null) => {
  if (!value) return 'Unknown';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed);
};

const confidenceValue = (value: string | number | null): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const confidenceClasses = (value: number | null) => {
  if (value === null) return 'bg-slate-100 text-slate-600';
  if (value >= 0.8) return 'bg-emerald-100 text-emerald-700';
  if (value >= 0.6) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

export function PendingReviewClient({
  initialItems,
  initialStatus,
  initialPendingCount,
  initialNeedsReviewCount
}: PendingReviewClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [profileId, setProfileId] = useState('');
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedRawIds, setExpandedRawIds] = useState<Set<string>>(new Set());
  const [rejectOpenId, setRejectOpenId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const activeStatus = normalizeStatus(searchParams.get('status'));

  const itemsQuery = useQuery({
    queryKey: ['admin-pending', activeStatus],
    queryFn: async () => {
      const response = await fetchJson<PendingResponse>(
        `/api/admin/pending?status=${activeStatus}&limit=100`
      );
      return response.items;
    },
    initialData: activeStatus === initialStatus ? initialItems : undefined
  });

  const pendingCountQuery = useQuery({
    queryKey: ['admin-pending-count', 'pending'],
    queryFn: async () => {
      const response = await fetchJson<PendingResponse>('/api/admin/pending?status=pending&limit=100');
      return response.items.length;
    },
    initialData: initialPendingCount
  });

  const needsReviewCountQuery = useQuery({
    queryKey: ['admin-pending-count', 'needs_review'],
    queryFn: async () => {
      const response = await fetchJson<PendingResponse>(
        '/api/admin/pending?status=needs_review&limit=100'
      );
      return response.items.length;
    },
    initialData: initialNeedsReviewCount
  });

  const dismissItemThenRefresh = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));

    window.setTimeout(() => {
      setDismissedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-count'] });
    }, 220);
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, reviewerNotes }: ItemActionPayload) =>
      fetchJson<{ success: true }>(`/api/admin/pending/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewerNotes })
      }),
    onSuccess: (_response, variables) => {
      setErrorById((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      dismissItemThenRefresh(variables.id);
    },
    onError: (error, variables) => {
      const message = error instanceof Error ? error.message : 'Approve failed';
      setErrorById((prev) => ({ ...prev, [variables.id]: message }));
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reviewerNotes }: ItemActionPayload) =>
      fetchJson<{ success: true }>(`/api/admin/pending/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reviewerNotes })
      }),
    onSuccess: (_response, variables) => {
      setErrorById((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      setRejectOpenId(null);
      dismissItemThenRefresh(variables.id);
    },
    onError: (error, variables) => {
      const message = error instanceof Error ? error.message : 'Reject failed';
      setErrorById((prev) => ({ ...prev, [variables.id]: message }));
    }
  });

  const pipelineMutation = useMutation({
    mutationFn: (value: string) =>
      fetchJson<PipelineResponse>('/api/scholarships/discover', {
        method: 'POST',
        body: JSON.stringify({ profileId: value })
      }),
    onSuccess: (payload) => {
      const result = payload.result;
      setPipelineMessage(
        `Discovered ${result.urlsDiscovered} URLs -> fetched ${result.pagesFetched} -> extracted ${result.extracted} -> queued ${result.queued} -> skipped ${result.skippedDeadline} (deadline).`
      );
      queryClient.invalidateQueries({ queryKey: ['admin-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-count'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Pipeline run failed';
      setPipelineMessage(message);
    }
  });

  const items = useMemo(() => {
    const source = itemsQuery.data ?? [];
    return source.filter((item) => !dismissedIds.has(item.id));
  }, [dismissedIds, itemsQuery.data]);

  const pendingCount = activeStatus === 'pending' ? items.length : (pendingCountQuery.data ?? 0);
  const needsReviewCount =
    activeStatus === 'needs_review' ? items.length : (needsReviewCountQuery.data ?? 0);

  const isActionLoading = approveMutation.isPending || rejectMutation.isPending;

  const handleStatusChange = (status: ReviewStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', status);
    router.replace(`/admin/pending?${params.toString()}`, { scroll: false });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Scholarship Review Queue</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review AI-extracted scholarship pages and approve clean records into the live catalog.
        </p>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
            placeholder="Profile ID (UUID)"
            className="md:max-w-md"
          />
          <Button
            onClick={() => {
              if (!profileId.trim()) {
                setPipelineMessage('Profile ID is required.');
                return;
              }
              setPipelineMessage(null);
              pipelineMutation.mutate(profileId.trim());
            }}
            disabled={pipelineMutation.isPending}
          >
            {pipelineMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pipelineMutation.isPending ? 'Running...' : 'Run Discovery Pipeline'}
          </Button>
        </div>

        {pipelineMessage ? (
          <p className="mt-3 text-sm text-slate-700" role="status">
            {pipelineMessage}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/50 bg-white/70 p-2 shadow-sm">
        <button
          type="button"
          onClick={() => handleStatusChange('pending')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeStatus === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => handleStatusChange('needs_review')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeStatus === 'needs_review'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          Needs Review ({needsReviewCount})
        </button>
        <button
          type="button"
          onClick={() => handleStatusChange('approved')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeStatus === 'approved'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          Approved
        </button>
        <button
          type="button"
          onClick={() => handleStatusChange('rejected')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeStatus === 'rejected'
              ? 'bg-blue-600 text-white'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rejected
        </button>
      </div>

      {itemsQuery.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Loading review records...
        </div>
      ) : null}

      {itemsQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {itemsQuery.error instanceof Error ? itemsQuery.error.message : 'Failed to load queue'}
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {items.map((item) => {
          const extracted = item.extracted_data;
          const confidence = confidenceValue(item.extraction_confidence);
          const isRawExpanded = expandedRawIds.has(item.id);
          const canReview = activeStatus === 'pending' || activeStatus === 'needs_review';

          const name = asString(extracted?.name) ?? 'Unknown';
          const organization = asString(extracted?.organization) ?? 'Unknown';
          const amount = asNumber(extracted?.amount);
          const deadline = asString(extracted?.deadline) ?? 'Unknown';
          const applicationUrl = asString(extracted?.applicationUrl) ?? item.source_url;
          const cities = asStringArray(extracted?.cities);
          const states = asStringArray(extracted?.states);
          const minGpa = asNumber(extracted?.minGpa);
          const demographics = asStringArray(extracted?.requiredDemographics);
          const requiresEssay = extracted?.requiresEssay === true;
          const essayWordCount = asNumber(extracted?.essayWordCount);
          const shortDescription = asString(extracted?.shortDescription) ?? 'No short description provided.';

          const rawPreview = item.raw_page_text
            ? isRawExpanded
              ? item.raw_page_text
              : `${item.raw_page_text.slice(0, 300)}${item.raw_page_text.length > 300 ? '...' : ''}`
            : 'No raw text captured.';

          return (
            <motion.article
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {item.source_url}
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${confidenceClasses(confidence)}`}
                >
                  Confidence {confidence === null ? 'N/A' : confidence.toFixed(2)}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Extracted name:</span> {name}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Org:</span> {organization}{' '}
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="font-semibold text-slate-900">Amount:</span>{' '}
                  {amount === null ? 'Unknown' : `$${amount.toLocaleString()}`}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Deadline:</span> {deadline}{' '}
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="font-semibold text-slate-900">URL:</span> {applicationUrl}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Location:</span>{' '}
                  {[cities.join(', '), states.join(', ')].filter(Boolean).join(' | ') || 'Unknown'}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">GPA:</span>{' '}
                  {minGpa === null ? 'Unknown' : `${minGpa}+`} <span className="mx-2 text-slate-300">|</span>
                  <span className="font-semibold text-slate-900">Demographics:</span>{' '}
                  {demographics.length ? demographics.join(', ') : 'None listed'}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Essay:</span>{' '}
                  {requiresEssay ? 'Required' : 'Not required'}
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="font-semibold text-slate-900">Word count:</span>{' '}
                  {essayWordCount === null ? 'N/A' : essayWordCount}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Description:</span> {shortDescription}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Queued:</span>{' '}
                  {formatDate(item.created_at)}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedRawIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) {
                        next.delete(item.id);
                      } else {
                        next.add(item.id);
                      }
                      return next;
                    });
                  }}
                  className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  {isRawExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Toggle raw text
                </button>
                <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">{rawPreview}</p>
              </div>

              {errorById[item.id] ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorById[item.id]}
                </p>
              ) : null}

              {canReview ? (
                <div className="mt-4 space-y-3">
                  {rejectOpenId === item.id ? (
                    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                      <Input
                        value={rejectNotes[item.id] ?? ''}
                        onChange={(event) =>
                          setRejectNotes((prev) => ({
                            ...prev,
                            [item.id]: event.target.value
                          }))
                        }
                        placeholder="Optional rejection reason"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setRejectOpenId(null)}
                          disabled={isActionLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            rejectMutation.mutate({
                              id: item.id,
                              reviewerNotes: (rejectNotes[item.id] ?? '').trim() || undefined
                            })
                          }
                          disabled={isActionLoading}
                        >
                          {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => setRejectOpenId(item.id)}
                      disabled={isActionLoading}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                    <Button
                      onClick={() => approveMutation.mutate({ id: item.id })}
                      disabled={isActionLoading}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                  </div>
                </div>
              ) : null}
            </motion.article>
          );
        })}
      </AnimatePresence>

      {!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No records found for <span className="font-semibold text-slate-900">{activeStatus}</span>.
        </div>
      ) : null}
    </section>
  );
}
