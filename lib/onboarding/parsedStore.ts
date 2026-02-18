'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ParsedOnboardingPayload } from './types';

export interface ParsedOnboardingState {
  payload: ParsedOnboardingPayload | null;
  setParsedPayload: (payload: ParsedOnboardingPayload) => void;
  clearParsedPayload: () => void;
}

export const useParsedOnboardingStore = create<ParsedOnboardingState>()(
  persist(
    (set: (partial: ParsedOnboardingState | Partial<ParsedOnboardingState>) => void) => ({
      payload: null,
      setParsedPayload: (payload: ParsedOnboardingPayload) => set({ payload }),
      clearParsedPayload: () => set({ payload: null })
    }),
    {
      name: 'magpie_onboarding_parsed_store',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => sessionStorage) : undefined
    }
  )
);
