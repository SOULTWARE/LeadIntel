import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LandingPageContent from "@/components/LandingPageContent";
import StructuredData from "@/components/seo/StructuredData";
import {
  createFaqSchema,
  createMarketingMetadata,
  createOrganizationSchema,
  createSoftwareApplicationSchema,
  createWebPageSchema,
  createWebSiteSchema,
  homeFaqs,
} from "@/lib/seo";

const title = "AI Lead Generation Software for Local Business Prospecting";
const description =
  "Find verified business leads by category and city, score fit with AI, discover contacts, and export outreach-ready prospect lists with LeadIntel Pro.";

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: "/",
  keywords: [
    "ai lead generation software",
    "lead intelligence software",
    "local business leads",
    "sales prospecting software",
    "business lead finder",
    "outbound lead generation tool",
  ],
});

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <StructuredData
        data={[
          createOrganizationSchema(),
          createWebSiteSchema(),
          createSoftwareApplicationSchema(),
          createWebPageSchema({
            name: title,
            path: "/",
            description,
          }),
          createFaqSchema(homeFaqs),
        ]}
      />
      <LandingPageContent user={user} />
    </>
  );
}
