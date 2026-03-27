import type { Metadata } from 'next';
import StructuredData from '@/components/seo/StructuredData';
import {
  createBreadcrumbSchema,
  createMarketingMetadata,
  createWebPageSchema,
} from '@/lib/seo';

const title = 'Terms of Service';
const description =
  'Review the LeadIntel Pro terms of service for subscriptions, acceptable use, billing, and account responsibilities.';

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/terms',
  keywords: [
    'leadintel pro terms of service',
    'lead generation software terms',
    'lead intelligence terms',
  ],
});

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={[
          createWebPageSchema({
            name: title,
            path: '/terms',
            description,
          }),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Terms of Service', path: '/terms' },
          ]),
        ]}
      />
      {children}
    </>
  );
}
