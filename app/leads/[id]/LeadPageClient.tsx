"use client";

import { useState } from "react";
import { LeadHeader } from "@/components/LeadHeader";
import { ContactPaths } from "@/components/ContactPaths";
import { KeyOpportunities } from "@/components/KeyOpportunities";
import { OutreachPreview } from "@/components/OutreachPreview";
import { SnapshotViewerModal } from "@/components/SnapshotViewerModal";
import { AuditLogModal } from "@/components/AuditLogModal";

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

interface LeadPageClientProps {
  data: LeadUIResponse;
}

export function LeadPageClient({ data }: LeadPageClientProps) {
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [snapshotModal, setSnapshotModal] = useState<{
    isOpen: boolean;
    snapshotId: string;
    sourceUrl: string;
  }>({
    isOpen: false,
    snapshotId: "",
    sourceUrl: "",
  });

  const handleGenerateEmail = async () => {
    // Trigger email generation - OutreachPreview handles this internally
    console.log("Generate email triggered from header");
  };

  const handleOpenAudit = () => {
    setIsAuditOpen(true);
  };

  const handleVerifyContact = (type: "phone" | "email") => {
    // Open evidence inspector for the contact type
    console.log(`Verify ${type} contact`);
    setIsAuditOpen(true);
  };

  const handleViewEvidence = (snapshotId: string, sourceUrl: string) => {
    setSnapshotModal({
      isOpen: true,
      snapshotId,
      sourceUrl,
    });
  };

  return (
    <div className="pb-8">
      {/* Header - Above the fold */}
      <LeadHeader
        lead={data.lead}
        onGenerateEmail={handleGenerateEmail}
        onOpenAudit={handleOpenAudit}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact & Opportunities */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Opportunities */}
            <KeyOpportunities
              opportunities={data.keyOpportunities}
              onViewEvidence={handleViewEvidence}
            />

            {/* Outreach Preview */}
            <OutreachPreview
              leadId={data.lead.id}
              outreach={data.outreachPreview}
              actionable={data.lead.actionable}
              requiresReview={data.lead.requiresReview}
            />

            {/* Verification Issues Warning */}
            {data.verificationIssues && data.verificationIssues.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                  ⚠ Verification Issues ({data.verificationIssues.length})
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {data.verificationIssues.map((issue, index) => (
                    <li key={index}>
                      <strong>{issue.issue}:</strong> {issue.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - Contact Paths & Evidence Summary */}
          <div className="space-y-6">
            {/* Contact Paths */}
            <ContactPaths
              contactPaths={data.contactPaths}
              onVerifyContact={handleVerifyContact}
            />

            {/* Evidence Summary */}
            <section className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Evidence Summary
              </h2>

              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-lg font-bold text-gray-900">
                    {data.evidenceSummary.counts.snapshots}
                  </div>
                  <div className="text-xs text-gray-500">Snapshots</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-lg font-bold text-gray-900">
                    {data.evidenceSummary.counts.reviews}
                  </div>
                  <div className="text-xs text-gray-500">Reviews</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-lg font-bold text-gray-900">
                    {data.evidenceSummary.counts.socials}
                  </div>
                  <div className="text-xs text-gray-500">Socials</div>
                </div>
              </div>

              {data.evidenceSummary.topSources.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-2">
                    Top Sources
                  </h3>
                  <ul className="space-y-1">
                    {data.evidenceSummary.topSources.slice(0, 3).map((source, index) => (
                      <li key={index} className="text-xs text-gray-600 truncate">
                        <a
                          href={source.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {source.source_url.replace(/^https?:\/\//, "").slice(0, 40)}...
                        </a>
                        <span className="text-gray-400 ml-1">({source.type})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Audit Link */}
            <button
              onClick={handleOpenAudit}
              className="w-full text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              📋 View Audit Log
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      <SnapshotViewerModal
        isOpen={snapshotModal.isOpen}
        onClose={() => setSnapshotModal({ ...snapshotModal, isOpen: false })}
        snapshotId={snapshotModal.snapshotId}
        sourceUrl={snapshotModal.sourceUrl}
      />

      <AuditLogModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        leadId={data.lead.id}
      />
    </div>
  );
}

export default LeadPageClient;
