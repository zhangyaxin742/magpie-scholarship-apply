import type { OnboardingData, ParsedOnboardingPayload } from './types';

const PARSED_KEY = 'magpie_onboarding_parsed';
const MANUAL_KEY = 'magpie_onboarding_manual';

export function saveParsedPayload(payload: ParsedOnboardingPayload) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(PARSED_KEY, JSON.stringify(payload));
}

export function loadParsedPayload(): ParsedOnboardingPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(PARSED_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ParsedOnboardingPayload;
  } catch {
    return null;
  }
}

export function clearParsedPayload() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PARSED_KEY);
}

export function saveManualDraft(data: OnboardingData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MANUAL_KEY, JSON.stringify(data));
}

export function loadManualDraft(): OnboardingData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(MANUAL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingData;
  } catch {
    return null;
  }
}

export function clearManualDraft() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MANUAL_KEY);
}
