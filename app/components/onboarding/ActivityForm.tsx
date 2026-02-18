'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import type { ManualOnboardingForm } from '@/lib/onboarding/schemas';

const gradeOptions = [9, 10, 11, 12];

export function ActivityForm() {
  const {
    control,
    register,
    formState: { errors }
  } = useFormContext<ManualOnboardingForm>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'activities'
  });

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Activities are optional. Add any clubs, volunteer work, or leadership roles.
        </div>
      ) : null}

      {fields.map((field, index) => {
        const activityErrors = errors.activities?.[index];

        return (
          <div key={field.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Activity {index + 1}</p>
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
                Title *
                <input
                  {...register(`activities.${index}.title`)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  placeholder="Debate Team Captain"
                />
                {activityErrors?.title ? (
                  <p className="text-xs text-red-600">{activityErrors.title.message}</p>
                ) : null}
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                Position
                <input
                  {...register(`activities.${index}.position`)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  placeholder="Captain"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                Description (up to 500 characters)
                <textarea
                  {...register(`activities.${index}.descriptionLong`)}
                  className="h-24 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  placeholder="What you did, impact, awards..."
                  maxLength={500}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Hours per week
                  <input
                    type="number"
                    min={0}
                    max={168}
                    {...register(`activities.${index}.hoursPerWeek`)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    placeholder="4"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Weeks per year
                  <input
                    type="number"
                    min={0}
                    max={52}
                    {...register(`activities.${index}.weeksPerYear`)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    placeholder="32"
                  />
                </label>
              </div>

              <div className="space-y-2 text-sm font-medium text-slate-700">
                Grades
                <div className="flex flex-wrap gap-3">
                  {gradeOptions.map((grade) => (
                    <label key={grade} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        value={grade}
                        {...register(`activities.${index}.grades`)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      />
                      {grade}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() =>
          append({
            title: '',
            position: '',
            descriptionLong: '',
            hoursPerWeek: undefined,
            weeksPerYear: undefined,
            grades: []
          })
        }
        disabled={fields.length >= 10}
        className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Add Another Activity
      </button>
    </div>
  );
}
