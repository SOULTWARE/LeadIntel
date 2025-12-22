"use client";

import { useState, useEffect } from "react";

export interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
}

interface AuditData {
  leadId: string;
  companyName: string;
  rawAIResponse: unknown;
  deepSearch: {
    signals: unknown[];
    scoreBreakdown: unknown;
    discoveryInfo: unknown;
    searchesPerformed: number;
    iterationsUsed: number;
  } | null;
  actionability: {
    topIssues: unknown[];
    reasons: string[];
    computedAt: string;
  } | null;
  verification: {
    passed: boolean;
    reviewReason: string | null;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
    lastAnalysisAt: string | null;
  };
}

export function AuditLogModal({ isOpen, onClose, leadId }: AuditLogModalProps) {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && leadId) {
      fetchAuditData();
    }
  }, [isOpen, leadId]);

  const fetchAuditData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/audit`);
      if (!response.ok) {
        throw new Error("Failed to load audit data");
      }
      const data = await response.json();
      setAuditData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Audit Log
              </h3>
              {auditData && (
                <p className="text-sm text-gray-500">
                  {auditData.companyName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[75vh]">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 rounded-lg p-4">
                {error}
              </div>
            )}

            {auditData && !loading && (
              <div className="space-y-4">
                {/* Verification Status */}
                <div className={`rounded-lg p-3 ${auditData.verification.passed ? "bg-green-50" : "bg-yellow-50"}`}>
                  <div className="flex items-center gap-2">
                    <span className={auditData.verification.passed ? "text-green-600" : "text-yellow-600"}>
                      {auditData.verification.passed ? "✓" : "⚠"}
                    </span>
                    <span className={`font-medium ${auditData.verification.passed ? "text-green-800" : "text-yellow-800"}`}>
                      {auditData.verification.passed ? "Verification Passed" : "Verification Issues"}
                    </span>
                  </div>
                  {auditData.verification.reviewReason && (
                    <p className="text-sm text-gray-600 mt-1">
                      {auditData.verification.reviewReason}
                    </p>
                  )}
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>{" "}
                    <span className="text-gray-900">
                      {new Date(auditData.timestamps.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>{" "}
                    <span className="text-gray-900">
                      {new Date(auditData.timestamps.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  {auditData.timestamps.lastAnalysisAt && (
                    <div>
                      <span className="text-gray-500">Last Analysis:</span>{" "}
                      <span className="text-gray-900">
                        {new Date(auditData.timestamps.lastAnalysisAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Deep Search Section */}
                {auditData.deepSearch && (
                  <CollapsibleSection
                    title={`Deep Search (${auditData.deepSearch.iterationsUsed} iterations, ${auditData.deepSearch.searchesPerformed} searches)`}
                    isOpen={expandedSections.has("deepSearch")}
                    onToggle={() => toggleSection("deepSearch")}
                  >
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 mb-1">Score Breakdown</h5>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(auditData.deepSearch.scoreBreakdown, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 mb-1">
                          Signals ({(auditData.deepSearch.signals as unknown[]).length})
                        </h5>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-64">
                          {JSON.stringify(auditData.deepSearch.signals, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}

                {/* Actionability Section */}
                {auditData.actionability && (
                  <CollapsibleSection
                    title="Actionability Computation"
                    isOpen={expandedSections.has("actionability")}
                    onToggle={() => toggleSection("actionability")}
                  >
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 mb-1">Reasons</h5>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          {auditData.actionability.reasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 mb-1">Top Issues</h5>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-48">
                          {JSON.stringify(auditData.actionability.topIssues, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CollapsibleSection>
                )}

                {/* Raw AI Response Section */}
                <CollapsibleSection
                  title="Raw AI Response"
                  isOpen={expandedSections.has("rawAI")}
                  onToggle={() => toggleSection("rawAI")}
                >
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(auditData.rawAIResponse, null, 2)}
                  </pre>
                </CollapsibleSection>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

export default AuditLogModal;
