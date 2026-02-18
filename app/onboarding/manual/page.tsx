import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ManualOnboardingClient } from '@/app/components/onboarding/ManualOnboardingClient';

export default async function ManualOnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  return <ManualOnboardingClient />;
}
