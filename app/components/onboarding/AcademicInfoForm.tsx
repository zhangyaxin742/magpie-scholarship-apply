'use client';

import { useFormContext } from 'react-hook-form';
import type { ManualOnboardingForm } from '@/lib/onboarding/schemas';

const graduationYears = Array.from({ length: 12 }, (_, index) => 2024 + index);

export function AcademicInfoForm() {
  const {
    register,
    formState: { errors }
  } = useFormContext<ManualOnboardingForm>();

  return (
    <div className="space-y-4">
      <label className="space-y-2 text-sm font-medium text-slate-700">
        High School *
        <input
          {...register('academic.highSchool')}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          placeholder="Lincoln High School"
        />
        {errors.academic?.highSchool ? (
          <p className="text-xs text-red-600">{errors.academic.highSchool.message}</p>
        ) : null}
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Graduation Year *
        <select
          {...register('academic.graduationYear')}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
        >
          {graduationYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        {errors.academic?.graduationYear ? (
          <p className="text-xs text-red-600">{errors.academic.graduationYear.message}</p>
        ) : null}
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          GPA
          <input
            {...register('academic.gpa')}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            placeholder="3.85"
          />
          {errors.academic?.gpa ? (
            <p className="text-xs text-red-600">{errors.academic.gpa.message}</p>
          ) : null}
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Weighted GPA
          <input
            {...register('academic.weightedGpa')}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            placeholder="4.2"
          />
          {errors.academic?.weightedGpa ? (
            <p className="text-xs text-red-600">{errors.academic.weightedGpa.message}</p>
          ) : null}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          SAT Score
          <input
            {...register('academic.sat')}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            placeholder="1450"
          />
          {errors.academic?.sat ? (
            <p className="text-xs text-red-600">{errors.academic.sat.message}</p>
          ) : null}
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          ACT Score
          <input
            {...register('academic.act')}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            placeholder="32"
          />
          {errors.academic?.act ? (
            <p className="text-xs text-red-600">{errors.academic.act.message}</p>
          ) : null}
        </label>
      </div>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Class Rank
        <input
          {...register('academic.classRank')}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          placeholder="15/350"
        />
      </label>
    </div>
  );
}
