"use client";

import { useState } from "react";

export interface LeadHeaderProps {
  lead: {
    id: string;
    company_name: string;
    industry: string | null;
    location: string | null;
    employees: number | null;
    actionable: boolean;
    requiresReview: boolean;
    primaryOpportunity: string | null;
    lead_score: number | null;
    confidence: number | null;
  };
  onGenerateEmail: () => void;
  onOpenAudit: () => void;
  onFlagReview?: () => void;
}

export function LeadHeader({ lead, onGenerateEmail, onOpenAudit, onFlagReview }: LeadHeaderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFlagging, setIsFlagging] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    try {
      await onGenerateEmail();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFlagForReview = async () => {
    if (!flagReason.trim()) return;

    setIsFlagging(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/flag-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: flagReason,
          reviewerName: "manual-review",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to flag lead");
      }

      setShowFlagModal(false);
      setFlagReason("");
      setToast({ message: "Lead flagged for manual review", type: "success" });
      setTimeout(() => setToast(null), 3000);

      if (onFlagReview) {
        onFlagReview();
      }
    } catch (error) {
      console.error("Failed to flag lead:", error);
      setToast({ message: "Failed to flag lead for review", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsFlagging(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Company Name & Badges */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {lead.company_name}
            </h1>

            {/* Status Badges */}
            <div className="flex gap-2">
              {lead.actionable ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Actionable
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Not Actionable
                </span>
              )}

              {lead.requiresReview && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⚠ Needs Review
                </span>
              )}
            </div>
          </div>

          {/* Company Details */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            {lead.industry && (
              <span className="flex items-center gap-1">
                <span className="text-gray-400">Industry:</span>
                {lead.industry}
              </span>
            )}
            {lead.location && (
              <span className="flex items-center gap-1">
                <span className="text-gray-400">Location:</span>
                {lead.location}
              </span>
            )}
            {lead.employees && (
              <span className="flex items-center gap-1">
                <span className="text-gray-400">Employees:</span>
                {lead.employees.toLocaleString()}
              </span>
            )}
          </div>

          {/* Primary Opportunity */}
          {lead.primaryOpportunity && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 mb-3">
              <p className="text-sm font-medium text-blue-900">
                💡 {lead.primaryOpportunity}
              </p>
            </div>
          )}

          {/* Scores */}
          <div className="flex items-center gap-4 text-sm">
            {lead.lead_score !== null && (
              <span className="text-gray-600">
                Lead Score: <strong className="text-gray-900">{Math.round(lead.lead_score)}</strong>
              </span>
            )}
            {lead.confidence !== null && (
              <span className="text-gray-600">
                Confidence: <strong className="text-gray-900">{Math.round(lead.confidence)}%</strong>
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 ml-6">
          <button
            onClick={handleGenerateEmail}
            disabled={isGenerating || !lead.actionable}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              lead.actionable
                ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isGenerating ? "Generating..." : "Generate Email"}
          </button>

          <button
            onClick={onOpenAudit}
            className="px-4 py-2 rounded-lg font-medium text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Open Audit
          </button>

          {!lead.requiresReview && (
            <button
              onClick={() => setShowFlagModal(true)}
              className="px-4 py-2 rounded-lg font-medium text-sm border border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition-colors"
            >
              Flag for Review
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Flag for Review Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowFlagModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Flag Lead for Manual Review
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This will mark the lead as requiring review and disable outreach
              actions until reviewed.
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Enter reason for flagging this lead..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 h-24"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleFlagForReview}
                disabled={isFlagging || !flagReason.trim()}
                className="px-4 py-2 text-sm font-medium bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed"
              >
                {isFlagging ? "Flagging..." : "Flag for Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default LeadHeader;
