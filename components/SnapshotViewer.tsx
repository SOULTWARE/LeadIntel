"use client";

import { useState, useEffect } from "react";

interface Snapshot {
  id: string;
  url: string;
  httpStatus: number;
  contentType: string | null;
  textExtract: string | null;
  html: string;
  sourceType: string | null;
  fetchedAt: string;
  candidateName: string | null;
}

interface SnapshotViewerProps {
  snapshotId: string;
  isOpen: boolean;
  onClose: () => void;
  highlightText?: string;
}

export function SnapshotViewer({
  snapshotId,
  isOpen,
  onClose,
  highlightText,
}: SnapshotViewerProps) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"text" | "html">("text");

  useEffect(() => {
    if (isOpen && snapshotId) {
      fetchSnapshot();
    }
  }, [isOpen, snapshotId]);

  const fetchSnapshot = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/snapshots/${snapshotId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch snapshot: ${res.status}`);
      }
      const data = await res.json();
      setSnapshot(data.snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load snapshot");
    } finally {
      setLoading(false);
    }
  };

  const highlightContent = (content: string, highlight?: string) => {
    if (!highlight) return content;

    const lowerContent = content.toLowerCase();
    const lowerHighlight = highlight.toLowerCase();
    const index = lowerContent.indexOf(lowerHighlight);

    if (index === -1) return content;

    const before = content.slice(0, index);
    const match = content.slice(index, index + highlight.length);
    const after = content.slice(index + highlight.length);

    return (
      <>
        {before}
        <mark className="bg-yellow-300 px-1">{match}</mark>
        {after}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-bold text-lg">Snapshot Viewer</h2>
            {snapshot && (
              <p className="text-sm text-gray-500">
                {snapshot.sourceType} • {snapshot.url}
              </p>
            )}
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
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading snapshot...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
              {error}
            </div>
          )}

          {snapshot && !loading && (
            <div>
              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">HTTP Status:</span>{" "}
                  <span
                    className={`font-medium ${
                      snapshot.httpStatus >= 200 && snapshot.httpStatus < 300
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {snapshot.httpStatus}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Content-Type:</span>{" "}
                  <span className="font-medium">
                    {snapshot.contentType ?? "unknown"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Fetched:</span>{" "}
                  <span className="font-medium">
                    {new Date(snapshot.fetchedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Source:</span>{" "}
                  <span className="font-medium">{snapshot.sourceType}</span>
                </div>
              </div>

              {/* View toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setViewMode("text")}
                  className={`px-3 py-1 text-sm rounded ${
                    viewMode === "text"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Text Extract
                </button>
                <button
                  onClick={() => setViewMode("html")}
                  className={`px-3 py-1 text-sm rounded ${
                    viewMode === "html"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Raw HTML
                </button>
              </div>

              {/* Highlight indicator */}
              {highlightText && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-4 text-sm">
                  <span className="text-yellow-700">
                    Highlighting: &quot;{highlightText.slice(0, 50)}
                    {highlightText.length > 50 ? "..." : ""}&quot;
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="border rounded bg-gray-50 p-4 overflow-auto max-h-[50vh]">
                {viewMode === "text" ? (
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {highlightContent(
                      snapshot.textExtract ?? "No text extract available",
                      highlightText
                    )}
                  </pre>
                ) : (
                  <pre className="whitespace-pre-wrap text-xs font-mono text-gray-600">
                    {snapshot.html}
                  </pre>
                )}
              </div>

              {/* Source URL */}
              <div className="mt-4">
                <a
                  href={snapshot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                >
                  🔗 Open original URL
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
