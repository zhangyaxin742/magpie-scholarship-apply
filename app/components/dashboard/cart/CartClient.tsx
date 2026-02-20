'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/app/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

import { ApplicationHelperModal } from './ApplicationHelperModal';
import { EssayPickerModal } from './EssayPickerModal';
import type { CartItem, CartResponse, Essay } from './types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return dateFormatter.format(parsed);
};

const fetchJson = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
};

const downloadFile = async (url: string, filename: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Download failed');
  }
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
};

const computeDaysRemaining = (deadline: string) => {
  const now = new Date();
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.ceil((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const buildRequirements = (item: CartItem) => {
  const scholarship = item.scholarship;
  return {
    essay: Boolean(scholarship.requires_essay),
    recommendation: Boolean(scholarship.requires_recommendation),
    transcript: Boolean(scholarship.requires_transcript),
    resume: Boolean(scholarship.requires_resume)
  };
};

type CartUpdatePayload = Partial<
  Pick<CartItem, 'status' | 'amount_won' | 'decision_date' | 'user_notes'>
>;

const applyOptimisticUpdate = (
  current: CartResponse,
  id: string,
  payload: CartUpdatePayload
): CartResponse => {
  const lists = {
    inCart: [...current.inCart],
    applied: [...current.applied],
    won: [...current.won],
    lost: [...current.lost]
  };

  const allItems = [...lists.inCart, ...lists.applied, ...lists.won, ...lists.lost];
  const existing = allItems.find((item) => item.id === id);
  if (!existing) return current;

  const updatedItem: CartItem = {
    ...existing,
    status: payload.status ?? existing.status,
    amount_won: payload.amount_won ?? existing.amount_won,
    decision_date: payload.decision_date ?? existing.decision_date,
    user_notes: payload.user_notes ?? existing.user_notes
  };

  lists.inCart = lists.inCart.filter((item) => item.id !== id);
  lists.applied = lists.applied.filter((item) => item.id !== id);
  lists.won = lists.won.filter((item) => item.id !== id);
  lists.lost = lists.lost.filter((item) => item.id !== id);

  switch (updatedItem.status) {
    case 'in_cart':
      lists.inCart.push(updatedItem);
      break;
    case 'won':
      lists.won.push(updatedItem);
      break;
    case 'lost':
      lists.lost.push(updatedItem);
      break;
    default:
      lists.applied.push(updatedItem);
      break;
  }

  return lists;
};

interface CartClientProps {
  initialCart: CartResponse;
  essays: Essay[];
}

export function CartClient({ initialCart, essays }: CartClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const shouldReduceMotion = useReducedMotion();

  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'applied' || tabParam === 'won' ? tabParam : 'in_cart';

  const [activeTab, setActiveTab] = useState<'in_cart' | 'applied' | 'won'>(initialTab);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [essayModalItem, setEssayModalItem] = useState<CartItem | null>(null);
  const [applyModalItem, setApplyModalItem] = useState<CartItem | null>(null);
  const [winForm, setWinForm] = useState<{ id: string; amount: string; date: string } | null>(
    null
  );

  const confettiFired = useRef(false);

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: () => fetchJson<CartResponse>('/api/cart'),
    initialData: initialCart
  });

  const cart = cartQuery.data ?? initialCart;

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      const nextTab = tabParam === 'applied' || tabParam === 'won' ? tabParam : 'in_cart';
      setActiveTab(nextTab);
    }
  }, [tabParam, activeTab]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (activeTab !== 'won' || confettiFired.current) return;
    confettiFired.current = true;
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  }, [activeTab]);

  const updateCartMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CartUpdatePayload }) =>
      fetchJson<CartItem>(`/api/cart/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previous = queryClient.getQueryData<CartResponse>(['cart']);
      if (!previous) return { previous };
      const next = applyOptimisticUpdate(previous, id, payload);
      queryClient.setQueryData(['cart'], next);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['cart'], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const removeCartMutation = useMutation({
    mutationFn: (scholarshipId: string) =>
      fetchJson<{ success: true }>('/api/cart', {
        method: 'DELETE',
        body: JSON.stringify({ scholarshipId })
      }),
    onMutate: async (scholarshipId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previous = queryClient.getQueryData<CartResponse>(['cart']);
      if (!previous) return { previous };
      const next: CartResponse = {
        inCart: previous.inCart.filter((item) => item.scholarship_id !== scholarshipId),
        applied: previous.applied.filter((item) => item.scholarship_id !== scholarshipId),
        won: previous.won.filter((item) => item.scholarship_id !== scholarshipId),
        lost: previous.lost.filter((item) => item.scholarship_id !== scholarshipId)
      };
      queryClient.setQueryData(['cart'], next);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['cart'], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

  const totalPotential = useMemo(() => {
    const sum = (items: CartItem[]) => items.reduce((total, item) => total + (item.scholarship.amount ?? 0), 0);
    return sum(cart.inCart) + sum(cart.applied);
  }, [cart.applied, cart.inCart]);

  const earliestDeadline = useMemo(() => {
    if (!cart.inCart.length) return null;
    return cart.inCart.reduce((earliest, item) => {
      const current = new Date(item.scholarship.deadline);
      if (!earliest) return item;
      const earliestDate = new Date(earliest.scholarship.deadline);
      return current < earliestDate ? item : earliest;
    }, null as CartItem | null);
  }, [cart.inCart]);

  const earliestDays = earliestDeadline
    ? computeDaysRemaining(earliestDeadline.scholarship.deadline)
    : null;
  const earliestTone =
    earliestDays !== null && earliestDays <= 7
      ? 'text-red-600'
      : earliestDays !== null && earliestDays <= 14
        ? 'text-yellow-600'
        : 'text-slate-600';

  const appliedItems = useMemo(() => {
    const combined = [...cart.applied, ...cart.lost];
    return combined.sort((a, b) => {
      const aDate = a.applied_at ? new Date(a.applied_at).getTime() : 0;
      const bDate = b.applied_at ? new Date(b.applied_at).getTime() : 0;
      if (aDate !== bDate) return bDate - aDate;
      const aDecision = a.decision_date ? new Date(a.decision_date).getTime() : 0;
      const bDecision = b.decision_date ? new Date(b.decision_date).getTime() : 0;
      return bDecision - aDecision;
    });
  }, [cart.applied, cart.lost]);

  const handleTabChange = (value: string) => {
    const nextTab = value === 'applied' || value === 'won' ? value : 'in_cart';
    setActiveTab(nextTab);
    router.replace(`/dashboard/cart?tab=${nextTab}`, { scroll: false });
  };

  const handleDownload = async (type: 'csv' | 'calendar') => {
    try {
      if (type === 'csv') {
        await downloadFile('/api/cart/export', 'magpie-scholarships.csv');
      } else {
        await downloadFile('/api/cart/calendar', 'magpie-deadlines.ics');
      }
    } catch {
      setToastMessage('Download failed. Please try again.');
    }
  };

  const handleApplyNow = (item: CartItem) => {
    window.open(item.scholarship.application_url, '_blank');
    setApplyModalItem(item);
  };

  const handleAppliedConfirm = () => {
    if (!applyModalItem) return;
    updateCartMutation.mutate({ id: applyModalItem.id, payload: { status: 'applied' } });
    setToastMessage('Application tracked! 🎉');
    setApplyModalItem(null);
  };

  const handleMarkWon = (item: CartItem) => {
    setWinForm({ id: item.id, amount: '', date: '' });
  };

  const handleConfirmWin = () => {
    if (!winForm) return;
    const amount = Number(winForm.amount);
    if (!amount || !winForm.date) return;
    updateCartMutation.mutate({
      id: winForm.id,
      payload: { status: 'won', amount_won: amount, decision_date: winForm.date }
    });
    setWinForm(null);
  };

  const handleMarkLost = (item: CartItem) => {
    const today = new Date().toISOString().slice(0, 10);
    updateCartMutation.mutate({ id: item.id, payload: { status: 'lost', decision_date: today } });
  };

  const renderInCartItem = (item: CartItem, index: number) => {
    const deadlineLabel = formatDate(item.scholarship.deadline);
    const daysRemaining = computeDaysRemaining(item.scholarship.deadline);
    const urgencyLabel = (() => {
      if (daysRemaining === null) return '—';
      if (daysRemaining <= 0) return '🚨 Due today!';
      if (daysRemaining === 1) return '🚨 Due tomorrow!';
      if (daysRemaining <= 7) return `⚠️ ${daysRemaining} days`;
      if (daysRemaining <= 14) return `⚠️ ${daysRemaining} days`;
      return `${daysRemaining} days`;
    })();
    const urgencyTone = (() => {
      if (daysRemaining === null) return 'text-slate-500';
      if (daysRemaining <= 1) return 'text-red-600 font-black';
      if (daysRemaining <= 7) return 'text-red-600 font-semibold';
      if (daysRemaining <= 14) return 'text-yellow-600 font-semibold';
      return 'text-slate-500';
    })();

    const requirements = buildRequirements(item);
    const hasRequirements =
      requirements.essay || requirements.recommendation || requirements.transcript || requirements.resume;

    return (
      <motion.div
        key={item.id}
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: index * 0.06 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">{item.scholarship.name}</p>
            <p className="text-sm text-slate-500">
              {item.scholarship.organization ?? 'Organization'} · Due: {deadlineLabel} ·{' '}
              <span className={urgencyTone}>{urgencyLabel}</span>
            </p>
          </div>
          <p className="text-lg font-bold text-blue-600">
            {item.scholarship.amount ? currencyFormatter.format(item.scholarship.amount) : '—'}
          </p>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-sm font-semibold text-slate-700">What you&apos;ll need:</p>
          {hasRequirements ? (
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              {requirements.essay ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-green-600">✓ Essay ({item.scholarship.essay_word_count ?? '?'}w)</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEssayModalItem(item)}
                    aria-label="Copy essay"
                  >
                    Copy Essay →
                  </Button>
                </div>
              ) : null}
              {requirements.resume ? <div>✓ Resume</div> : null}
              {requirements.recommendation ? <div>☐ Recommendation letter</div> : null}
              {requirements.transcript ? <div>☐ Transcript</div> : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-green-600">No specific materials required ✓</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button
            className="rounded-xl bg-blue-600 px-5 text-sm text-white hover:bg-blue-700"
            onClick={() => handleApplyNow(item)}
          >
            Apply Now →
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="text-sm text-slate-400 transition hover:text-red-500"
              >
                Remove ×
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this scholarship?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the scholarship from your cart.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => removeCartMutation.mutate(item.scholarship_id)}
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    );
  };

  const renderAppliedItem = (item: CartItem, index: number) => {
    const appliedLabel = item.applied_at ? formatDate(item.applied_at) : '—';
    const decisionLabel = item.decision_date ? formatDate(item.decision_date) : null;
    const statusBadge = item.status === 'won'
      ? 'bg-green-100 text-green-700'
      : item.status === 'lost'
        ? 'bg-red-100 text-red-600'
        : 'bg-slate-100 text-slate-600';
    const statusText = item.status === 'won' ? 'Won 🏆' : item.status === 'lost' ? 'Not selected' : 'Pending';

    const isEditingWin = winForm?.id === item.id;

    return (
      <motion.div
        key={item.id}
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: index * 0.06 }}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">{item.scholarship.name}</p>
            <p className="text-sm text-slate-500">Applied: {appliedLabel}</p>
            {decisionLabel ? (
              <p className="text-sm text-slate-500">Decision expected: {decisionLabel}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-600">
              {item.scholarship.amount ? currencyFormatter.format(item.scholarship.amount) : '—'}
            </p>
            <span className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', statusBadge)}>
              {statusText}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {item.status !== 'won' ? (
            <Button variant="outline" size="sm" onClick={() => handleMarkWon(item)}>
              Mark as Won
            </Button>
          ) : null}
          {item.status !== 'lost' ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                  Mark as Lost
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark as lost?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move the scholarship to lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleMarkLost(item)}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Mark Lost
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>

        <AnimatePresence>
          {isEditingWin ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-4"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount won
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={winForm.amount}
                    onChange={(event) =>
                      setWinForm((prev) =>
                        prev ? { ...prev, amount: event.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Decision date
                  </label>
                  <Input
                    type="date"
                    value={winForm.date}
                    onChange={(event) =>
                      setWinForm((prev) =>
                        prev ? { ...prev, date: event.target.value } : prev
                      )
                    }
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setWinForm(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirmWin}>
                  Confirm Win
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderWonItem = (item: CartItem, index: number) => {
    return (
      <motion.div
        key={item.id}
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: index * 0.06 }}
        className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-slate-900">{item.scholarship.name}</p>
            <p className="text-sm text-slate-500">{item.scholarship.organization ?? 'Organization'}</p>
            {item.decision_date ? (
              <p className="text-xs text-slate-400">Awarded: {formatDate(item.decision_date)}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">
              {item.amount_won
                ? `Won: ${currencyFormatter.format(item.amount_won)}`
                : 'Won'}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500">Total potential</p>
            <p className="text-2xl font-bold text-slate-900">
              {currencyFormatter.format(totalPotential)}
            </p>
            <p className={cn('text-sm', earliestTone)}>
              Earliest deadline:{' '}
              {earliestDeadline ? formatDate(earliestDeadline.scholarship.deadline) : '—'}
              {earliestDays !== null ? ` (${earliestDays} days!)` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => handleDownload('csv')}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleDownload('calendar')}>
              <ArrowUpRight className="h-4 w-4" /> Download Calendar
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toastMessage ? (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm"
          >
            {toastMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="in_cart">In Cart ({cart.inCart.length})</TabsTrigger>
            <TabsTrigger value="applied">Applied ({appliedItems.length})</TabsTrigger>
            <TabsTrigger value="won">Won 🏆 ({cart.won.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="in_cart">
            <div className="space-y-4">
              <AnimatePresence>
                {cart.inCart.map((item, index) => renderInCartItem(item, index))}
              </AnimatePresence>

              {cart.inCart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center">
                  <div className="text-4xl">🧺</div>
                  <h4 className="mt-4 text-lg font-semibold text-slate-900">Cart is empty</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Head to Find Money to add scholarships to your cart.
                  </p>
                  <Button className="mt-5" onClick={() => router.push('/dashboard/search')}>
                    Find scholarships
                  </Button>
                </div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="applied">
            <div className="space-y-4">
              <AnimatePresence>
                {appliedItems.map((item, index) => renderAppliedItem(item, index))}
              </AnimatePresence>

              {appliedItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center">
                  <div className="text-4xl">📨</div>
                  <h4 className="mt-4 text-lg font-semibold text-slate-900">Nothing applied yet</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Head to your cart and start applying!
                  </p>
                  <Button className="mt-5" onClick={() => handleTabChange('in_cart')}>
                    Go to Cart →
                  </Button>
                </div>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="won">
            <div className="space-y-4">
              {cart.won.length ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xl font-bold text-green-600">
                  🏆 Total won: {currencyFormatter.format(
                    cart.won.reduce((total, item) => total + (item.amount_won ?? 0), 0)
                  )}
                </div>
              ) : null}

              <AnimatePresence>
                {cart.won.map((item, index) => renderWonItem(item, index))}
              </AnimatePresence>

              {cart.won.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center">
                  <div className="text-4xl">🏆</div>
                  <h4 className="mt-4 text-lg font-semibold text-slate-900">
                    Nothing yet — but it&apos;s coming.
                  </h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Keep applying and let Magpie track every win.
                  </p>
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EssayPickerModal
        isOpen={Boolean(essayModalItem)}
        onClose={() => setEssayModalItem(null)}
        essays={essays}
        scholarshipName={essayModalItem?.scholarship.name ?? ''}
      />

      <ApplicationHelperModal
        isOpen={Boolean(applyModalItem)}
        scholarship={applyModalItem?.scholarship ?? null}
        essays={essays}
        onApplied={handleAppliedConfirm}
        onClose={() => setApplyModalItem(null)}
      />
    </section>
  );
}
