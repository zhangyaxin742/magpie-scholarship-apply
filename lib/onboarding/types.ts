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

export interface Essay {
  topic:
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
  data: OnboardingData;
  confidence: number;
  errors?: string[];
}

export interface PreferencesData {
  firstGen?: boolean;
  incomeRange?: 'under_30k' | '30k_60k' | '60k_100k' | 'over_100k';
  ethnicity?: string[];
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | 'other';
}
