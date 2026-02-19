import type { EssayTopic, ParsedOnboardingData } from '@/lib/onboarding/types';
import { truncateAtWord } from '@/lib/utils/text';

export const essayTopics: EssayTopic[] = [
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

export interface HaikuCommonAppPayload {
  personal?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    street_address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
  academic?: {
    high_school?: string | null;
    graduation_year?: number | string | null;
    gpa?: number | string | null;
    weighted_gpa?: number | string | null;
    sat_score?: number | string | null;
    act_score?: number | string | null;
    class_rank?: string | null;
  };
  demographics?: {
    gender?: string | null;
    ethnicity?: string[] | string | null;
    first_generation?: boolean | string | null;
    agi_range?: string | null;
  };
  activities?: Array<{
    title?: string | null;
    position?: string | null;
    description_short?: string | null;
    description_medium?: string | null;
    description_long?: string | null;
    description?: string | null;
    hours_per_week?: number | string | null;
    weeks_per_year?: number | string | null;
    grades?: Array<number | string> | string | null;
  }>;
  essays?: Array<{
    topic?: string | null;
    title?: string | null;
    text?: string | null;
    tags?: string[] | string | null;
    word_count?: number | string | null;
  }>;
}

export interface NormalizedHaikuResult {
  data: ParsedOnboardingData;
  errors: string[];
}

const nullTokens = new Set([
  '',
  'n/a',
  'na',
  'none',
  'null',
  'unknown',
  'unspecified',
  'not provided',
  'not applicable'
]);

const toCleanString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') {
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (nullTokens.has(trimmed.toLowerCase())) return null;
  return trimmed;
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/,/g, '');
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNumberInRange = (value: unknown, min: number, max: number): number | null => {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
};

const toIntegerInRange = (value: unknown, min: number, max: number): number | null => {
  const parsed = toNumber(value);
  if (parsed === null) return null;
  const rounded = Math.round(parsed);
  if (rounded < min || rounded > max) return null;
  return rounded;
};

const toBoolean = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1 ? true : value === 0 ? false : null;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['yes', 'true', 'y'].includes(normalized)) return true;
  if (['no', 'false', 'n'].includes(normalized)) return false;
  return null;
};

const toStringArray = (value: unknown): string[] | null => {
  if (value === null || value === undefined) return null;
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[;,]/g)
      : [];
  const cleaned = items
    .map((item) => toCleanString(item))
    .filter((item): item is string => Boolean(item));
  return cleaned.length ? cleaned : null;
};

const toEssayTopic = (value: unknown): EssayTopic => {
  const raw = toCleanString(value);
  if (!raw) return 'other';
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z\s_]/g, '')
    .replace(/\s+/g, '_')
    .trim();
  return (essayTopics.includes(normalized as EssayTopic) ? normalized : 'other') as EssayTopic;
};

const toAgiRange = (value: unknown): string | null => {
  const raw = toCleanString(value);
  if (!raw) return null;
  const normalized = raw.toLowerCase();
  const allowed = new Set(['under_30k', '30k_60k', '60k_100k', 'over_100k']);
  return allowed.has(normalized) ? normalized : null;
};

const normalizeState = (value: unknown): string | null => {
  const raw = toCleanString(value);
  if (!raw) return null;
  const trimmed = raw.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (trimmed.length === 2) return trimmed;
  return null;
};

const toGrades = (value: unknown): number[] => {
  const items = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[;,]/g)
      : [];
  const grades = items
    .map((item) => toIntegerInRange(item, 9, 12))
    .filter((item): item is number => item !== null);
  return Array.from(new Set(grades));
};

const pickLongest = (...values: Array<string | null | undefined>): string | null => {
  const cleaned = values
    .map((value) => toCleanString(value))
    .filter((value): value is string => Boolean(value));
  if (!cleaned.length) return null;
  return cleaned.reduce((longest, current) => (current.length > longest.length ? current : longest));
};

const isFilled = (value: string | number | null): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return !Number.isNaN(value);
  return value.trim().length > 0;
};

export function normalizeHaikuPayload(raw: HaikuCommonAppPayload): NormalizedHaikuResult {
  const personalSource = raw.personal ?? {};
  const academicSource = raw.academic ?? {};
  const demographicsSource = raw.demographics ?? {};
  const activitiesSource = Array.isArray(raw.activities) ? raw.activities : [];
  const essaysSource = Array.isArray(raw.essays) ? raw.essays : [];

  const personal = {
    firstName: toCleanString(personalSource.first_name),
    lastName: toCleanString(personalSource.last_name),
    email: toCleanString(personalSource.email),
    phone: toCleanString(personalSource.phone),
    streetAddress: toCleanString(personalSource.street_address),
    city: toCleanString(personalSource.city),
    state: normalizeState(personalSource.state),
    zip: toCleanString(personalSource.zip)
  };

  const academic = {
    highSchool: toCleanString(academicSource.high_school),
    graduationYear: toIntegerInRange(academicSource.graduation_year, 2020, 2035),
    gpa: toNumberInRange(academicSource.gpa, 0, 5),
    weightedGpa: toNumberInRange(academicSource.weighted_gpa, 0, 5),
    satScore: toIntegerInRange(academicSource.sat_score, 400, 1600),
    actScore: toIntegerInRange(academicSource.act_score, 1, 36),
    classRank: toCleanString(academicSource.class_rank)
  };

  const demographics = {
    gender: toCleanString(demographicsSource.gender),
    ethnicity: toStringArray(demographicsSource.ethnicity),
    firstGeneration: toBoolean(demographicsSource.first_generation),
    agiRange: toAgiRange(demographicsSource.agi_range)
  };

  const activities = activitiesSource
    .map((activity) => {
      const title = toCleanString(activity.title);
      if (!title) return null;
      const descriptionLong = pickLongest(
        activity.description_long,
        activity.description_medium,
        activity.description_short,
        activity.description
      );
      const trimmedLong = descriptionLong ? truncateAtWord(descriptionLong, 500) : null;
      const trimmedMedium = trimmedLong ? truncateAtWord(trimmedLong, 150) : null;
      const trimmedShort = trimmedLong ? truncateAtWord(trimmedLong, 50) : null;

      return {
        title,
        position: toCleanString(activity.position),
        descriptionShort: trimmedShort,
        descriptionMedium: trimmedMedium,
        descriptionLong: trimmedLong,
        hoursPerWeek: toIntegerInRange(activity.hours_per_week, 0, 168),
        weeksPerYear: toIntegerInRange(activity.weeks_per_year, 0, 52),
        grades: toGrades(activity.grades)
      };
    })
    .filter((activity): activity is NonNullable<typeof activity> => Boolean(activity))
    .slice(0, 10);

  const essays = essaysSource
    .map((essay) => {
      const text = toCleanString(essay.text);
      if (!text) return null;
      const wordCount =
        toIntegerInRange(essay.word_count, 1, 10000) ?? text.trim().split(/\s+/).length;
      const tags = toStringArray(essay.tags) ?? [];
      return {
        topic: toEssayTopic(essay.topic),
        title: toCleanString(essay.title),
        text,
        wordCount,
        tags
      };
    })
    .filter((essay): essay is NonNullable<typeof essay> => Boolean(essay))
    .slice(0, 5);

  const data: ParsedOnboardingData = {
    personal,
    academic,
    demographics,
    activities,
    essays
  };

  const errors: string[] = [];
  const personalChecks: Array<[keyof ParsedOnboardingData['personal'], string]> = [
    ['firstName', 'personal.firstName'],
    ['lastName', 'personal.lastName'],
    ['email', 'personal.email'],
    ['phone', 'personal.phone'],
    ['streetAddress', 'personal.streetAddress'],
    ['city', 'personal.city'],
    ['state', 'personal.state'],
    ['zip', 'personal.zip']
  ];
  personalChecks.forEach(([key, label]) => {
    if (!isFilled(data.personal[key])) errors.push(label);
  });

  const academicChecks: Array<[keyof ParsedOnboardingData['academic'], string]> = [
    ['highSchool', 'academic.highSchool'],
    ['graduationYear', 'academic.graduationYear'],
    ['gpa', 'academic.gpa'],
    ['weightedGpa', 'academic.weightedGpa'],
    ['satScore', 'academic.satScore'],
    ['actScore', 'academic.actScore'],
    ['classRank', 'academic.classRank']
  ];
  academicChecks.forEach(([key, label]) => {
    if (!isFilled(data.academic[key])) errors.push(label);
  });

  if (data.activities.length === 0) errors.push('activities');
  if (data.essays.length === 0) errors.push('essays');

  return { data, errors };
}

export function calculateConfidence(data: ParsedOnboardingData): number {
  const signals: boolean[] = [
    isFilled(data.personal.firstName),
    isFilled(data.personal.lastName),
    isFilled(data.personal.email),
    isFilled(data.personal.phone),
    isFilled(data.personal.streetAddress),
    isFilled(data.personal.city),
    isFilled(data.personal.state),
    isFilled(data.personal.zip),
    isFilled(data.academic.highSchool),
    isFilled(data.academic.graduationYear),
    isFilled(data.academic.gpa),
    isFilled(data.academic.weightedGpa),
    isFilled(data.academic.satScore),
    isFilled(data.academic.actScore),
    isFilled(data.academic.classRank),
    data.activities.length > 0,
    data.essays.length > 0
  ];

  const found = signals.filter(Boolean).length;
  return Number((found / signals.length).toFixed(2));
}
