import { createClient } from '@/lib/supabase/server';
import LandingPageContent from '@/components/LandingPageContent';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <LandingPageContent user={user} />;
}
