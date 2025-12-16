'use client';

import { useState } from 'react';
import Link from 'next/link';

interface GenerationResult {
  success: boolean;
  leads?: Array<{ id: string; companyName: string }>;
  invalidLeads?: Array<{ index: number; errors: string[] }>;
  totalProcessed?: number;
  error?: string;
}

const MAX_PURPOSE_LENGTH = 300;

export default function GeneratePage() {
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [count, setCount] = useState(5);
  const [leadPurpose, setLeadPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const isFormValid = industry.trim() && location.trim() && leadPurpose.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, location, count, leadPurpose: leadPurpose.trim() }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Generate Leads</h1>
          <p className="text-gray-500 text-sm">AI will research leads based on your criteria</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                Industry *
              </label>
              <input
                type="text"
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., SaaS, E-commerce, Healthcare"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., United States, Europe, California"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Leads (1-50)
              </label>
              <input
                type="number"
                id="count"
                value={count}
                onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                min={1}
                max={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="leadPurpose" className="block text-sm font-medium text-gray-700 mb-1">
                Why do you need these leads? *
              </label>
              <textarea
                id="leadPurpose"
                value={leadPurpose}
                onChange={(e) => setLeadPurpose(e.target.value.slice(0, MAX_PURPOSE_LENGTH))}
                placeholder="e.g., I need leads to create websites for, I need leads to sell PWA ordering systems to, I need leads to offer SEO and performance optimization for"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  This helps the AI focus on relevant problems and value propositions.
                </p>
                <span className={`text-xs ${leadPurpose.length >= MAX_PURPOSE_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                  {leadPurpose.length}/{MAX_PURPOSE_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="mt-6 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Leads'}
          </button>
        </form>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">AI is researching leads... This may take a minute.</p>
          </div>
        )}

        {result && (
          <div className={`rounded-lg border p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {result.success ? (
              <>
                <h2 className="font-semibold text-green-800 mb-2">
                  ✓ Generated {result.leads?.length ?? 0} leads
                </h2>
                {result.leads && result.leads.length > 0 && (
                  <ul className="space-y-2">
                    {result.leads.map((lead) => (
                      <li key={lead.id} className="flex justify-between items-center">
                        <span className="text-green-900">{lead.companyName}</span>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View →
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {result.invalidLeads && result.invalidLeads.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm text-yellow-700">
                      {result.invalidLeads.length} lead(s) rejected due to validation errors
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="font-semibold text-red-800 mb-2">Generation Failed</h2>
                <p className="text-red-700 text-sm">{result.error}</p>
                {result.invalidLeads && (
                  <div className="mt-2">
                    {result.invalidLeads.map((invalid, i) => (
                      <div key={i} className="text-sm text-red-600">
                        Lead {invalid.index + 1}: {invalid.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
