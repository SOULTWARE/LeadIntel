import type { Metadata } from 'next';
import StructuredData from '@/components/seo/StructuredData';
import {
  createBreadcrumbSchema,
  createMarketingMetadata,
  createWebPageSchema,
} from '@/lib/seo';

const title = 'About LeadIntel Pro';
const description =
  'Learn how LeadIntel Pro helps teams source verified business leads, score fit with AI, and build cleaner outbound workflows.';

export const metadata: Metadata = createMarketingMetadata({
  title,
  description,
  path: '/about',
  keywords: [
    'about leadintel pro',
    'lead intelligence company',
    'ai lead generation platform',
    'sales prospecting software company',
  ],
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData
        data={[
          createWebPageSchema({
            type: 'AboutPage',
            name: title,
            path: '/about',
            description,
          }),
          createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
        ]}
      />
      {children}
    </>
  );
}
