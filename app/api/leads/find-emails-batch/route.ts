import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { jobQueueService } from '@/services/jobQueueService';
import { z } from 'zod';

const FindEmailsBatchRequestSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = FindEmailsBatchRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'No lead IDs provided' }, { status: 400 });
    }

    const { leadIds } = parsed.data;

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
      data: {
        queuedCount: leads.length,
      },
    });
  } catch (error) {
    console.error('[API BatchFindEmails] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
