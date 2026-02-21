import { GoogleGenerativeAI } from '@google/generative-ai';

import { db } from '@/lib/db';
import { scholarships, scholarships_pending } from '@/lib/db/schema';

import type { DiscoveredUrl, PipelineProfile } from './types';

const MAX_RESULTS = 30;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_API_KEY ?? '');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  tools: [{ googleSearchRetrieval: {} }]
});

export const buildQueries = (profile: PipelineProfile): string[] => {
  const queries: string[] = [];
  const now = new Date();
  const minDeadlineStr = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const locationStr = [profile.city, profile.state].filter(Boolean).join(', ');
  const graduationStr = profile.graduationYear ? `class of ${profile.graduationYear}` : '';
  const gpaStr = profile.gpa ? `GPA ${profile.gpa}` : '';

  queries.push(
    `scholarships for high school students in ${locationStr} ${graduationStr} ${gpaStr} deadline after ${minDeadlineStr}`.trim(),
    `local community foundation scholarship ${locationStr} apply ${now.getFullYear()}`.trim(),
    `Rotary Lions Kiwanis scholarship ${locationStr} ${now.getFullYear()}`.trim()
  );

  if (profile.firstGeneration) {
    queries.push(`first generation college student scholarship ${locationStr} ${now.getFullYear()}`.trim());
  }
  if (profile.ethnicity?.length) {
    queries.push(`${profile.ethnicity.join(' ')} student scholarship ${locationStr} ${now.getFullYear()}`.trim());
  }
  if (profile.gender) {
    queries.push(`${profile.gender} student scholarship ${locationStr} ${now.getFullYear()}`.trim());
  }
  if (profile.agiRange && ['under_30k', '30k_60k'].includes(profile.agiRange)) {
    queries.push(`need-based scholarship low income student ${locationStr} ${now.getFullYear()}`.trim());
  }
  if (profile.intendedMajor) {
    queries.push(`scholarship for ${profile.intendedMajor} students ${locationStr} ${graduationStr}`.trim());
  }
  if (profile.athletics?.length) {
    profile.athletics
      .slice(0, 2)
      .forEach((athletic) =>
        queries.push(`scholarship for ${athletic} athletes ${locationStr} ${graduationStr}`.trim())
      );
  }
  if (profile.ecCategories?.length) {
    profile.ecCategories
      .slice(0, 2)
      .forEach((category) =>
        queries.push(`scholarship for ${category} students ${locationStr} ${graduationStr}`.trim())
      );
  }

  return queries.filter((query) => query.length > 0);
};

const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase().replace(/\/$/, '');
  } catch {
    return url.toLowerCase();
  }
};

const extractJsonArray = (text: string): Array<{ url?: string; context?: string }> => {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const withoutFences = trimmed.startsWith('```')
    ? trimmed.replace(/```(?:json)?/g, '').trim()
    : trimmed;
  const firstBracket = withoutFences.indexOf('[');
  const lastBracket = withoutFences.lastIndexOf(']');
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    return [];
  }
  try {
    const parsed = JSON.parse(withoutFences.slice(firstBracket, lastBracket + 1)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is { url?: string; context?: string } =>
      typeof entry === 'object' && entry !== null
    );
  } catch {
    return [];
  }
};

const parseContextDeadline = (context?: string | null): Date | null => {
  if (!context) return null;
  const isoMatch = context.match(/\b20\d{2}-\d{2}-\d{2}\b/);
  if (isoMatch?.[0]) {
    const parsed = new Date(isoMatch[0]);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const wordMatch = context.match(
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+20\d{2}\b/i
  );
  if (wordMatch?.[0]) {
    const parsed = new Date(wordMatch[0]);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export async function discoverScholarshipUrls(
  profile: PipelineProfile
): Promise<DiscoveredUrl[]> {
  if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
    console.error('[pipeline] GOOGLE_AI_STUDIO_API_KEY is not configured');
    return [];
  }

  const queries = buildQueries(profile);
  if (queries.length === 0) return [];

  const existingScholarships = await db
    .select({ sourceUrl: scholarships.source_url })
    .from(scholarships);
  const existingPending = await db
    .select({ sourceUrl: scholarships_pending.source_url })
    .from(scholarships_pending);

  const existing = new Set(
    [...existingScholarships, ...existingPending]
      .map((row) => row.sourceUrl)
      .filter((value): value is string => Boolean(value))
      .map(normalizeUrl)
  );

  const results: DiscoveredUrl[] = [];
  const seen = new Set<string>();
  const minDeadlineMs = Date.now() + 24 * 60 * 60 * 1000;

  for (const query of queries) {
    try {
      const prompt = `You are a scholarship search assistant. Search Google for real scholarship 
opportunities matching the following query. Return ONLY a JSON array of URLs 
you found via Google Search — real pages, no fabricated links. Each URL must 
be a direct link to a scholarship application page or a page describing a 
specific scholarship. Filter out: aggregator sites (Bold.org, Fastweb, 
Scholarships.com, Niche.com, Going Merry), news articles, and any scholarship 
whose visible deadline has already passed as of today (${new Date().toISOString().slice(0, 10)}).

Query: ${query}

Respond with ONLY valid JSON in this exact format, no other text:
[
  { "url": "https://...", "context": "brief note about what this scholarship is" }
]
If you find no results, return: []`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const entries = extractJsonArray(text);

      const candidate = response.response.candidates?.[0] as
        | { groundingMetadata?: unknown }
        | undefined;
      const groundingMetadata = candidate?.groundingMetadata
        ? JSON.stringify(candidate.groundingMetadata)
        : undefined;

      for (const entry of entries) {
        if (!entry?.url || typeof entry.url !== 'string') continue;
        const normalized = normalizeUrl(entry.url);
        if (seen.has(normalized) || existing.has(normalized)) continue;

        const deadline = parseContextDeadline(entry.context ?? null);
        if (deadline && deadline.getTime() < minDeadlineMs) continue;

        seen.add(normalized);
        results.push({
          url: entry.url,
          sourceQuery: query,
          groundingMetadata
        });
        if (results.length >= MAX_RESULTS) return results;
      }
    } catch (error) {
      console.error('[pipeline] Gemini discovery failed', query, error);
    }
  }

  return results.slice(0, MAX_RESULTS);
}
