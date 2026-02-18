import type { ParsedOnboardingData } from '@/lib/parser/types';
import type { OnboardingData } from './types';
import { emptyOnboardingData } from './defaults';

const toStringValue = (value: number | null) => (value === null ? '' : String(value));
const toOptionalNumber = (value?: number | null) => (value === null || value === undefined ? undefined : value);

export function normalizeParsedData(parsed: ParsedOnboardingData): OnboardingData {
  const base = JSON.parse(JSON.stringify(emptyOnboardingData)) as OnboardingData;

  return {
    personal: {
      ...base.personal,
      firstName: parsed.personal.firstName ?? '',
      lastName: parsed.personal.lastName ?? '',
      email: parsed.personal.email ?? '',
      phone: parsed.personal.phone ?? '',
      streetAddress: parsed.personal.streetAddress ?? '',
      city: parsed.personal.city ?? '',
      state: parsed.personal.state ?? '',
      zip: parsed.personal.zip ?? ''
    },
    academic: {
      ...base.academic,
      highSchool: parsed.academic.highSchool ?? '',
      graduationYear: parsed.academic.graduationYear ?? base.academic.graduationYear,
      gpa: toStringValue(parsed.academic.gpa),
      weightedGpa: toStringValue(parsed.academic.weightedGpa),
      satScore: toStringValue(parsed.academic.satScore),
      actScore: toStringValue(parsed.academic.actScore),
      classRank: parsed.academic.classRank ?? ''
    },
    activities: parsed.activities.map((activity) => ({
      title: activity.title,
      position: activity.position ?? '',
      descriptionShort: activity.descriptionShort ?? '',
      descriptionMedium: activity.descriptionMedium ?? '',
      descriptionLong: activity.descriptionLong ?? '',
      hoursPerWeek: toOptionalNumber(activity.hoursPerWeek),
      weeksPerYear: toOptionalNumber(activity.weeksPerYear),
      grades: activity.grades ?? []
    })),
    essays: parsed.essays.map((essay) => ({
      topic: essay.topic,
      text: essay.text,
      title: essay.title ?? '',
      tags: essay.tags?.length ? essay.tags : undefined,
      wordCount: essay.wordCount
    }))
  };
}
