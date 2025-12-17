"use client";

import { useState } from "react";
import { SnapshotViewer } from "@/components/SnapshotViewer";
import { EvidenceEditor } from "@/components/EvidenceEditor";

interface Snapshot {
  id: string;
  url: string;
  httpStatus: number;
  contentType: string | null;
  textExtract: string | null;
  sourceType: string | null;
  fetchedAt: Date;
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  severity: string | null;
  confidenceScore: number | null;
  snapshotId: string | null;
  snapshot: Snapshot | null;
  sourceEvidence: {
    id: string;
    sourceType: string;
    sourceUrl: string | null;
    snippet: string | null;
  } | null;
}

interface Candidate {
  id: string;
  companyName: string;
  domainCandidates: unknown;
  profileUrls: unknown;
  discoveryProvenance: unknown;
  discoveryConfidence: number | null;
  snapshots: Snapshot[];
}

interface LeadDetailClientProps {
  lead: {
    id: string;
    companyName: string;
    website: string | null;
    confidenceScore: number | null;
    requiresReview: boolean;
    aiRawOutput: unknown;
    candidate: Candidate | null;
  };
  issues: Issue[];
  profileUrls: string[];
}

export function LeadDetailClient({
  lead,
  issues,
  profileUrls,
}: LeadDetailClientProps) {
  const [viewingSnapshotId, setViewingSnapshotId] = useState<string | null>(null);
  const [highlightText, setHighlightText] = useState<string | undefined>();
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [showRawResponse, setShowRawResponse] = useState(false);

  const needsReview =
    lead.requiresReview || (lead.confidenceScore !== null && lead.confidenceScore < 70);

  const snapshots = lead.candidate?.snapshots ?? [];

  const handleViewSnapshot = (snapshotId: string, highlight?: string) => {
    setViewingSnapshotId(snapshotId);
    setHighlightText(highlight);
  };

  const handleVerifyEvidence = (issue: Issue) => {
    setEditingIssue(issue);
  };

  const handleEvidenceSave = (data: {
    issueId: string;
    newExcerpt: string;
    isValid: boolean;
    notes: string;
  }) => {
    console.log("Evidence saved:", data);
    setEditingIssue(null);
  };

  const handleFlagForReview = async () => {
    try {
      await fetch(`/api/leads/${lead.id}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiresReview: true }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to flag lead:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Review Badge */}
      {needsReview && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-amber-800">Needs Manual Review</h3>
              <p className="text-sm text-amber-700">
                {lead.confidenceScore !== null && lead.confidenceScore < 70
                  ? `Confidence score (${lead.confidenceScore}%) is below threshold`
                  : "This lead has been flagged for manual review"}
              </p>
            </div>
          </div>
          <button
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
            title="Review required before sending emails"
          >
            Send Email (Disabled)
          </button>
        </div>
      )}

      {/* Candidate Metadata */}
      {lead.candidate && (
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span>🔍</span> Discovery Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Domain Candidates:</span>
              <div className="mt-1">
                {Array.isArray(lead.candidate.domainCandidates) &&
                lead.candidate.domainCandidates.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {(lead.candidate.domainCandidates as string[]).map((domain, i) => (
                      <li key={i} className="text-blue-600">
                        <a
                          href={`https://${domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {domain}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-400">None discovered</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Discovery Confidence:</span>
              <div className="mt-1 font-medium">
                {lead.candidate.discoveryConfidence ?? "—"}%
              </div>
            </div>
          </div>

          {/* Discovery Provenance */}
          {Array.isArray(lead.candidate.discoveryProvenance) &&
            lead.candidate.discoveryProvenance.length > 0 && (
              <div className="mt-4">
                <span className="text-gray-500 text-sm">Search Provenance:</span>
                <div className="mt-1 space-y-1">
                  {(lead.candidate.discoveryProvenance as Array<{ queryUsed?: string; resultUrl?: string; snippet?: string }>).slice(0, 3).map((prov, i) => (
                    <div key={i} className="text-xs bg-gray-50 p-2 rounded">
                      {prov.queryUsed && (
                        <div>
                          <span className="text-gray-500">Query:</span> {prov.queryUsed}
                        </div>
                      )}
                      {prov.resultUrl && (
                        <a
                          href={prov.resultUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {prov.resultUrl}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Profile URLs (when no website) */}
      {!lead.website && profileUrls.length > 0 && (
        <div className="border border-blue-300 bg-blue-50 rounded-lg p-4">
          <h2 className="font-bold text-blue-800 mb-3">📱 Profile URLs</h2>
          <p className="text-sm text-blue-700 mb-2">
            No website found. Available profile pages:
          </p>
          <ul className="space-y-2">
            {profileUrls.map((url, i) => {
              const snapshot = snapshots.find((s) => s.url === url);
              return (
                <li key={i} className="flex items-center justify-between">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {url}
                  </a>
                  {snapshot && (
                    <button
                      onClick={() => handleViewSnapshot(snapshot.id)}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Open Snapshot
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Snapshots List */}
      {snapshots.length > 0 && (
        <div className="border border-gray-300 rounded-lg p-4">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <span>📸</span> Snapshots ({snapshots.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">URL</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Fetched</th>
                  <th className="text-left py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snapshot) => (
                  <tr key={snapshot.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {snapshot.sourceType ?? "unknown"}
                      </span>
                    </td>
                    <td className="py-2 px-2 max-w-xs truncate">
                      <a
                        href={snapshot.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        title={snapshot.url}
                      >
                        {snapshot.url.length > 50
                          ? snapshot.url.slice(0, 50) + "..."
                          : snapshot.url}
                      </a>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          snapshot.httpStatus >= 200 && snapshot.httpStatus < 300
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {snapshot.httpStatus}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-500">
                      {new Date(snapshot.fetchedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => handleViewSnapshot(snapshot.id)}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                      >
                        View Snapshot
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues with Evidence Verification */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <span>🔎</span> Issues & Evidence Verification
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Click &quot;Verify Evidence&quot; to check and correct evidence excerpts
        </p>

        {issues.length === 0 ? (
          <p className="text-gray-500 text-sm">No issues identified</p>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="border-l-4 border-gray-300 pl-4 py-2"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium">{issue.title}</h3>
                  <div className="flex items-center gap-2">
                    {issue.severity && (
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          issue.severity === "critical"
                            ? "bg-red-100 text-red-700"
                            : issue.severity === "high"
                              ? "bg-orange-100 text-orange-700"
                              : issue.severity === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {issue.severity}
                      </span>
                    )}
                  </div>
                </div>

                {issue.description && (
                  <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                )}

                {/* Evidence */}
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">
                      📄 Evidence ({issue.sourceEvidence?.sourceType ?? "snapshot"})
                    </span>
                    <div className="flex gap-2">
                      {(issue.snapshotId || issue.snapshot) && (
                        <button
                          onClick={() =>
                            handleViewSnapshot(
                              issue.snapshotId ?? issue.snapshot!.id,
                              issue.sourceEvidence?.snippet ?? undefined
                            )
                          }
                          className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
                        >
                          View Snapshot
                        </button>
                      )}
                      <button
                        onClick={() => handleVerifyEvidence(issue)}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Verify Evidence
                      </button>
                    </div>
                  </div>

                  {issue.sourceEvidence?.snippet && (
                    <blockquote className="text-sm italic text-gray-700 border-l-2 border-gray-300 pl-2 my-2">
                      &quot;{issue.sourceEvidence.snippet}&quot;
                    </blockquote>
                  )}

                  {issue.sourceEvidence?.sourceUrl && (
                    <a
                      href={issue.sourceEvidence.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                    >
                      🔗 View Source
                    </a>
                  )}

                  {issue.confidenceScore !== null && (
                    <span className="text-xs text-gray-400 ml-4">
                      Confidence: {issue.confidenceScore}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw AI Response */}
      <div className="border border-gray-300 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold flex items-center gap-2">
            <span>🤖</span> AI Analysis Details
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRawResponse(!showRawResponse)}
              className="text-xs px-3 py-1 border rounded hover:bg-gray-100"
            >
              {showRawResponse ? "Hide" : "Show"} Raw Response
            </button>
            {!lead.requiresReview && (
              <button
                onClick={handleFlagForReview}
                className="text-xs px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600"
              >
                Flag for Manual Review
              </button>
            )}
          </div>
        </div>

        {showRawResponse && (
          <div className="bg-gray-50 border rounded p-3 overflow-auto max-h-96">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {JSON.stringify(lead.aiRawOutput, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Snapshot Viewer Modal */}
      {viewingSnapshotId && (
        <SnapshotViewer
          snapshotId={viewingSnapshotId}
          isOpen={!!viewingSnapshotId}
          onClose={() => {
            setViewingSnapshotId(null);
            setHighlightText(undefined);
          }}
          highlightText={highlightText}
        />
      )}

      {/* Evidence Editor Modal */}
      {editingIssue && (
        <EvidenceEditor
          issueId={editingIssue.id}
          issueTitle={editingIssue.title}
          snapshotId={editingIssue.snapshotId ?? editingIssue.snapshot?.id ?? null}
          sourceUrl={editingIssue.sourceEvidence?.sourceUrl ?? ""}
          currentExcerpt={editingIssue.sourceEvidence?.snippet ?? ""}
          snapshotText={editingIssue.snapshot?.textExtract ?? ""}
          isOpen={!!editingIssue}
          onClose={() => setEditingIssue(null)}
          onSave={handleEvidenceSave}
        />
      )}
    </div>
  );
}
