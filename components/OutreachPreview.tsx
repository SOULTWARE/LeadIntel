"use client";

import { useState } from "react";

export interface OutreachPreviewProps {
  leadId: string;
  outreach: {
    suggestedAngle: string;
    suggestedSubject: string | null;
    suggestedSnippet: string | null;
  };
  actionable: boolean;
  requiresReview: boolean;
}

interface EmailVariation {
  subject: string;
  body: string;
}

export function OutreachPreview({
  leadId,
  outreach,
  actionable,
  requiresReview
}: OutreachPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailVariations, setEmailVariations] = useState<EmailVariation[] | null>(null);
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canSend = actionable && !requiresReview;

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/generate-email-preview`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to generate email");
      }

      const data = await response.json();
      setEmailVariations(data.variations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate email");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Outreach Preview</h2>

      {/* Suggested Angle */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Suggested Angle</p>
        <p className="text-sm text-gray-900 font-medium">
          {outreach.suggestedAngle}
        </p>
      </div>

      {/* Quick Preview */}
      {outreach.suggestedSubject && !emailVariations && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Subject Preview</p>
          <p className="text-sm text-gray-900">{outreach.suggestedSubject}</p>

          {outreach.suggestedSnippet && (
            <>
              <p className="text-xs text-gray-500 mb-1 mt-3">Opening</p>
              <p className="text-sm text-gray-700 italic">
                {outreach.suggestedSnippet}...
              </p>
            </>
          )}
        </div>
      )}

      {/* Generated Email Variations */}
      {emailVariations && emailVariations.length > 0 && (
        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            {emailVariations.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedVariation(index)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedVariation === index
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Version {index + 1}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Subject</p>
            <p className="text-sm text-gray-900 font-medium mb-3">
              {emailVariations[selectedVariation].subject}
            </p>

            <p className="text-xs text-gray-500 mb-1">Body</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {emailVariations[selectedVariation].body}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerateEmail}
          disabled={isGenerating}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
        >
          {isGenerating ? "Generating..." : emailVariations ? "Regenerate" : "Generate Email"}
        </button>

        {emailVariations && (
          <button
            disabled={!canSend}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canSend
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            title={!canSend ? "Lead must be actionable and not require review" : "Send email"}
          >
            Send
          </button>
        )}
      </div>

      {!canSend && (
        <p className="text-xs text-gray-500 mt-2">
          {requiresReview
            ? "⚠ This lead requires review before sending outreach"
            : "⚠ This lead is not actionable yet"}
        </p>
      )}
    </section>
  );
}

export default OutreachPreview;
