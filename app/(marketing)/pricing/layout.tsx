import type { Metadata } from 'next';
import StructuredData from '@/components/seo/StructuredData';
import {
  createBreadcrumbSchema,
  createFaqSchema,
  createMarketingMetadata,
  createSoftwareApplicationSchema,
  createWebPageSchema,
  pricingFaqs,
} from '@/lib/seo';

const title = 'Lead Generation Software Pricing';
const description =
  'Compare LeadIntel Pro pricing for AI lead generation, local business prospecting, lead scoring, and outreach-ready exports.';

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/pricing',
  keywords: [
    'lead generation software pricing',
    'ai lead generation pricing',
    'sales prospecting software pricing',
    'lead intelligence software cost',
  ],
});

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={[
          createWebPageSchema({
            type: 'CollectionPage',
            name: title,
            path: '/pricing',
            description,
          }),
          createSoftwareApplicationSchema(),
          createFaqSchema(pricingFaqs),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Pricing', path: '/pricing' },
          ]),
        ]}
      />
      {children}
    </>
  );
}
