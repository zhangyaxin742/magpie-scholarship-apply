import { anthropic } from '@/lib/parseWithHaiku';

import type { ExtractionResult, FetchedPage, ScholarshipExtracted } from './types';

const MODEL = 'claude-3-haiku-20240307';

const extractJson = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const withoutFences = trimmed.startsWith('```')
    ? trimmed.replace(/```(?:json)?/g, '').trim()
    : trimmed;
  const firstBrace = withoutFences.indexOf('{');
  const lastBrace = withoutFences.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  return withoutFences.slice(firstBrace, lastBrace + 1);
};

const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const asNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const asBoolean = (value: unknown): boolean => value === true;

const asStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
};

const parseDeadline = (value: unknown): string | null => {
  const text = asString(value);
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const normalizeShortDescription = (value: unknown): string | null => {
  const text = asString(value);
  if (!text) return null;
  return text.length > 200 ? text.slice(0, 200).trim() : text;
};

const parseCompetitionLevel = (
  value: unknown
): 'local' | 'regional' | 'state' | 'national' | null => {
  const text = asString(value);
  if (!text) return null;
  if (text === 'local' || text === 'regional' || text === 'state' || text === 'national') {
    return text;
  }
  return null;
};

const buildExtractionResult = (
  sourceUrl: string,
  extractedData: ScholarshipExtracted | null,
  confidence: number,
  needsReview: boolean
): ExtractionResult => ({
  sourceUrl,
  extractedData,
  confidence,
  model: MODEL,
  needsReview
});

export async function extractScholarshipData(page: FetchedPage): Promise<ExtractionResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[pipeline] ANTHROPIC_API_KEY is not configured');
    return buildExtractionResult(page.url, null, 0, true);
  }

  const systemPrompt = `You are a scholarship data extraction assistant. 
You will be given raw text scraped from a scholarship webpage. 
Your job is to extract structured information and return it as valid JSON.

STRICT RULES:
1. Only extract information that is explicitly present in the provided text.
2. Never infer, guess, or complete missing fields — use null for anything not stated.
3. Deadlines: only include if a specific date is stated. If the date is within 
   24 hours of now (${new Date().toISOString()}), set deadline to null.
4. application_url: use the source URL provided if no other application URL 
   is explicitly mentioned in the text.
5. amount: integer in dollars only. If a range is given, use the minimum. Null if not stated.
6. Confidence: assess your own confidence (0.0–1.0) based on how much data 
   was clearly present. If name, deadline, or application_url are missing: 
   confidence must be below 0.5.
7. Return ONLY valid JSON. No markdown, no explanation, no code fences.`;

  const userPrompt = `Source URL: ${page.url}

Raw page text:
${page.rawText}

Extract scholarship information and return this exact JSON structure:
{
  "name": string,
  "organization": string | null,
  "amount": number | null,
  "deadline": "YYYY-MM-DD" | null,
  "applicationUrl": string,
  "shortDescription": string (max 200 chars) | null,
  "fullDescription": string | null,
  "minGpa": number | null,
  "maxGpa": number | null,
  "isNational": boolean,
  "states": string[] | null,
  "cities": string[] | null,
  "counties": string[] | null,
  "highSchools": string[] | null,
  "requiredDemographics": string[] | null,
  "requiredMajor": string[] | null,
  "agiMax": number | null,
  "requiresEssay": boolean,
  "essayPrompts": string[] | null,
  "essayWordCount": number | null,
  "requiresRecommendation": boolean,
  "requiresTranscript": boolean,
  "requiredAthletics": string[] | null,
  "requiredEcCategories": string[] | null,
  "requiresResume": boolean,
  "competitionLevel": "local" | "regional" | "state" | "national" | null,
  "estimatedApplicants": number | null,
  "confidence": number
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return buildExtractionResult(page.url, null, 0, true);
    }

    const jsonText = extractJson(textBlock.text);
    if (!jsonText) {
      return buildExtractionResult(page.url, null, 0, true);
    }

    let parsed: Record<string, unknown> | null = null;
    try {
      const payload = JSON.parse(jsonText) as unknown;
      if (payload && typeof payload === 'object') {
        parsed = payload as Record<string, unknown>;
      }
    } catch (error) {
      console.error('[pipeline] Failed to parse Haiku JSON', error);
      return buildExtractionResult(page.url, null, 0, true);
    }

    if (!parsed) {
      return buildExtractionResult(page.url, null, 0, true);
    }

    const confidence = asNumber(parsed.confidence) ?? 0;
    const nameValue = asString(parsed.name);
    const organization = asString(parsed.organization);
    const amount = asNumber(parsed.amount);
    const deadline = parseDeadline(parsed.deadline);
    const applicationUrlValue = asString(parsed.applicationUrl);
    const applicationUrl = applicationUrlValue ?? page.url;
    const shortDescription = normalizeShortDescription(parsed.shortDescription);
    const fullDescription = asString(parsed.fullDescription);
    const minGpa = asNumber(parsed.minGpa);
    const maxGpa = asNumber(parsed.maxGpa);
    const isNational = asBoolean(parsed.isNational);
    const states = asStringArray(parsed.states);
    const cities = asStringArray(parsed.cities);
    const counties = asStringArray(parsed.counties);
    const highSchools = asStringArray(parsed.highSchools);
    const requiredDemographics = asStringArray(parsed.requiredDemographics);
    const requiredMajor = asStringArray(parsed.requiredMajor);
    const agiMax = asNumber(parsed.agiMax);
    const requiresEssay = asBoolean(parsed.requiresEssay);
    const essayPrompts = asStringArray(parsed.essayPrompts);
    const essayWordCount = asNumber(parsed.essayWordCount);
    const requiresRecommendation = asBoolean(parsed.requiresRecommendation);
    const requiresTranscript = asBoolean(parsed.requiresTranscript);
    const requiredAthletics = asStringArray(parsed.requiredAthletics);
    const requiredEcCategories = asStringArray(parsed.requiredEcCategories);
    const requiresResume = asBoolean(parsed.requiresResume);
    const competitionLevel = parseCompetitionLevel(parsed.competitionLevel);
    const estimatedApplicants = asNumber(parsed.estimatedApplicants);

    const extracted: ScholarshipExtracted = {
      name: nameValue ?? '',
      organization,
      amount,
      deadline,
      applicationUrl,
      shortDescription,
      fullDescription,
      minGpa,
      maxGpa,
      isNational,
      states,
      cities,
      counties,
      highSchools,
      requiredDemographics,
      requiredMajor,
      agiMax,
      requiresEssay,
      essayPrompts,
      essayWordCount,
      requiresRecommendation,
      requiresTranscript,
      requiredAthletics,
      requiredEcCategories,
      requiresResume,
      competitionLevel,
      estimatedApplicants
    };

    if (deadline) {
      const deadlineMs = new Date(deadline).getTime();
      const minAllowedMs = Date.now() + 24 * 60 * 60 * 1000;
      if (deadlineMs < minAllowedMs) {
        return buildExtractionResult(page.url, null, 0, false);
      }
    }

    const needsReview =
      confidence < 0.7 ||
      !nameValue ||
      !deadline ||
      !applicationUrlValue;

    return buildExtractionResult(page.url, extracted, confidence, needsReview);
  } catch (error) {
    console.error('[pipeline] Haiku extraction failed', error);
    return buildExtractionResult(page.url, null, 0, true);
  }
}
