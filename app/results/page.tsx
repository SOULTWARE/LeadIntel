import { prisma } from "@/db";
import Link from "next/link";

async function getSavedLeads() {
  return prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export default async function ResultsPage() {
  const leads = await getSavedLeads();

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans">
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-bold text-xl tracking-tight text-blue-600">LeadIntel</Link>
            <div className="h-6 w-px bg-slate-200" />
            <h2 className="text-slate-600 font-medium tracking-tight">AI Enhance Results</h2>
          </div>
          <Link href="/scraper" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all">
            New Scrape
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-2xl font-bold text-slate-800">Saved Leads</h3>
            <p className="text-sm text-slate-500">Review and manage your qualified prospects.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Company</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">AI Analysis</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-6 border-slate-100">
                      <div className="font-bold text-slate-800 text-base">{lead.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{lead.type || 'Business'}</div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-sm text-slate-600 mb-1">{lead.address}</div>
                      <div className="flex gap-4">
                        {lead.website && <a href={lead.website} target="_blank" className="text-xs text-blue-500 font-bold hover:underline">Website</a>}
                        {lead.phone && <span className="text-xs text-slate-400">{lead.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-6 max-w-md">
                      {lead.isEnhanced ? (
                        <div className="space-y-3">
                           <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit ${
                            lead.recommendation === 'Highly Recommended' ? 'bg-green-100 text-green-700 border border-green-200' :
                            lead.recommendation === 'Recommended' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {lead.recommendation}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                            "{lead.reasoning}"
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                             {(lead.identifiedProblems as string[] || []).map((problem, i) => (
                               <span key={i} className="bg-red-50 text-red-600 text-[9px] font-black uppercase px-2 py-1 rounded-full border border-red-100">
                                 {problem}
                               </span>
                             ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No AI analysis performed</span>
                      )}
                    </td>
                    <td className="px-6 py-6 text-center">
                       {lead.isEnhanced ? (
                         <div className={`text-2xl font-black ${
                          (lead.compatibilityScore || 0) >= 80 ? 'text-green-600' :
                          (lead.compatibilityScore || 0) >= 50 ? 'text-blue-600' :
                          'text-slate-300'
                        }`}>
                          {lead.compatibilityScore}%
                        </div>
                       ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <div className="text-4xl mb-4 opacity-20">📂</div>
                <p>No results yet. Go to the <Link href="/scraper" className="text-blue-500 underline font-bold">Scraper</Link> to find leads.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
