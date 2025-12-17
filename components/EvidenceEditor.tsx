"use client";

import { useState } from "react";

interface EvidenceEditorProps {
  issueId: string;
  issueTitle: string;
  snapshotId: string | null;
  sourceUrl: string;
  currentExcerpt: string;
  snapshotText: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    issueId: string;
    newExcerpt: string;
    isValid: boolean;
    notes: string;
  }) => void;
}

export function EvidenceEditor({
  issueId,
  issueTitle,
  snapshotId,
  sourceUrl,
  currentExcerpt,
  snapshotText,
  isOpen,
  onClose,
  onSave,
}: EvidenceEditorProps) {
  const [newExcerpt, setNewExcerpt] = useState(currentExcerpt);
  const [isValid, setIsValid] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  const excerptExistsInSnapshot = snapshotText
    .toLowerCase()
    .includes(newExcerpt.toLowerCase());

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setNewExcerpt(selection.toString().trim());
    }
  };

  const highlightExcerpt = (text: string, excerpt: string) => {
    if (!excerpt) return text;

    const lowerText = text.toLowerCase();
    const lowerExcerpt = excerpt.toLowerCase();
    const index = lowerText.indexOf(lowerExcerpt);

    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + excerpt.length);
    const after = text.slice(index + excerpt.length);

    return (
      <>
        {before}
        <mark className="bg-yellow-300">{match}</mark>
        {after}
      </>
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      if (snapshotId) {
        await fetch(`/api/snapshots/${snapshotId}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueId,
            newExcerpt,
            isValid,
            notes,
            verifierId: "manual-review",
          }),
        });
      }

      onSave({ issueId, newExcerpt, isValid, notes });
      onClose();
    } catch (error) {
      console.error("Failed to save verification:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-bold text-lg">Verify Evidence</h2>
            <p className="text-sm text-gray-500">{issueTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Snapshot content */}
            <div>
              <h3 className="font-medium mb-2">Snapshot Content</h3>
              <p className="text-xs text-gray-500 mb-2">
                Select text to use as evidence excerpt
              </p>
              <div
                className="border rounded bg-gray-50 p-3 h-64 overflow-auto text-sm font-mono cursor-text"
                onMouseUp={handleTextSelection}
              >
                <pre className="whitespace-pre-wrap">
                  {highlightExcerpt(snapshotText, newExcerpt)}
                </pre>
              </div>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm mt-2 inline-block"
              >
                🔗 {sourceUrl}
              </a>
            </div>

            {/* Evidence editor */}
            <div>
              <h3 className="font-medium mb-2">Evidence Excerpt</h3>

              {/* Current excerpt */}
              <div className="mb-4">
                <label className="text-xs text-gray-500">Original excerpt:</label>
                <div className="bg-gray-100 border rounded p-2 text-sm italic">
                  &quot;{currentExcerpt}&quot;
                </div>
              </div>

              {/* New excerpt */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 block mb-1">
                  New/corrected excerpt:
                </label>
                <textarea
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  className="w-full border rounded p-2 text-sm h-24"
                  placeholder="Select text from snapshot or type manually"
                />
                {newExcerpt && (
                  <div
                    className={`text-xs mt-1 ${
                      excerptExistsInSnapshot ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {excerptExistsInSnapshot
                      ? "✓ Excerpt found in snapshot"
                      : "✗ Excerpt NOT found in snapshot"}
                  </div>
                )}
              </div>

              {/* Validity toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isValid}
                    onChange={(e) => setIsValid(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Evidence is valid and accurate</span>
                </label>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="text-xs text-gray-500 block mb-1">
                  Verification notes:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border rounded p-2 text-sm h-20"
                  placeholder="Add notes about this verification..."
                />
              </div>

              {/* Warning for invalid */}
              {!isValid && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                  <p className="text-sm text-red-700">
                    ⚠️ Marking evidence as invalid will flag this issue for manual
                    review and exclude it from outreach recommendations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={() => {
              setIsValid(false);
              setNotes("Evidence marked as invalid by manual review");
            }}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
          >
            Mark Invalid
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (!excerptExistsInSnapshot && isValid)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Verification"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
