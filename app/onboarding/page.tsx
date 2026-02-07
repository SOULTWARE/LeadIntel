import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/db';
import OnboardingFlow from '@/components/OnboardingFlow';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });

  if (profile?.onboardingCompleted) {
    const cookieStore = await cookies();
    cookieStore.set('onboarding_completed', '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: 'lax',
    });
    redirect('/sourcer');
  }

  return <OnboardingFlow />;
}
