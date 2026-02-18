'use client';

import { useFormContext } from 'react-hook-form';
import { usStates } from '@/lib/onboarding/usStates';
import type { ManualOnboardingForm } from '@/lib/onboarding/schemas';

export function PersonalInfoForm() {
  const {
    register,
    formState: { errors }
  } = useFormContext<ManualOnboardingForm>();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          First Name *
          <input
            {...register('personal.firstName')}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            placeholder="First name"
          />
          {errors.personal?.firstName ? (
            <p className="text-xs text-red-600">{errors.personal.firstName.message}</p>
          ) : null}
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Last Name *
          <input
            {...register('personal.lastName')}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            placeholder="Last name"
          />
          {errors.personal?.lastName ? (
            <p className="text-xs text-red-600">{errors.personal.lastName.message}</p>
          ) : null}
        </label>
      </div>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Email *
        <input
          {...register('personal.email')}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          placeholder="you@email.com"
        />
        {errors.personal?.email ? (
          <p className="text-xs text-red-600">{errors.personal.email.message}</p>
        ) : null}
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Phone
        <input
          {...register('personal.phone')}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          placeholder="(555) 555-5555"
        />
      </label>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Street Address *
        <input
          {...register('personal.streetAddress')}
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          placeholder="123 Main St"
        />
        {errors.personal?.streetAddress ? (
          <p className="text-xs text-red-600">{errors.personal.streetAddress.message}</p>
        ) : null}
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          City *
          <input
            {...register('personal.city')}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            placeholder="City"
          />
          {errors.personal?.city ? (
            <p className="text-xs text-red-600">{errors.personal.city.message}</p>
          ) : null}
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          State *
          <select
            {...register('personal.state')}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          >
            <option value="">Select state</option>
            {usStates.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
          {errors.personal?.state ? (
            <p className="text-xs text-red-600">{errors.personal.state.message}</p>
          ) : null}
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          ZIP
          <input
            {...register('personal.zip')}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            placeholder="94102"
          />
        </label>
      </div>
    </div>
  );
}
