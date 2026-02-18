'use client';

import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { ManualOnboardingForm } from '@/lib/onboarding/schemas';

const essayTopics = [
  'personal_statement',
  'leadership',
  'challenge',
  'community_service',
  'diversity',
  'career_goals',
  'academic_interest',
  'extracurricular',
  'work_experience',
  'other'
];

export function EssayForm() {
  const { control, register } = useFormContext<ManualOnboardingForm>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'essays'
  });

  const essays = useWatch({ control, name: 'essays' });

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Essays are optional. Add any essays you want to reuse.
        </div>
      ) : null}

      {fields.map((field, index) => {
        const text = essays?.[index]?.text ?? '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

        return (
          <div key={field.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Essay {index + 1}</p>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-xs font-semibold text-red-600"
              >
                Remove
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Topic
                <select
                  {...register(`essays.${index}.topic`)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {essayTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                Essay text
                <textarea
                  {...register(`essays.${index}.text`)}
                  className="h-36 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  placeholder="Paste your essay..."
                />
                <p className="text-xs text-slate-500">{wordCount} words</p>
              </label>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => append({ topic: 'personal_statement', text: '', wordCount: 0 })}
        disabled={fields.length >= 5}
        className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Add Another Essay
      </button>
    </div>
  );
}
