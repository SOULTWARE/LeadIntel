import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { jobQueueService } from '@/services/jobQueueService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadIds } = await request.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
    }

    console.log(`[Batch Email Discovery] Starting for ${leadIds.length} leads...`);

    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        userId: user.id,
      },
      select: { id: true },
    });

    for (const lead of leads) {
      await jobQueueService.enqueue({
        type: 'EMAIL_DISCOVER',
        idempotencyKey: `discover:lead:${lead.id}`,
        payload: { leadId: lead.id },
      });
    }

    return NextResponse.json({
      success: true,
      queuedCount: leads.length,
    });
  } catch (error) {
    console.error('[API BatchFindEmails] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
