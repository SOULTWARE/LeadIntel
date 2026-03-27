import type { Metadata } from 'next';
import StructuredData from '@/components/seo/StructuredData';
import {
  createBreadcrumbSchema,
  createMarketingMetadata,
  createWebPageSchema,
} from '@/lib/seo';

const title = 'Privacy Policy';
const description =
  'Read the LeadIntel Pro privacy policy covering data collection, usage, retention, and user rights.';

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/privacy',
  keywords: [
    'leadintel pro privacy policy',
    'lead generation software privacy policy',
    'lead intelligence privacy',
  ],
});

export default function PrivacyLayout({
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
            path: '/privacy',
            description,
          }),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Privacy Policy', path: '/privacy' },
          ]),
        ]}
      />
      {children}
    </>
  );
}
