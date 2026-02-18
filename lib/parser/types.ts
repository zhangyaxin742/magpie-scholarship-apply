import type { EssayTopic } from '@/lib/onboarding/types';

export type GenderIdentity = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';

export interface ParsedPersonalInfo {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export interface ParsedAcademicInfo {
  highSchool: string | null;
  graduationYear: number | null;
  gpa: number | null;
  weightedGpa: number | null;
  satScore: number | null;
  actScore: number | null;
  classRank: string | null;
}

export interface ParsedDemographics {
  gender: GenderIdentity | null;
  firstGeneration: boolean | null;
}

export interface ParsedActivity {
  title: string;
  position: string | null;
  descriptionShort: string | null;
  descriptionMedium: string | null;
  descriptionLong: string | null;
  hoursPerWeek: number | null;
  weeksPerYear: number | null;
  grades: number[];
}

export interface ParsedEssay {
  topic: EssayTopic;
  title: string | null;
  text: string;
  wordCount: number;
  tags: string[];
}

export interface ParsedOnboardingData {
  personal: ParsedPersonalInfo;
  academic: ParsedAcademicInfo;
  demographics: ParsedDemographics;
  activities: ParsedActivity[];
  essays: ParsedEssay[];
}

export interface ParseResult {
  success: boolean;
  confidence: number;
  data: ParsedOnboardingData;
  errors: string[];
}
