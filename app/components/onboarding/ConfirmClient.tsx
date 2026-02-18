'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmationSection } from './ConfirmationSection';
import { clearParsedPayload, loadParsedPayload } from '@/lib/onboarding/storage';
import type { OnboardingData } from '@/lib/onboarding/types';
import { emptyOnboardingData } from '@/lib/onboarding/defaults';

const emptyData = JSON.parse(JSON.stringify(emptyOnboardingData)) as OnboardingData;

export function ConfirmClient() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData>(emptyData);
  const [confidence, setConfidence] = useState(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasPayload, setHasPayload] = useState(true);
  const [editing, setEditing] = useState({
    personal: false,
    academic: false,
    activities: false,
    essays: false
  });

  useEffect(() => {
    const payload = loadParsedPayload();
    if (!payload) {
      setHasPayload(false);
      setLoading(false);
      return;
    }
    const sanitized = {
      ...payload.data,
      activities: payload.data.activities ?? [],
      essays: payload.data.essays ?? []
    };
    setData(sanitized);
    setConfidence(payload.confidence);
    setErrors(payload.errors ?? []);
    setHasPayload(true);
    setLoading(false);
  }, []);

  const updatePersonal = (field: keyof OnboardingData['personal'], value: string) => {
    setData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }));
  };

  const updateAcademic = (field: keyof OnboardingData['academic'], value: string) => {
    setData((prev) => ({
      ...prev,
      academic: {
        ...prev.academic,
        [field]: field === 'graduationYear' ? Number(value) : value
      }
    }));
  };

  const updateActivity = (index: number, field: keyof OnboardingData['activities'][number], value: string) => {
    setData((prev) => {
      const next = [...prev.activities];
      const current = next[index] ?? { title: '', position: '', description: '', hoursPerWeek: 0, weeksPerYear: 0 };
      next[index] = {
        ...current,
        [field]: value
      };
      return { ...prev, activities: next };
    });
  };

  const updateEssay = (index: number, field: keyof OnboardingData['essays'][number], value: string) => {
    setData((prev) => {
      const next = [...prev.essays];
      const current = next[index] ?? { topic: 'personal_statement', text: '', wordCount: 0 };
      next[index] = {
        ...current,
        [field]: field === 'wordCount' ? Number(value) : value
      };
      return { ...prev, essays: next };
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal: data.personal,
          academic: data.academic,
          activities: data.activities,
          essays: data.essays,
          markOnboardingComplete: false
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? 'Failed to save your profile.');
      }

      clearParsedPayload();
      router.push('/onboarding/preferences');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save your profile.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-600">Preparing your profile…</p>
        </div>
      </div>
    );
  }

  if (!hasPayload) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">No parsed data found</h1>
          <p className="mt-2 text-sm text-slate-600">Upload your Common App PDF to continue.</p>
          <button
            type="button"
            onClick={() => router.push('/onboarding')}
            className="mt-6 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white"
          >
            Back to upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Review</p>
          <h1 className="text-4xl font-black text-slate-900">✅ Review your information</h1>
          <p className="text-sm text-slate-600">We found your info! Please confirm and edit if needed.</p>
        </div>

        {confidence < 0.7 ? (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            <p className="font-semibold">Some fields couldn&apos;t be parsed.</p>
            <p className="mt-1 text-yellow-800">Please review and edit before continuing.</p>
            {errors.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-5">
          <ConfirmationSection
            title="Personal info"
            actionLabel={editing.personal ? 'Save' : 'Edit'}
            onAction={() => setEditing((prev) => ({ ...prev, personal: !prev.personal }))}
          >
            {editing.personal ? (
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={data.personal.firstName}
                  onChange={(event) => updatePersonal('firstName', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="First name"
                />
                <input
                  value={data.personal.lastName}
                  onChange={(event) => updatePersonal('lastName', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Last name"
                />
                <input
                  value={data.personal.email}
                  onChange={(event) => updatePersonal('email', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                  placeholder="Email"
                />
                <input
                  value={data.personal.city}
                  onChange={(event) => updatePersonal('city', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="City"
                />
                <input
                  value={data.personal.state}
                  onChange={(event) => updatePersonal('state', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="State"
                />
              </div>
            ) : (
              <>
                <p className="text-base font-semibold text-slate-900">
                  {data.personal.firstName} {data.personal.lastName}
                </p>
                <p>{data.personal.email}</p>
                <p>
                  {data.personal.city}, {data.personal.state} {data.personal.zip}
                </p>
              </>
            )}
          </ConfirmationSection>

          <ConfirmationSection
            title="Academic info"
            actionLabel={editing.academic ? 'Save' : 'Edit'}
            onAction={() => setEditing((prev) => ({ ...prev, academic: !prev.academic }))}
          >
            {editing.academic ? (
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={data.academic.highSchool}
                  onChange={(event) => updateAcademic('highSchool', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                  placeholder="High school"
                />
                <input
                  value={data.academic.graduationYear}
                  onChange={(event) => updateAcademic('graduationYear', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Graduation year"
                />
                <input
                  value={data.academic.gpa || ''}
                  onChange={(event) => updateAcademic('gpa', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="GPA"
                />
                <input
                  value={data.academic.sat || ''}
                  onChange={(event) => updateAcademic('sat', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="SAT"
                />
                <input
                  value={data.academic.act || ''}
                  onChange={(event) => updateAcademic('act', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="ACT"
                />
              </div>
            ) : (
              <>
                <p className="text-base font-semibold text-slate-900">{data.academic.highSchool}</p>
                <p>Class of {data.academic.graduationYear}</p>
                <p>
                  GPA: {data.academic.gpa || '—'} | SAT: {data.academic.sat || '—'} | ACT: {data.academic.act || '—'}
                </p>
              </>
            )}
          </ConfirmationSection>

          <ConfirmationSection
            title={`Activities (${data.activities.length})`}
            actionLabel={editing.activities ? 'Save' : 'Review'}
            onAction={() => setEditing((prev) => ({ ...prev, activities: !prev.activities }))}
          >
            {editing.activities ? (
              <div className="space-y-4">
                {data.activities.map((activity, index) => (
                  <div key={`${activity.title}-${index}`} className="space-y-2 rounded-xl border border-slate-200 p-4">
                    <input
                      value={activity.title}
                      onChange={(event) => updateActivity(index, 'title', event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Activity title"
                    />
                    <input
                      value={activity.position || ''}
                      onChange={(event) => updateActivity(index, 'position', event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Position"
                    />
                    <textarea
                      value={activity.description || ''}
                      onChange={(event) => updateActivity(index, 'description', event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Description"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {data.activities.length ? (
                  data.activities.map((activity, index) => (
                    <li key={`${activity.title}-${index}`} className="text-sm text-slate-600">
                      ✓ {activity.title}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500">No activities added</li>
                )}
              </ul>
            )}
          </ConfirmationSection>

          <ConfirmationSection
            title={`Essays (${data.essays.length})`}
            actionLabel={editing.essays ? 'Save' : 'View'}
            onAction={() => setEditing((prev) => ({ ...prev, essays: !prev.essays }))}
          >
            {editing.essays ? (
              <div className="space-y-4">
                {data.essays.map((essay, index) => (
                  <div key={`${essay.topic}-${index}`} className="space-y-2 rounded-xl border border-slate-200 p-4">
                    <input
                      value={essay.topic}
                      onChange={(event) => updateEssay(index, 'topic', event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Essay topic"
                    />
                    <textarea
                      value={essay.text}
                      onChange={(event) => updateEssay(index, 'text', event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Essay text"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {data.essays.length ? (
                  data.essays.map((essay, index) => (
                    <li key={`${essay.topic}-${index}`} className="text-sm text-slate-600">
                      ✓ {essay.topic} ({essay.wordCount || essay.text.split(/\s+/).length} words)
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500">No essays added</li>
                )}
              </ul>
            )}
          </ConfirmationSection>
        </div>

        {saveError ? <p className="text-sm font-medium text-red-600">{saveError}</p> : null}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/onboarding')}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600"
          >
            ← Go back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Everything Looks Good ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
