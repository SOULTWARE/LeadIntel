import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LeadPageClient } from './LeadPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface LeadUIResponse {
  lead: {
    id: string;
    company_name: string;
    industry: string | null;
    location: string | null;
    employees: number | null;
    stage: string;
    lead_score: number | null;
    confidence: number | null;
    actionable: boolean;
    actionabilityScore: number | null;
    primaryOpportunity: string | null;
    requiresReview: boolean;
  };
  contactPaths: {
    phone: { value: string; verified: boolean } | null;
    email: { value: string; verified: boolean } | null;
    website: string | null;
    linkedin: string | null;
  };
  keyOpportunities: Array<{
    issue: string;
    severity: string;
    evidenceExcerpt: string;
    evidenceSnapshotId: string;
    source_url: string;
  }>;
  evidenceSummary: {
    counts: {
      snapshots: number;
      reviews: number;
      socials: number;
    };
    topSources: Array<{
      source_url: string;
      type: string;
      usedFor: string;
      snippetsCount: number;
    }>;
  };
  outreachPreview: {
    suggestedAngle: string;
    suggestedSubject: string | null;
    suggestedSnippet: string | null;
  };
  audit: {
    rawAIResponseShown: boolean;
  };
  verificationIssues?: Array<{
    issue: string;
    reason: string;
  }>;
}

async function getLeadUI(id: string): Promise<LeadUIResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/leads/${id}/ui`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch lead UI data');
    }

    return response.json();
  } catch (error) {
    console.error('[LeadPage] Error fetching lead UI:', error);
    return null;
  }
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getLeadUI(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <Link href="/leads" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
          ← Back to Leads
        </Link>
      </nav>

      {/* Client-side wrapper for all interactive components */}
      <LeadPageClient data={data} />
    </div>
  );
}
