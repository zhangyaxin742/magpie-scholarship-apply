import * as cheerio from 'cheerio';

import type { FetchedPage } from './types';

const FETCH_TIMEOUT_MS = 8000;
const MAX_TEXT_CHARS = 15000;

export async function fetchAndExtractText(url: string): Promise<FetchedPage | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      console.error('[fetch-fail]', url, response.status);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, nav, header, footer, iframe, [role="navigation"]').remove();

    const text = $('body').text();
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length < 100) {
      console.error('[fetch-fail]', url, 'text-too-short');
      return null;
    }

    const rawText = cleaned.slice(0, MAX_TEXT_CHARS);

    return {
      url,
      rawText,
      fetchedAt: new Date().toISOString(),
      httpStatus: response.status
    };
  } catch (error) {
    console.error('[fetch-error]', url, error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
