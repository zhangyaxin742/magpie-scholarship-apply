export type LocationFilter = 'all' | 'local' | 'state' | 'national';
export type AmountFilter = 'any' | '1k' | '5k' | '10k';
export type DeadlineFilter = 'any' | 'month' | 'quarter';
export type CompetitionFilter = 'any' | 'low' | 'medium' | 'high';
export type RequiresEssayFilter = 'any' | 'yes' | 'no';

export interface SearchFilters {
  location: LocationFilter;
  amount: AmountFilter;
  deadline: DeadlineFilter;
  competition: CompetitionFilter;
  requiresEssay: RequiresEssayFilter;
}

export const defaultSearchFilters: SearchFilters = {
  location: 'all',
  amount: 'any',
  deadline: 'any',
  competition: 'any',
  requiresEssay: 'any'
};

export interface ScholarshipResult {
  id: string;
  name: string;
  organization: string | null;
  amount: number | null;
  deadline: string;
  applicationUrl: string;
  shortDescription: string | null;
  fullDescription: string | null;
  competitionLevel: 'local' | 'regional' | 'state' | 'national' | null;
  estimatedApplicants: number | null;
  requiresEssay: boolean;
  requiresRecommendation: boolean;
  requiresTranscript: boolean;
  requiresResume: boolean;
  essayWordCount: number | null;
  essayPrompts: string[] | null;
  isNational: boolean;
  isLocal: boolean;
  daysUntilDeadline: number;
  matchReason: string | null;
  minGpa: string | null;
}

export interface ScholarshipSearchResponse {
  scholarships: ScholarshipResult[];
  nextCursor: string | null;
  totalCount: number;
  aiRanked: boolean;
}

export interface UserProfileSummary {
  city: string | null;
  state: string | null;
  gpa: number | null;
  graduationYear: number | null;
  gender: string | null;
  ethnicity: string[] | null;
  firstGeneration: boolean | null;
  agiRange: string | null;
}
