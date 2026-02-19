export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  streetAddress: string;
  city: string;
  state: string;
  zip?: string;
}

export interface AcademicInfo {
  highSchool: string;
  graduationYear: number;
  gpa?: string;
  weightedGpa?: string;
  satScore?: string;
  actScore?: string;
  classRank?: string;
}

export interface Activity {
  title: string;
  position?: string;
  descriptionShort?: string;
  descriptionMedium?: string;
  descriptionLong?: string;
  hoursPerWeek?: number;
  weeksPerYear?: number;
  grades?: number[];
}

export type EssayTopic =
  | 'personal_statement'
  | 'leadership'
  | 'challenge'
  | 'community_service'
  | 'diversity'
  | 'career_goals'
  | 'academic_interest'
  | 'extracurricular'
  | 'work_experience'
  | 'other';

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
  gender: string | null;
  ethnicity: string[] | null;
  firstGeneration: boolean | null;
  agiRange: string | null;
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

export interface Essay {
  topic: EssayTopic;
  text: string;
  title?: string;
  tags?: string[];
  wordCount: number;
}

export interface OnboardingData {
  personal: PersonalInfo;
  academic: AcademicInfo;
  activities: Activity[];
  essays: Essay[];
}

export interface ParsedOnboardingPayload {
  data: ParsedOnboardingData;
  confidence: number;
  errors: string[];
}

export interface PreferencesData {
  firstGen?: boolean;
  incomeRange?: 'under_30k' | '30k_60k' | '60k_100k' | 'over_100k';
  ethnicity?: string[];
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';
  genderSelfDescribe?: string;
}
