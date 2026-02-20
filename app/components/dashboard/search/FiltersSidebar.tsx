'use client';

import { useEffect, useRef, useState } from 'react';

import { Checkbox } from '@/app/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Button } from '@/app/components/ui/button';
import type { SearchFilters } from '@/app/components/dashboard/search/types';

interface RequirementFilters {
  noEssay: boolean;
  noRecommendation: boolean;
  hasEssayPrompt: boolean;
}

interface FiltersSidebarProps {
  filters: SearchFilters;
  requirements: RequirementFilters;
  onChange: (filters: Partial<SearchFilters>) => void;
  onRequirementsChange: (requirements: RequirementFilters) => void;
  onClear: () => void;
}

export function FiltersSidebar({
  filters,
  requirements,
  onChange,
  onRequirementsChange,
  onClear
}: FiltersSidebarProps) {
  const [draftFilters, setDraftFilters] = useState<SearchFilters>(filters);
  const didMount = useRef(false);
  const isSyncing = useRef(false);

  useEffect(() => {
    isSyncing.current = true;
    setDraftFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (isSyncing.current) {
      isSyncing.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      onChange(draftFilters);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draftFilters, onChange]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Filter Scholarships</h2>
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Location
          </p>
          <RadioGroup
            value={draftFilters.location}
            onValueChange={(value) =>
              setDraftFilters((prev) => ({ ...prev, location: value as SearchFilters['location'] }))
            }
          >
            {[
              { value: 'all', label: 'All Scholarships' },
              { value: 'local', label: 'Local Only' },
              { value: 'state', label: 'My State' },
              { value: 'national', label: 'National' }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-600">
                <RadioGroupItem value={option.value} id={`location-${option.value}`} />
                {option.label}
              </label>
            ))}
          </RadioGroup>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Amount</p>
          <RadioGroup
            value={draftFilters.amount}
            onValueChange={(value) =>
              setDraftFilters((prev) => ({ ...prev, amount: value as SearchFilters['amount'] }))
            }
          >
            {[
              { value: 'any', label: 'Any Amount' },
              { value: '1k', label: '$1,000+' },
              { value: '5k', label: '$5,000+' },
              { value: '10k', label: '$10,000+' }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-600">
                <RadioGroupItem value={option.value} id={`amount-${option.value}`} />
                {option.label}
              </label>
            ))}
          </RadioGroup>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Deadline</p>
          <RadioGroup
            value={draftFilters.deadline}
            onValueChange={(value) =>
              setDraftFilters((prev) => ({ ...prev, deadline: value as SearchFilters['deadline'] }))
            }
          >
            {[
              { value: 'any', label: 'Any Time' },
              { value: 'month', label: 'This Month' },
              { value: 'quarter', label: 'This Quarter' }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-600">
                <RadioGroupItem value={option.value} id={`deadline-${option.value}`} />
                {option.label}
              </label>
            ))}
          </RadioGroup>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Competition
          </p>
          <RadioGroup
            value={draftFilters.competition}
            onValueChange={(value) =>
              setDraftFilters((prev) => ({
                ...prev,
                competition: value as SearchFilters['competition']
              }))
            }
          >
            {[
              { value: 'any', label: 'Any' },
              { value: 'low', label: '🟢 Low (<100 applicants)' },
              { value: 'medium', label: '🟡 Medium' },
              { value: 'high', label: '🔴 High' }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-slate-600">
                <RadioGroupItem value={option.value} id={`competition-${option.value}`} />
                {option.label}
              </label>
            ))}
          </RadioGroup>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Requirements
          </p>
          <div className="space-y-2 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={requirements.noEssay}
                onCheckedChange={(checked) =>
                  onRequirementsChange({
                    ...requirements,
                    noEssay: Boolean(checked)
                  })
                }
              />
              No Essay Required
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={requirements.noRecommendation}
                onCheckedChange={(checked) =>
                  onRequirementsChange({
                    ...requirements,
                    noRecommendation: Boolean(checked)
                  })
                }
              />
              No Rec Letter
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={requirements.hasEssayPrompt}
                onCheckedChange={(checked) =>
                  onRequirementsChange({
                    ...requirements,
                    hasEssayPrompt: Boolean(checked)
                  })
                }
              />
              Has Essay Prompt
            </label>
          </div>
        </div>
      </div>

      <Button variant="ghost" size="sm" className="text-blue-600" onClick={onClear}>
        Clear all filters
      </Button>
    </div>
  );
}
