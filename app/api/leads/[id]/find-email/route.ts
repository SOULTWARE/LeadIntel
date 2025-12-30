import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { jobQueueService } from '@/services/jobQueueService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await jobQueueService.enqueue({
      type: 'EMAIL_DISCOVER',
      idempotencyKey: `discover:lead:${id}`,
      payload: { leadId: id },
    });

    return NextResponse.json({
      success: true,
      queued: true,
    });
  } catch (error) {
    console.error('[API FindEmail] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
