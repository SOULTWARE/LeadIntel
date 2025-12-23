import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import { contactDiscoveryService } from '@/services/contactDiscoveryService';

export async function POST(request: NextRequest) {
  try {
    const { leadIds } = await request.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
    }

    console.log(`[Batch Email Discovery] Starting for ${leadIds.length} leads...`);

    const results = [];

    // Process leads (using a small concurrency limit or sequential for now to avoid being blocked)
    for (const id of leadIds) {
      try {
        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) continue;

        const emails = await contactDiscoveryService.findEmails(lead.website, {
          name: lead.name,
          address: lead.address || undefined
        });

        if (emails.length > 0) {
          const email = emails[0];
          const updatedLead = await prisma.lead.update({
            where: { id },
            data: { email },
          });
          results.push({ id, success: true, email, lead: updatedLead });
        } else {
          results.push({ id, success: false, message: 'No emails found' });
        }
      } catch (err) {
        console.error(`[Batch Email Discovery] Error for lead ${id}:`, err);
        results.push({ id, success: false, error: 'Internal Error' });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[API BatchFindEmails] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
