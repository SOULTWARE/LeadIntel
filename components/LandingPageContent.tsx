'use client';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { LandingHero } from './landing-page/LandingHero';
import { WorkflowSection } from './landing-page/WorkflowSection';
import { ProductPreviewSection } from './landing-page/ProductPreviewSection';

interface LandingPageContentProps {
  user: SupabaseUser | null;
}

export default function LandingPageContent({ user }: LandingPageContentProps) {
  return (
    <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
      <LandingHero user={user} />

      {/* Workflow Section */}
      <WorkflowSection />

      <ProductPreviewSection />
    </main>
  );
}
