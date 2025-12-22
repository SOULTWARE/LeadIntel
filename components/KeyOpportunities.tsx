"use client";

export interface KeyOpportunity {
  issue: string;
  severity: string;
  evidenceExcerpt: string;
  evidenceSnapshotId: string;
  source_url: string;
}

export interface KeyOpportunitiesProps {
  opportunities: KeyOpportunity[];
  onViewEvidence: (snapshotId: string, sourceUrl: string) => void;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-600",
};

export function KeyOpportunities({ opportunities, onViewEvidence }: KeyOpportunitiesProps) {
  if (opportunities.length === 0) {
    return (
      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Key Opportunities</h2>
        <p className="text-sm text-gray-500 italic">No opportunities identified yet</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">
        Key Opportunities ({opportunities.length})
      </h2>

      <div className="space-y-4">
        {opportunities.map((opp, index) => (
          <div
            key={index}
            className="border-l-2 border-blue-400 pl-3 py-1"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-medium text-gray-900">
                {opp.issue}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severityColors[opp.severity] ?? severityColors.medium}`}>
                {opp.severity}
              </span>
            </div>

            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              &ldquo;{opp.evidenceExcerpt}&rdquo;
            </p>

            <div className="flex items-center gap-3">
              <a
                href={opp.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Source ↗
              </a>
              <button
                onClick={() => onViewEvidence(opp.evidenceSnapshotId, opp.source_url)}
                className="text-xs text-gray-600 hover:text-gray-900 font-medium"
              >
                View Evidence
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default KeyOpportunities;
