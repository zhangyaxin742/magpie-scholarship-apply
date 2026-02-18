export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
}

export interface AcademicInfo {
  highSchool: string;
  graduationYear: number;
  gpa?: string;
  weightedGpa?: string;
  sat?: string;
  act?: string;
  classRank?: string;
}

export interface Activity {
  title: string;
  position?: string;
  description?: string;
  hoursPerWeek?: number;
  weeksPerYear?: number;
  grades?: number[];
}

export interface Essay {
  topic: string;
  text: string;
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
  firstGen?: 'yes' | 'no' | 'prefer_not';
  incomeRange?: 'under_30k' | '30_60k' | '60_100k' | 'over_100k' | 'prefer_not';
  ethnicity?: string[];
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not' | 'self_describe';
  genderOther?: string;
}
