import type { ReactNode } from 'react';
import { OnboardingTransition } from './OnboardingTransition';

interface OnboardingLayoutProps {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return <OnboardingTransition>{children}</OnboardingTransition>;
}
