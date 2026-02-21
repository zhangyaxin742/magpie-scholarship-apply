export interface PipelineProfile {
  city: string | null;
  state: string | null;
  gpa: number | null;
  graduationYear: number | null;
  ethnicity: string[] | null;
  gender: string | null;
  firstGeneration: boolean | null;
  agiRange: string | null;
  intendedMajor: string | null;
  athletics: string[] | null;
  ecCategories: string[] | null;
}

export interface DiscoveredUrl {
  url: string;
  sourceQuery: string;
  groundingMetadata?: string;
}

export interface FetchedPage {
  url: string;
  rawText: string;
  fetchedAt: string;
  httpStatus: number;
}

export interface ExtractionResult {
  sourceUrl: string;
  extractedData: ScholarshipExtracted | null;
  confidence: number;
  model: string;
  needsReview: boolean;
}

export interface ScholarshipExtracted {
  name: string;
  organization: string | null;
  amount: number | null;
  deadline: string | null;
  applicationUrl: string;
  shortDescription: string | null;
  fullDescription: string | null;
  minGpa: number | null;
  maxGpa: number | null;
  isNational: boolean;
  states: string[] | null;
  cities: string[] | null;
  counties: string[] | null;
  highSchools: string[] | null;
  requiredDemographics: string[] | null;
  requiredMajor: string[] | null;
  agiMax: number | null;
  requiresEssay: boolean;
  essayPrompts: string[] | null;
  essayWordCount: number | null;
  requiresRecommendation: boolean;
  requiresTranscript: boolean;
  requiredAthletics: string[] | null;
  requiredEcCategories: string[] | null;
  requiresResume: boolean;
  competitionLevel: 'local' | 'regional' | 'state' | 'national' | null;
  estimatedApplicants: number | null;
}
