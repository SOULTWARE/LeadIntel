"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { LandingHero } from "./landing-page/LandingHero";
import { PlatformBenefitsSection } from "./landing-page/PlatformBenefitsSection";
import { WorkflowSection } from "./landing-page/WorkflowSection";
import { ProductPreviewSection } from "./landing-page/ProductPreviewSection";
import { UseCasesSection } from "./landing-page/UseCasesSection";
import { HomeFaqSection } from "./landing-page/HomeFaqSection";

interface LandingPageContentProps {
  user: SupabaseUser | null;
}

export default function LandingPageContent({ user }: LandingPageContentProps) {
  return (
    <main className="relative z-10 mx-auto flex w-full max-w-[1680px] flex-col gap-24 px-6 pb-32 pt-16 lg:px-8">
      <section className="space-y-24">
        <LandingHero user={user} />

        <WorkflowSection />

        <PlatformBenefitsSection />

        <ProductPreviewSection />

        <UseCasesSection />

        <HomeFaqSection />
      </section>
    </main>
  );
}
