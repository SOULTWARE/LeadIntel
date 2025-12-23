import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import { contactDiscoveryService } from '@/services/contactDiscoveryService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const emails = await contactDiscoveryService.findEmails(lead.website, {
      name: lead.name,
      address: lead.address || undefined
    });

    if (emails.length > 0) {
      // Use the first found email
      const email = emails[0];

      const updatedLead = await prisma.lead.update({
        where: { id },
        data: { email },
      });

      return NextResponse.json({ success: true, email, lead: updatedLead });
    }

    return NextResponse.json({ success: false, message: 'No emails found' });
  } catch (error) {
    console.error('[API FindEmail] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
