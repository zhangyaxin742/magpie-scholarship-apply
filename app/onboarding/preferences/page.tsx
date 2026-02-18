import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PreferencesClient } from '@/app/components/onboarding/PreferencesClient';

export default async function PreferencesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  return <PreferencesClient />;
}
