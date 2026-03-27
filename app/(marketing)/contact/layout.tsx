import type { Metadata } from 'next';
import StructuredData from '@/components/seo/StructuredData';
import {
  createBreadcrumbSchema,
  createContactPageSchema,
  createMarketingMetadata,
  createWebPageSchema,
} from '@/lib/seo';

const title = 'Contact LeadIntel Pro';
const description =
  'Contact LeadIntel Pro for sales questions, support, partnerships, and product inquiries.';

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/contact',
  keywords: [
    'contact leadintel pro',
    'leadintel pro support',
    'leadintel pro sales',
    'contact lead generation software company',
  ],
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={[
          createWebPageSchema({
            type: 'ContactPage',
            name: title,
            path: '/contact',
            description,
          }),
          createContactPageSchema(),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
          ]),
        ]}
      />
      {children}
    </>
  );
}
