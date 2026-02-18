import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ConfirmClient } from '@/app/components/onboarding/ConfirmClient';

export default async function ConfirmPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  return <ConfirmClient />;
}
