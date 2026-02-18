'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ManualOnboardingForm } from '@/lib/onboarding/schemas';
import { manualOnboardingSchema } from '@/lib/onboarding/schemas';
import { emptyOnboardingData } from '@/lib/onboarding/defaults';
import { clearManualDraft, loadManualDraft, saveManualDraft } from '@/lib/onboarding/storage';
import { AcademicInfoForm } from './AcademicInfoForm';
import { ActivityForm } from './ActivityForm';
import { EssayForm } from './EssayForm';
import { PersonalInfoForm } from './PersonalInfoForm';
import { ProgressBar } from './ProgressBar';

const personalFields = [
  'personal.firstName',
  'personal.lastName',
  'personal.email',
  'personal.address',
  'personal.city',
  'personal.state'
] as const;

const academicFields = [
  'academic.highSchool',
  'academic.graduationYear',
  'academic.gpa',
  'academic.weightedGpa',
  'academic.sat',
  'academic.act',
  'academic.classRank'
] as const;

const steps = [
  {
    title: 'Personal information',
    description: 'Tell us the basics we should use on every scholarship.',
    content: <PersonalInfoForm />,
    fields: personalFields
  },
  {
    title: 'Academic information',
    description: 'Share your academics so we can match you fast.',
    content: <AcademicInfoForm />,
    fields: academicFields
  },
  {
    title: 'Activities (optional)',
    description: 'Add clubs, leadership, or volunteer work.',
    content: <ActivityForm />,
    fields: ['activities'] as const
  },
  {
    title: 'Essays (optional)',
    description: 'Paste essays you want to reuse.',
    content: <EssayForm />,
    fields: ['essays'] as const
  },
  {
    title: 'Review',
    description: 'Confirm everything before we save your profile.',
    content: null,
    fields: [] as const
  }
];

export function ManualOnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<ManualOnboardingForm>({
    resolver: zodResolver(manualOnboardingSchema),
    defaultValues: emptyOnboardingData,
    mode: 'onBlur'
  });

  const { handleSubmit, reset, trigger, watch } = methods;
  const watchedValues = watch();

  useEffect(() => {
    const draft = loadManualDraft();
    if (draft) {
      reset(draft);
    }
  }, [reset]);

  useEffect(() => {
    saveManualDraft(watchedValues);
  }, [watchedValues]);

  const reviewSummary = useMemo(() => watchedValues, [watchedValues]);

  const handleNext = async () => {
    const fields = steps[step]?.fields ?? [];
    const valid = fields.length ? await trigger(fields as never) : true;
    if (!valid) return;
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (values: ManualOnboardingForm) => {
    setSubmitting(true);
    setSubmitError(null);

    const essays = values.essays.map((essay) => ({
      ...essay,
      wordCount: essay.text.trim() ? essay.text.trim().split(/\s+/).length : 0
    }));

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal: values.personal,
          academic: values.academic,
          activities: values.activities,
          essays,
          markOnboardingComplete: false
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Failed to save profile');
      }

      clearManualDraft();
      router.push('/onboarding/preferences');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isReviewStep = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Manual onboarding</p>
          <h1 className="text-4xl font-black text-slate-900 md:text-5xl">Build your profile in minutes</h1>
          <p className="text-lg text-slate-600">We&apos;ll guide you step-by-step. You can always edit later.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <ProgressBar current={step + 1} total={steps.length} />

          <div className="mt-6 space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">{steps[step]?.title}</h2>
            <p className="text-sm text-slate-600">{steps[step]?.description}</p>
          </div>

          <FormProvider {...methods}>
            <form
              className="mt-6 space-y-6"
              onSubmit={handleSubmit(onSubmit)}
            >
              {isReviewStep ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Personal</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {reviewSummary.personal.firstName} {reviewSummary.personal.lastName} · {reviewSummary.personal.email}
                    </p>
                    <p className="text-sm text-slate-600">
                      {reviewSummary.personal.city}, {reviewSummary.personal.state}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Academic</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {reviewSummary.academic.highSchool} · Class of {reviewSummary.academic.graduationYear}
                    </p>
                    <p className="text-sm text-slate-600">
                      GPA: {reviewSummary.academic.gpa || '—'} · SAT: {reviewSummary.academic.sat || '—'} · ACT:{' '}
                      {reviewSummary.academic.act || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Activities</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {reviewSummary.activities.length ? `${reviewSummary.activities.length} activities added` : 'No activities added'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Essays</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {reviewSummary.essays.length ? `${reviewSummary.essays.length} essays saved` : 'No essays added'}
                    </p>
                  </div>
                </div>
              ) : (
                steps[step]?.content
              )}

              {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 0 || submitting}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ← Back
                </button>

                {isReviewStep ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {submitting ? 'Saving…' : 'Submit & Continue'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Next →
                  </button>
                )}
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}
