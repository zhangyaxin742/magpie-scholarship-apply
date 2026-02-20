'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';
import {
  defaultSearchFilters,
  type Scholarship,
  type ScholarshipSearchResponse,
  type SearchFilters,
  type UserProfileSummary
} from '@/app/components/dashboard/search/types';

import { FiltersSidebar } from './FiltersSidebar';
import { ScholarshipCard } from './ScholarshipCard';
import { ScholarshipDetailModal } from './ScholarshipDetailModal';

interface SearchState {
  filters: SearchFilters;
  cards: Scholarship[];
  cursor: string | null;
  isLoading: boolean;
  aiRanked: boolean;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setCards: (cards: Scholarship[], cursor: string | null, aiRanked: boolean) => void;
  removeCard: (id: string) => void;
  setLoading: (value: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  filters: defaultSearchFilters,
  cards: [],
  cursor: null,
  isLoading: false,
  aiRanked: true,
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters }
    })),
  setCards: (cards, cursor, aiRanked) =>
    set({
      cards,
      cursor,
      aiRanked
    }),
  removeCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== id)
    })),
  setLoading: (value) => set({ isLoading: value })
}));

interface ScholarshipSearchClientProps {
  initialScholarships: Scholarship[];
  initialCursor: string | null;
  initialAiRanked: boolean;
  userProfile: UserProfileSummary;
}

interface RequirementFilters {
  noEssay: boolean;
  noRecommendation: boolean;
  hasEssayPrompt: boolean;
}

const buildQueryParams = (filters: SearchFilters, cursor?: string | null) => {
  const params = new URLSearchParams();
  params.set('location', filters.location);
  params.set('amount', filters.amount);
  params.set('deadline', filters.deadline);
  params.set('competition', filters.competition);
  params.set('requiresEssay', filters.requiresEssay);
  if (cursor) params.set('cursor', cursor);
  params.set('limit', cursor ? '5' : '20');
  return params.toString();
};

const fetchScholarships = async (
  filters: SearchFilters,
  cursor?: string | null
): Promise<ScholarshipSearchResponse> => {
  const params = buildQueryParams(filters, cursor);
  const response = await fetch(`/api/scholarships/search?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch scholarships');
  }
  return response.json();
};

export function ScholarshipSearchClient({
  initialScholarships,
  initialCursor,
  initialAiRanked,
  userProfile
}: ScholarshipSearchClientProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [detailScholarship, setDetailScholarship] = useState<Scholarship | null>(null);
  const [cartIds, setCartIds] = useState<Set<string>>(new Set());
  const [requirements, setRequirements] = useState<RequirementFilters>({
    noEssay: false,
    noRecommendation: false,
    hasEssayPrompt: false
  });

  const filters = useSearchStore((state) => state.filters);
  const cards = useSearchStore((state) => state.cards);
  const cursor = useSearchStore((state) => state.cursor);
  const isLoading = useSearchStore((state) => state.isLoading);
  const aiRanked = useSearchStore((state) => state.aiRanked);
  const setFilters = useSearchStore((state) => state.setFilters);
  const setCards = useSearchStore((state) => state.setCards);
  const removeCard = useSearchStore((state) => state.removeCard);
  const setLoading = useSearchStore((state) => state.setLoading);

  const hasInitialized = useRef(false);
  const filterInit = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    setCards(initialScholarships, initialCursor, initialAiRanked);
    hasInitialized.current = true;
  }, [initialAiRanked, initialCursor, initialScholarships, setCards]);

  const isDefaultFilters = useMemo(
    () => JSON.stringify(filters) === JSON.stringify(defaultSearchFilters),
    [filters]
  );

  const searchQuery = useQuery({
    queryKey: ['scholarship-search', filters],
    queryFn: () => fetchScholarships(filters, null),
    enabled: hasInitialized.current,
    initialData: isDefaultFilters
      ? {
          scholarships: initialScholarships,
          nextCursor: initialCursor,
          aiRanked: initialAiRanked,
          totalCount: initialScholarships.length
        }
      : undefined,
    staleTime: 60_000
  });

  useEffect(() => {
    if (!hasInitialized.current) return;
    if (searchQuery.isFetching) {
      setLoading(true);
      return;
    }
    if (searchQuery.data) {
      setCards(searchQuery.data.scholarships, searchQuery.data.nextCursor, searchQuery.data.aiRanked);
      setLoading(false);
    }
  }, [searchQuery.data, searchQuery.isFetching, setCards, setLoading]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    if (!filterInit.current) {
      filterInit.current = true;
      return;
    }
    setLoading(true);
    setCards([], null, true);
  }, [filters, setCards, setLoading]);

  const visibleCards = useMemo(() => {
    return cards.filter((card) => {
      if (requirements.noEssay && card.requiresEssay) return false;
      if (requirements.noRecommendation && card.requiresRecommendation) return false;
      if (requirements.hasEssayPrompt && (!card.essayPrompts || card.essayPrompts.length === 0))
        return false;
      return true;
    });
  }, [cards, requirements]);

  const fetchMore = useCallback(async () => {
    const state = useSearchStore.getState();
    if (!state.cursor || state.isLoading) return;
    try {
      setLoading(true);
      const data = await queryClient.fetchQuery({
        queryKey: ['scholarship-search', filters, state.cursor],
        queryFn: () => fetchScholarships(filters, state.cursor)
      });
      const currentCards = useSearchStore.getState().cards;
      setCards([...currentCards, ...data.scholarships], data.nextCursor, data.aiRanked);
    } catch (error) {
      setLoading(false);
    }
  }, [filters, queryClient, setCards, setLoading]);

  useEffect(() => {
    if (visibleCards.length <= 2 && cursor && !isLoading) {
      fetchMore();
    }
  }, [cursor, fetchMore, isLoading, visibleCards.length]);

  const handleCartAction = async (scholarshipId: string, action: 'add' | 'reject') => {
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scholarshipId, action })
    });
  };

  const handleAdd = async (scholarship: Scholarship) => {
    await handleCartAction(scholarship.id, 'add');
    setCartIds((prev) => new Set(prev).add(scholarship.id));
    removeCard(scholarship.id);
  };

  const handleReject = async (scholarship: Scholarship) => {
    await handleCartAction(scholarship.id, 'reject');
    removeCard(scholarship.id);
  };

  const handleMoreInfo = (scholarship: Scholarship) => {
    setDetailScholarship(scholarship);
  };

  const handleRequirementChange = (next: RequirementFilters) => {
    setRequirements(next);
    let requiresEssay: SearchFilters['requiresEssay'] = 'any';
    if (next.noEssay && !next.hasEssayPrompt) requiresEssay = 'no';
    if (!next.noEssay && next.hasEssayPrompt) requiresEssay = 'yes';
    if (next.noEssay && next.hasEssayPrompt) requiresEssay = 'any';
    setFilters({ requiresEssay });
  };

  const handleResetFilters = () => {
    setRequirements({ noEssay: false, noRecommendation: false, hasEssayPrompt: false });
    setFilters(defaultSearchFilters);
  };

  const stackCards = visibleCards.slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Find Money</h1>
          <p className="mt-1 text-sm text-slate-600">
            Swipe right to add a scholarship to your cart.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="md:hidden"
          onClick={() => setIsFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {!aiRanked && !isLoading ? (
        <p className="text-xs italic text-slate-400">
          Showing scholarships by deadline — personalized matching temporarily unavailable
        </p>
      ) : null}

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="hidden w-[260px] shrink-0 border-r border-slate-200 pr-4 md:block">
          <FiltersSidebar
            filters={filters}
            requirements={requirements}
            onChange={setFilters}
            onRequirementsChange={handleRequirementChange}
            onClear={handleResetFilters}
          />
        </aside>

        <div className="relative flex min-h-[520px] flex-1 items-center justify-center">
          {isLoading ? (
            <div className="w-full max-w-[480px] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="mt-6 h-20 w-full animate-pulse rounded bg-slate-200" />
              <div className="mt-6 flex gap-3">
                <div className="h-10 flex-1 animate-pulse rounded bg-slate-200" />
                <div className="h-10 flex-1 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ) : stackCards.length ? (
            <div className="relative w-full max-w-[520px]">
              <AnimatePresence initial={false}>
                {stackCards.map((scholarship, index) => {
                  const isTop = index === 0;
                  return (
                    <motion.div
                      key={scholarship.id}
                      className="absolute inset-0"
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: 'easeOut' }}
                      style={{ zIndex: stackCards.length - index }}
                    >
                      <ScholarshipCard
                        scholarship={scholarship}
                        userProfile={userProfile}
                        onAdd={() => handleAdd(scholarship)}
                        onReject={() => handleReject(scholarship)}
                        onMoreInfo={() => handleMoreInfo(scholarship)}
                        isTop={isTop}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-4xl">🎉</div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  You've seen all matching scholarships!
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Adjust your filters or check back as we add more.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={handleResetFilters}>
                  Browse with different filters
                </Button>
                <Button onClick={() => router.push('/dashboard/cart')}>Go to Cart</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DialogContent className="top-auto bottom-0 w-full max-w-none rounded-t-2xl translate-y-0">
          <FiltersSidebar
            filters={filters}
            requirements={requirements}
            onChange={setFilters}
            onRequirementsChange={handleRequirementChange}
            onClear={() => {
              handleResetFilters();
              setIsFiltersOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <ScholarshipDetailModal
        scholarship={detailScholarship}
        userProfile={userProfile}
        isOpen={Boolean(detailScholarship)}
        isInCart={detailScholarship ? cartIds.has(detailScholarship.id) : false}
        onClose={() => setDetailScholarship(null)}
        onAdd={() => {
          if (detailScholarship) handleAdd(detailScholarship);
          setDetailScholarship(null);
        }}
        onReject={() => {
          if (detailScholarship) handleReject(detailScholarship);
          setDetailScholarship(null);
        }}
      />
    </section>
  );
}
