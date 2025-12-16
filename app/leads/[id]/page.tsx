import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/db';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getLead(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      decisionMakers: {
        include: {
          contacts: true,
        },
      },
      issues: {
        include: {
          sourceEvidence: true,
        },
      },
      emailDrafts: {
        orderBy: { version: 'desc' },
      },
    },
  });
}

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  const value = score ?? 0;
  const color =
    value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{score ?? '—'}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded h-2">
        <div className={`${color} h-2 rounded`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function getScoreExplanation(score: number | null): string {
  if (score === null) return 'No score available';
  if (score >= 80) return 'Excellent fit — high priority lead with strong signals';
  if (score >= 60) return 'Good fit — promising lead worth pursuing';
  if (score >= 40) return 'Moderate fit — may require more research';
  if (score >= 20) return 'Low fit — limited signals detected';
  return 'Poor fit — unlikely to convert';
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const lead = await getLead(id);

  if (!lead) {
    notFound();
  }

  const quickWins = lead.issues.filter(
    (issue) => issue.severity === 'high' || issue.severity === 'critical'
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href="/leads" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Leads
      </Link>

      {/* Company Header */}
      <div className="border border-gray-300 rounded p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{lead.companyName}</h1>
        {lead.website && (
          <a
            href={lead.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            {lead.website}
          </a>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-500">Industry:</span>{' '}
            <span className="font-medium">{lead.industry ?? '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Location:</span>{' '}
            <span className="font-medium">{lead.location ?? '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Employees:</span>{' '}
            <span className="font-medium">{lead.employeeCount ?? '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Stage:</span>{' '}
            <span className="font-medium">{lead.outreachStage.replace(/_/g, ' ')}</span>
          </div>
        </div>
        {lead.description && (
          <p className="mt-4 text-gray-600 text-sm">{lead.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Scores */}
        <div className="border border-gray-300 rounded p-4">
          <h2 className="font-bold mb-4">Scores</h2>
          <ScoreBar score={lead.leadScore} label="Lead Score" />
          <p className="text-xs text-gray-500 mb-4">{getScoreExplanation(lead.leadScore)}</p>
          <ScoreBar score={lead.confidenceScore} label="Confidence" />
          <p className="text-xs text-gray-500">
            {lead.confidenceScore !== null && lead.confidenceScore >= 70
              ? 'High confidence in data accuracy'
              : 'Some claims may need verification'}
          </p>
        </div>

        {/* Decision Makers */}
        <div className="border border-gray-300 rounded p-4 md:col-span-2">
          <h2 className="font-bold mb-4">Decision Makers</h2>
          {lead.decisionMakers.length === 0 ? (
            <p className="text-gray-500 text-sm">No decision makers identified</p>
          ) : (
            <div className="space-y-4">
              {lead.decisionMakers.map((dm) => (
                <div key={dm.id} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="font-medium">
                    {dm.firstName} {dm.lastName}
                  </div>
                  {dm.title && <div className="text-sm text-gray-500">{dm.title}</div>}
                  {dm.role && <div className="text-xs text-gray-400">{dm.role}</div>}
                  {dm.contacts.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {dm.contacts.map((contact) => (
                        <div key={contact.id} className="text-sm flex items-center gap-2">
                          <span className="text-gray-500 uppercase text-xs w-16">
                            {contact.type}:
                          </span>
                          <span>{contact.value}</span>
                          {contact.isVerified && (
                            <span className="text-green-600 text-xs">✓ Verified</span>
                          )}
                          {contact.isPrimary && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-1 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="border border-green-300 bg-green-50 rounded p-4 mb-6">
          <h2 className="font-bold text-green-800 mb-3">🎯 Recommended Quick Wins</h2>
          <ul className="list-disc list-inside space-y-1">
            {quickWins.map((issue) => (
              <li key={issue.id} className="text-sm text-green-900">
                {issue.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Issues with Evidence */}
      <div className="border border-gray-300 rounded p-4 mb-6">
        <h2 className="font-bold mb-4">Identified Issues & Evidence</h2>
        <p className="text-xs text-gray-500 mb-4">
          ⚠️ Verify each claim by clicking the source link
        </p>
        {lead.issues.length === 0 ? (
          <p className="text-gray-500 text-sm">No issues identified</p>
        ) : (
          <div className="space-y-4">
            {lead.issues.map((issue) => (
              <div key={issue.id} className="border-l-4 border-gray-300 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium">{issue.title}</h3>
                  {issue.severity && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        issue.severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : issue.severity === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : issue.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  )}
                </div>
                {issue.description && (
                  <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                )}
                {issue.category && (
                  <span className="text-xs text-gray-400">Category: {issue.category}</span>
                )}

                {/* Evidence */}
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1 font-medium">
                    📄 Evidence ({issue.sourceEvidence.sourceType})
                  </div>
                  {issue.sourceEvidence.snippet && (
                    <blockquote className="text-sm italic text-gray-700 border-l-2 border-gray-300 pl-2 my-2">
                      "{issue.sourceEvidence.snippet}"
                    </blockquote>
                  )}
                  {issue.sourceEvidence.sourceUrl && (
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

      {/* Proposed Value Prop */}
      {lead.issues.length > 0 && (
        <div className="border border-blue-300 bg-blue-50 rounded p-4 mb-6">
          <h2 className="font-bold text-blue-800 mb-3">💡 Proposed Value Proposition</h2>
          <p className="text-sm text-blue-900">
            Based on {lead.issues.length} identified issue(s), focus outreach on solving:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {lead.issues.slice(0, 3).map((issue) => (
              <li key={issue.id} className="text-sm text-blue-800">
                {issue.title}
                {issue.severity === 'critical' || issue.severity === 'high'
                  ? ' — high impact opportunity'
                  : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Email Drafts */}
      <div className="border border-gray-300 rounded p-4">
        <h2 className="font-bold mb-4">Email Drafts</h2>
        {lead.emailDrafts.length === 0 ? (
          <p className="text-gray-500 text-sm">No email drafts generated</p>
        ) : (
          <div className="space-y-4">
            {lead.emailDrafts.map((draft) => (
              <div key={draft.id} className="border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs text-gray-500">Version {draft.version}</span>
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded ${
                        draft.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : draft.status === 'sent'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {draft.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {draft.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <div className="font-medium mb-2">Subject: {draft.subject}</div>
                <pre className="text-sm whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded">
                  {draft.body}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
