'use client';

import { useMemo } from 'react';
import { Calendar, ExternalLink } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/app/components/ui/dialog';
import type { Scholarship, UserProfileSummary } from '@/app/components/dashboard/search/types';

interface ScholarshipDetailModalProps {
  scholarship: Scholarship | null;
  userProfile: UserProfileSummary;
  isOpen: boolean;
  isInCart: boolean;
  onClose: () => void;
  onAdd: () => void;
  onReject: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});

export function ScholarshipDetailModal({
  scholarship,
  userProfile,
  isOpen,
  isInCart,
  onClose,
  onAdd,
  onReject
}: ScholarshipDetailModalProps) {
  const locationBadge = useMemo(() => {
    if (!scholarship) return null;
    if (scholarship.isLocal) {
      return { label: '📍 Local', className: 'bg-green-100 text-green-700' };
    }
    if (scholarship.isNational) {
      return { label: '🌐 National', className: 'bg-slate-100 text-slate-600' };
    }
    return {
      label: `📍 ${userProfile.state ?? 'State'}`,
      className: 'bg-blue-100 text-blue-700'
    };
  }, [scholarship, userProfile.state]);

  const competitionBadge = useMemo(() => {
    if (!scholarship) return null;
    if (scholarship.estimatedApplicants !== null) {
      if (scholarship.estimatedApplicants < 100 || scholarship.competitionLevel === 'local') {
        return {
          label: `🟢 Low competition (~${scholarship.estimatedApplicants} applicants)`,
          className: 'bg-green-100 text-green-700'
        };
      }
      if (scholarship.estimatedApplicants >= 100 && scholarship.estimatedApplicants <= 500) {
        return { label: '🟡 Medium competition', className: 'bg-yellow-100 text-yellow-700' };
      }
      return { label: '🔴 High competition', className: 'bg-red-100 text-red-700' };
    }
    if (scholarship.competitionLevel === 'local') {
      return { label: '🟢 Low competition', className: 'bg-green-100 text-green-700' };
    }
    if (scholarship.competitionLevel === 'regional') {
      return { label: '🟡 Medium competition', className: 'bg-yellow-100 text-yellow-700' };
    }
    if (scholarship.competitionLevel === 'national') {
      return { label: '🔴 High competition', className: 'bg-red-100 text-red-700' };
    }
    return null;
  }, [scholarship]);

  if (!scholarship) return null;

  const deadlineDate = new Date(scholarship.deadline);
  const deadlineLabel = Number.isNaN(deadlineDate.getTime())
    ? 'Deadline unknown'
    : dateFormatter.format(deadlineDate);

  const amountLabel = scholarship.amount ? currencyFormatter.format(scholarship.amount) : 'Not specified';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scholarship.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">{scholarship.organization ?? 'Organization not listed'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {locationBadge ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${locationBadge.className}`}>
                  {locationBadge.label}
                </span>
              ) : null}
              {competitionBadge ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${competitionBadge.className}`}
                >
                  {competitionBadge.label}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div className="text-xl font-black text-blue-600">💰 {amountLabel}</div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {deadlineLabel} · {scholarship.daysUntilDeadline} days remaining
            </div>
          </div>

          {scholarship.matchReason ? (
            <div className="rounded-lg bg-indigo-50 px-3 py-2 text-xs italic text-indigo-700">
              ✨ {scholarship.matchReason}
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Requirements</h3>
            <ul className="space-y-1 text-sm text-slate-600">
              {scholarship.requiresEssay && (
                <li>Essay {scholarship.essayWordCount ? `(${scholarship.essayWordCount}w)` : ''}</li>
              )}
              {scholarship.requiresRecommendation && <li>Recommendation letter</li>}
              {scholarship.requiresTranscript && <li>Transcript</li>}
              {scholarship.requiresResume && <li>Resume</li>}
              {!scholarship.requiresEssay &&
                !scholarship.requiresRecommendation &&
                !scholarship.requiresTranscript &&
                !scholarship.requiresResume && <li>No specific materials required ✓</li>}
            </ul>
          </div>

          {scholarship.essayPrompts && scholarship.essayPrompts.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Essay Prompts</h3>
              <div className="mt-2 space-y-2">
                {scholarship.essayPrompts.map((prompt, index) => (
                  <blockquote
                    key={`${scholarship.id}-prompt-${index}`}
                    className="border-l-4 border-blue-200 pl-4 italic text-sm text-slate-600"
                  >
                    {prompt}
                  </blockquote>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold text-slate-700">Description</h3>
            <p className="mt-2 text-sm text-slate-600">
              {scholarship.fullDescription || scholarship.shortDescription || 'No description provided.'}
            </p>
          </div>

          <div>
            <a
              href={scholarship.applicationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Apply link <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={onReject}>
            Pass
          </Button>
          <Button variant="outline" onClick={onAdd}>
            Add to Cart
          </Button>
          {isInCart ? (
            <Button onClick={() => window.open(scholarship.applicationUrl, '_blank')}>Apply Now ↗</Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
