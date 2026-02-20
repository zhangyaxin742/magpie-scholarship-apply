'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  animate,
  motion,
  useAnimation,
  useMotionValue,
  useReducedMotion,
  useTransform
} from 'framer-motion';
import { Calendar, Check, X } from 'lucide-react';

import { Button } from '@/app/components/ui/button';
import type { Scholarship, UserProfileSummary } from '@/app/components/dashboard/search/types';

interface ScholarshipCardProps {
  scholarship: Scholarship;
  userProfile: UserProfileSummary;
  onAdd: () => void;
  onReject: () => void;
  onMoreInfo: () => void;
  isTop: boolean;
}

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

export function ScholarshipCard({
  scholarship,
  userProfile,
  onAdd,
  onReject,
  onMoreInfo,
  isTop
}: ScholarshipCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimation();
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-150, 0, 150], [-15, 0, 15]);
  const positiveOpacity = useTransform(dragX, [0, 100], [0, 0.7]);
  const negativeOpacity = useTransform(dragX, [-100, 0], [0.7, 0]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isTop) return;
    dragX.set(0);
    controls.set({ scale: 1, y: 0, opacity: 1 });
  }, [controls, isTop]);

  const amountLabel = scholarship.amount
    ? currencyFormatter.format(scholarship.amount)
    : 'Amount not specified';
  const deadlineDate = new Date(scholarship.deadline);
  const deadlineLabel = Number.isNaN(deadlineDate.getTime())
    ? 'Deadline unknown'
    : dateFormatter.format(deadlineDate);

  const deadlineTone = scholarship.daysUntilDeadline <= 7 ? 'text-red-600 font-semibold' : 'text-slate-500';

  const locationBadge = useMemo(() => {
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
  }, [scholarship.isLocal, scholarship.isNational, userProfile.state]);

  const competitionBadge = useMemo(() => {
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
  }, [scholarship.competitionLevel, scholarship.estimatedApplicants]);

  const description = scholarship.shortDescription || scholarship.fullDescription || '';
  const showMore = description.length > 140;

  const minGpa = scholarship.minGpa ? Number(scholarship.minGpa) : null;
  const gpaEligible =
    minGpa !== null && userProfile.gpa !== null ? userProfile.gpa >= minGpa : null;

  const requires = {
    essay: scholarship.requiresEssay,
    recommendation: scholarship.requiresRecommendation,
    transcript: scholarship.requiresTranscript,
    resume: scholarship.requiresResume
  };

  const animateDragX = (to: number, duration: number) => {
    animate(dragX, to, {
      duration: shouldReduceMotion ? 0 : duration,
      ease: 'easeOut'
    });
  };

  const animateOff = async (direction: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    if (shouldReduceMotion) {
      direction === 'right' ? onAdd() : onReject();
      return;
    }
    const targetX = direction === 'right' ? 700 : -700;
    animateDragX(targetX, 0.3);
    await controls.start({ opacity: 0, transition: { duration: 0.3, ease: 'easeOut' } });
    direction === 'right' ? onAdd() : onReject();
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (!isTop) return;
    if (info.offset.x > 120) {
      animateOff('right');
      return;
    }
    if (info.offset.x < -120) {
      animateOff('left');
      return;
    }
    animateDragX(0, 0.2);
  };

  return (
    <motion.div
      className={`relative w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-xl transition-transform ${
        isTop ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      drag={isTop && !shouldReduceMotion ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      style={isTop ? { x: dragX, rotate } : undefined}
      animate={isTop ? controls : { scale: 0.96, y: 8, opacity: 0.7 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
      onDragEnd={handleDragEnd}
    >
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-green-500/20 text-lg font-semibold text-green-700"
          style={{ opacity: positiveOpacity }}
        >
          ADD ✅
        </motion.div>
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-red-500/20 text-lg font-semibold text-red-700"
          style={{ opacity: negativeOpacity }}
        >
          PASS ❌
        </motion.div>
      </div>

      <div className="p-6 pb-4">
        <h3 className="text-xl font-bold text-slate-900 leading-tight">{scholarship.name}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{scholarship.organization ?? 'Unknown organization'}</p>
      </div>

      <div className="flex items-center justify-between px-6">
        <div className="text-2xl font-black text-blue-600">
          {scholarship.amount ? `💰 ${amountLabel}` : <span className="text-base text-slate-400">Amount not specified</span>}
        </div>
        <div className={`flex items-center gap-2 text-sm ${deadlineTone}`}>
          <Calendar className="h-4 w-4" />
          {deadlineLabel} · {scholarship.daysUntilDeadline} days remaining
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-6 py-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${locationBadge.className}`}>
          {locationBadge.label}
        </span>
        {competitionBadge ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${competitionBadge.className}`}>
            {competitionBadge.label}
          </span>
        ) : null}
      </div>

      {scholarship.matchReason ? (
        <div className="px-6 py-2">
          <div className="rounded-lg bg-indigo-50 px-3 py-2 text-xs italic text-indigo-700">
            ✨ {scholarship.matchReason}
          </div>
        </div>
      ) : null}

      {(requires.essay || requires.recommendation || requires.resume || requires.transcript) && (
        <div className="border-t border-slate-100 px-6 py-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">Requirements:</p>
          <div className="space-y-1 text-sm text-slate-600">
            {requires.essay && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Essay {scholarship.essayWordCount ? `(${scholarship.essayWordCount}w)` : ''}
                </div>
                {minGpa !== null && userProfile.gpa !== null ? (
                  <div
                    className={`text-xs ${
                      gpaEligible ? 'text-green-600' : 'text-slate-400'
                    }`}
                  >
                    GPA {minGpa}+ {gpaEligible ? '✓' : '☐'}
                  </div>
                ) : null}
              </div>
            )}
            {requires.recommendation && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">☐</span>
                Recommendation letter
              </div>
            )}
            {requires.transcript && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">☐</span>
                Transcript
              </div>
            )}
            {requires.resume && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">☐</span>
                Resume
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-6 pb-4">
        <p className="text-sm text-slate-600 max-h-[4.5rem] overflow-hidden">
          {description || 'No description available.'}
        </p>
        {showMore ? (
          <button
            type="button"
            onClick={onMoreInfo}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Show more
          </button>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <Button
          variant="outline"
          className="border-red-200 text-red-500 hover:bg-red-50"
          onClick={() => animateOff('left')}
          aria-label="Pass scholarship"
        >
          <X className="h-4 w-4" /> Pass
        </Button>
        <Button
          variant="outline"
          className="border-slate-200 text-slate-600 hover:bg-slate-50"
          onClick={onMoreInfo}
          aria-label="More info"
        >
          ℹ More Info
        </Button>
        <Button onClick={() => animateOff('right')} aria-label="Add to cart">
          ✅ Add to Cart
        </Button>
      </div>
    </motion.div>
  );
}
