import type { ParseResult, ParsedOnboardingData } from './types';
import { parseActivities } from './parseActivities';
import { parseEssays } from './parseEssays';
import { parseProfile } from './parseProfile';
import { normalizeWhitespace, stripFooters } from './utils';

const isFilled = (value: string | number | null): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return !Number.isNaN(value);
  return value.trim().length > 0;
};

const collectErrors = (data: ParsedOnboardingData): string[] => {
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

  return errors;
};

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

export function parseCommonApp(rawText: string): ParseResult {
  const cleaned = normalizeWhitespace(stripFooters(rawText || ''));
  const { personal, academic, demographics } = parseProfile(cleaned);
  const activities = parseActivities(cleaned);
  const essays = parseEssays(cleaned);

  const data: ParsedOnboardingData = {
    personal,
    academic,
    demographics,
    activities,
    essays
  };

  const errors = collectErrors(data);

  return {
    success: true,
    confidence: calculateConfidence(data),
    data,
    errors
  };
}
