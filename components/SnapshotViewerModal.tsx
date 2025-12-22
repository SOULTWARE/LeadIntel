"use client";

import { useState, useEffect } from "react";

export interface SnapshotViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshotId: string;
  sourceUrl: string;
}

interface SnapshotData {
  id: string;
  url: string;
  textExtract: string | null;
  sourceType: string | null;
  fetchedAt: string;
}

export function SnapshotViewerModal({
  isOpen,
  onClose,
  snapshotId,
  sourceUrl
}: SnapshotViewerModalProps) {
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && snapshotId) {
      fetchSnapshot();
    }
  }, [isOpen, snapshotId]);

  const fetchSnapshot = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/snapshots/${snapshotId}`);
      if (!response.ok) {
        throw new Error("Failed to load snapshot");
      }
      const data = await response.json();
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load snapshot");
    } finally {
      setLoading(false);
    }
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Evidence Snapshot
              </h3>
              <p className="text-sm text-gray-500 truncate max-w-lg">
                {sourceUrl}
              </p>
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
          <div className="p-4 overflow-y-auto max-h-[60vh]">
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

            {snapshot && !loading && (
              <div className="space-y-4">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Source Type:</span>{" "}
                    <span className="text-gray-900">{snapshot.sourceType ?? "Unknown"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fetched:</span>{" "}
                    <span className="text-gray-900">
                      {new Date(snapshot.fetchedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Text Content */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Extracted Text
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                    {snapshot.textExtract || "No text content extracted"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Open Original Source ↗
            </a>
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

export default SnapshotViewerModal;
