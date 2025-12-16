import Link from 'next/link';
import { prisma } from '@/db';

async function getLeads() {
  return prisma.lead.findMany({
    include: {
      decisionMakers: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Generated Leads</h1>

      {leads.length === 0 ? (
        <p className="text-gray-500">No leads generated yet.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Company</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Decision Maker</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Lead Score</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Confidence</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Outreach Stage</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const primaryDM = lead.decisionMakers[0];
              const dmName = primaryDM
                ? `${primaryDM.firstName} ${primaryDM.lastName}`
                : '—';

              return (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    {lead.companyName}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {dmName}
                    {primaryDM?.title && (
                      <span className="text-gray-500 text-sm ml-1">
                        ({primaryDM.title})
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {lead.leadScore ?? '—'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {lead.confidenceScore ?? '—'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className="text-sm">
                      {lead.outreachStage.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
