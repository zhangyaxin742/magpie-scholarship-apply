import { db } from '@/lib/db';
import { scholarships_pending } from '@/lib/db/schema';

import { buildQueries, discoverScholarshipUrls } from './geminiDiscover';
import { fetchAndExtractText } from './fetchAndParse';
import { extractScholarshipData } from './haikuExtract';
import type { PipelineProfile } from './types';

export interface PipelineRunResult {
  queried: number;
  urlsDiscovered: number;
  urlsNewToDb: number;
  pagesFetched: number;
  extracted: number;
  queued: number;
  skippedDeadline: number;
  errors: string[];
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function runDiscoveryPipeline(
  profile: PipelineProfile
): Promise<PipelineRunResult> {
  const queries = buildQueries(profile);
  const result: PipelineRunResult = {
    queried: queries.length,
    urlsDiscovered: 0,
    urlsNewToDb: 0,
    pagesFetched: 0,
    extracted: 0,
    queued: 0,
    skippedDeadline: 0,
    errors: []
  };

  if (queries.length === 0) return result;

  let urls = [] as Array<{ url: string }>;
  try {
    urls = await discoverScholarshipUrls(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Discovery failed';
    result.errors.push(`[pipeline] ${message}`);
    return result;
  }

  result.urlsDiscovered = urls.length;
  result.urlsNewToDb = urls.length;

  for (const entry of urls) {
    try {
      const fetched = await fetchAndExtractText(entry.url);
      if (!fetched) {
        result.errors.push(`[fetch-fail] ${entry.url}`);
        continue;
      }
      result.pagesFetched += 1;

      const extraction = await extractScholarshipData(fetched);
      if (!extraction.extractedData && !extraction.needsReview) {
        result.skippedDeadline += 1;
        continue;
      }

      if (extraction.extractedData) {
        result.extracted += 1;
      }

      await db.insert(scholarships_pending).values({
        source_url: entry.url,
        raw_page_text: fetched.rawText,
        extracted_data: extraction.extractedData
          ? (extraction.extractedData as unknown as Record<string, unknown>)
          : null,
        extraction_model: extraction.model,
        extraction_confidence: String(extraction.confidence),
        status: extraction.needsReview ? 'needs_review' : 'pending'
      });

      result.queued += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pipeline step failed';
      result.errors.push(`[pipeline] ${entry.url} ${message}`);
    } finally {
      await sleep(500);
    }
  }

  return result;
}
