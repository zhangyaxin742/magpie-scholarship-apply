'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PreferencesData } from '@/lib/onboarding/types';

const ethnicityOptions = [
  'Hispanic or Latino',
  'White',
  'Black or African American',
  'Asian',
  'Native American',
  'Pacific Islander',
  'Other',
  'Prefer not to say'
];

export function PreferencesClient() {
  const router = useRouter();
  const firstGenOptions: Array<{ label: string; value: PreferencesData['firstGen'] }> = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
    { label: 'Prefer not to say', value: undefined }
  ];
  const incomeOptions: Array<{ label: string; value: PreferencesData['incomeRange'] }> = [
    { value: 'under_30k', label: 'Under $30K' },
    { value: '30k_60k', label: '$30K - $60K' },
    { value: '60k_100k', label: '$60K - $100K' },
    { value: 'over_100k', label: 'Over $100K' },
    { value: undefined, label: 'Prefer not to say' }
  ];
  const [form, setForm] = useState<PreferencesData>({
    firstGen: undefined,
    incomeRange: undefined,
    ethnicity: [],
    gender: undefined
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEthnicity = (value: string) => {
    setForm((prev) => {
      const current = prev.ethnicity ?? [];
      return {
        ...prev,
        ethnicity: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value]
      };
    });
  };

  const submit = async (skip?: boolean) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: skip ? {} : form,
          markOnboardingComplete: true
        })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? 'Failed to save preferences');
      }

      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save preferences';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Optional</p>
          <h1 className="text-4xl font-black text-slate-900">Help us find the best scholarships</h1>
          <p className="text-lg text-slate-600">This info is optional and helps us match you better.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">First-generation college student?</p>
              <div className="flex flex-wrap gap-3">
                {firstGenOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, firstGen: option.value }))}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                      form.firstGen === option.value
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Household income range (optional)</p>
              <div className="grid gap-3 md:grid-cols-2">
                {incomeOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, incomeRange: option.value }))}
                    className={`rounded-xl border px-4 py-3 text-left text-xs font-semibold ${
                      form.incomeRange === option.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Ethnicity (select all that apply)</p>
              <div className="grid gap-3 md:grid-cols-2">
                {ethnicityOptions.map((option) => (
                  <label key={option} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.ethnicity?.includes(option) ?? false}
                      onChange={() => toggleEthnicity(option)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Gender (optional)</p>
              <div className="flex flex-wrap gap-3">
                {['male', 'female', 'non_binary', 'prefer_not_to_say', 'other'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, gender: value as PreferencesData['gender'] }))}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                      form.gender === value
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {value === 'prefer_not_to_say'
                      ? 'Prefer not to say'
                      : value === 'other'
                        ? 'Other'
                        : value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={saving}
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => submit()}
              disabled={saving}
              className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
