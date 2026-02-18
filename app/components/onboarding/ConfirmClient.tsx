'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmationSection } from './ConfirmationSection';
import { useParsedOnboardingStore } from '@/lib/onboarding/parsedStore';
import type { ParsedOnboardingState } from '@/lib/onboarding/parsedStore';
import type { OnboardingData } from '@/lib/onboarding/types';
import { emptyOnboardingData } from '@/lib/onboarding/defaults';
import { normalizeParsedData } from '@/lib/onboarding/normalizeParsed';
import { truncateAtWord } from '@/lib/parser/utils';

const emptyData = JSON.parse(JSON.stringify(emptyOnboardingData)) as OnboardingData;
const essayTopics: OnboardingData['essays'][number]['topic'][] = [
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

export function ConfirmClient() {
  const router = useRouter();
  const payload = useParsedOnboardingStore((state: ParsedOnboardingState) => state.payload);
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
  const [hydrated, setHydrated] = useState(false);
  const [expandedEssays, setExpandedEssays] = useState<number[]>([]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!payload) {
      setHasPayload(false);
      setLoading(false);
      return;
    }
    setData(normalizeParsedData(payload.data));
    setConfidence(payload.confidence);
    setErrors(payload.errors ?? []);
    setHasPayload(true);
    setLoading(false);
  }, [hydrated, payload]);

  const isMissing = (field: string) => errors.includes(field);
  const renderStatus = (missing: boolean) => (
    <span className={`text-xs font-semibold ${missing ? 'text-yellow-600' : 'text-emerald-600'}`}>
      {missing ? '⚠' : '✓'}
    </span>
  );

  const updatePersonal = (field: keyof OnboardingData['personal'], value: string) => {
    setData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }));
  };

  const toggleEssay = (index: number) => {
    setExpandedEssays((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index]
    );
  };

  const renderField = (label: string, value: string | number | undefined, missing: boolean) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value || '—'}</p>
      </div>
      {renderStatus(missing)}
    </div>
  );

  const parseGradesInput = (value: string) =>
    value
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((grade) => grade >= 9 && grade <= 12);

  const updateAcademic = (field: keyof OnboardingData['academic'], value: string) => {
    setData((prev) => ({
      ...prev,
      academic: {
        ...prev.academic,
        [field]: field === 'graduationYear' ? Number(value) : value
      }
    }));
  };

  const updateActivity = (
    index: number,
    field: keyof OnboardingData['activities'][number],
    value: string | number | number[] | undefined
  ) => {
    setData((prev) => {
      const next = [...prev.activities];
      const current = next[index] ?? {
        title: '',
        position: '',
        descriptionLong: '',
        hoursPerWeek: 0,
        weeksPerYear: 0
      };
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
      const essays = data.essays.map((essay) => ({
        ...essay,
        wordCount: essay.text.trim() ? essay.text.trim().split(/\s+/).length : 0
      }));

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personal: data.personal,
          academic: data.academic,
          activities: data.activities,
          essays,
          markOnboardingComplete: false
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? 'Failed to save your profile.');
      }

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
                  value={data.personal.phone || ''}
                  onChange={(event) => updatePersonal('phone', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Phone"
                />
                <input
                  value={data.personal.streetAddress}
                  onChange={(event) => updatePersonal('streetAddress', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                  placeholder="Street address"
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
                <input
                  value={data.personal.zip || ''}
                  onChange={(event) => updatePersonal('zip', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Zip"
                />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {renderField('First name', data.personal.firstName, isMissing('personal.firstName'))}
                {renderField('Last name', data.personal.lastName, isMissing('personal.lastName'))}
                {renderField('Email', data.personal.email, isMissing('personal.email'))}
                {renderField('Phone', data.personal.phone, isMissing('personal.phone'))}
                {renderField('Street address', data.personal.streetAddress, isMissing('personal.streetAddress'))}
                {renderField('City', data.personal.city, isMissing('personal.city'))}
                {renderField('State', data.personal.state, isMissing('personal.state'))}
                {renderField('Zip', data.personal.zip, isMissing('personal.zip'))}
              </div>
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
                  value={data.academic.weightedGpa || ''}
                  onChange={(event) => updateAcademic('weightedGpa', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Weighted GPA"
                />
                <input
                  value={data.academic.satScore || ''}
                  onChange={(event) => updateAcademic('satScore', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="SAT"
                />
                <input
                  value={data.academic.actScore || ''}
                  onChange={(event) => updateAcademic('actScore', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="ACT"
                />
                <input
                  value={data.academic.classRank || ''}
                  onChange={(event) => updateAcademic('classRank', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
                  placeholder="Class rank"
                />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {renderField('High school', data.academic.highSchool, isMissing('academic.highSchool'))}
                {renderField('Graduation year', data.academic.graduationYear, isMissing('academic.graduationYear'))}
                {renderField('GPA', data.academic.gpa, isMissing('academic.gpa'))}
                {renderField('Weighted GPA', data.academic.weightedGpa, isMissing('academic.weightedGpa'))}
                {renderField('SAT score', data.academic.satScore, isMissing('academic.satScore'))}
                {renderField('ACT score', data.academic.actScore, isMissing('academic.actScore'))}
                {renderField('Class rank', data.academic.classRank, isMissing('academic.classRank'))}
              </div>
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
                  <div key={`${activity.title}-${index}`} className="space-y-3 rounded-xl border border-slate-200 p-4">
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
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="number"
                        value={activity.hoursPerWeek ?? ''}
                        onChange={(event) =>
                          updateActivity(
                            index,
                            'hoursPerWeek',
                            event.target.value === '' ? undefined : Number(event.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Hours per week"
                      />
                      <input
                        type="number"
                        value={activity.weeksPerYear ?? ''}
                        onChange={(event) =>
                          updateActivity(
                            index,
                            'weeksPerYear',
                            event.target.value === '' ? undefined : Number(event.target.value)
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Weeks per year"
                      />
                    </div>
                    <input
                      value={activity.grades?.join(', ') || ''}
                      onChange={(event) => updateActivity(index, 'grades', parseGradesInput(event.target.value))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Grades (e.g., 9, 10, 11)"
                    />
                    <textarea
                      value={activity.descriptionLong || ''}
                      onChange={(event) => updateActivity(index, 'descriptionLong', event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Description"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  Parsed activities {renderStatus(isMissing('activities'))}
                </div>
                {data.activities.length ? (
                  <ul className="space-y-3">
                    {data.activities.map((activity, index) => (
                      <li key={`${activity.title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                            {activity.position ? (
                              <p className="text-xs text-slate-500">{activity.position}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                          {activity.hoursPerWeek !== undefined ? (
                            <span className="rounded-full bg-white px-2.5 py-1">
                              {activity.hoursPerWeek} hr/wk
                            </span>
                          ) : null}
                          {activity.weeksPerYear !== undefined ? (
                            <span className="rounded-full bg-white px-2.5 py-1">
                              {activity.weeksPerYear} wk/yr
                            </span>
                          ) : null}
                          {activity.grades?.length
                            ? activity.grades.map((grade) => (
                                <span key={`${activity.title}-${grade}`} className="rounded-full bg-white px-2.5 py-1">
                                  Grade {grade}
                                </span>
                              ))
                            : null}
                        </div>
                        {activity.descriptionLong ? (
                          <p className="mt-3 text-xs text-slate-600">{activity.descriptionLong}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No activities added</p>
                )}
              </div>
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
                    <select
                      value={essay.topic}
                      onChange={(event) => updateEssay(index, 'topic', event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      {essayTopics.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  Parsed essays {renderStatus(isMissing('essays'))}
                </div>
                {data.essays.length ? (
                  <ul className="space-y-3">
                    {data.essays.map((essay, index) => {
                      const wordCount = essay.wordCount || essay.text.trim().split(/\s+/).length;
                      const isExpanded = expandedEssays.includes(index);
                      const preview = truncateAtWord(essay.text.replace(/\s+/g, ' '), 180);
                      const showToggle = essay.text.trim().length > preview.length;
                      return (
                        <li key={`${essay.topic}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                              {essay.topic.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">{wordCount} words</span>
                          </div>
                          <p className="mt-3 text-xs text-slate-600">{isExpanded ? essay.text : preview}</p>
                          {showToggle ? (
                            <button
                              type="button"
                              onClick={() => toggleEssay(index)}
                              className="mt-2 text-xs font-semibold text-blue-600"
                            >
                              {isExpanded ? 'Show less' : 'Show more'}
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No essays added</p>
                )}
              </div>
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
