import Link from 'next/link';
import { prisma } from '@/db';

async function getStats() {
  const [totalLeads, hotLeads, pendingOutreach] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { outreachStage: 'HOT_LEAD' } }),
    prisma.lead.count({ where: { outreachStage: 'NOT_CONTACTED' } }),
  ]);

  return { totalLeads, hotLeads, pendingOutreach };
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Lead Intel</h1>
          <p className="text-gray-500 text-sm">AI-powered lead generation & outreach</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-gray-900">{stats.totalLeads}</div>
            <div className="text-sm text-gray-500">Total Leads</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-green-600">{stats.hotLeads}</div>
            <div className="text-sm text-gray-500">Hot Leads</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.pendingOutreach}</div>
            <div className="text-sm text-gray-500">Pending Outreach</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/leads"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              View All Leads
            </Link>
            <Link
              href="/generate"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Generate New Leads
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">1. Generate</div>
              <p className="text-gray-500">AI researches leads based on industry & location</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">2. Verify</div>
              <p className="text-gray-500">Review evidence & source links for each claim</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">3. Outreach</div>
              <p className="text-gray-500">Send emails manually from Gmail</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">4. Track</div>
              <p className="text-gray-500">Mark responses & advance outreach stages</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
