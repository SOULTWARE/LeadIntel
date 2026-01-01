import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { jobQueueService } from '@/services/jobQueueService';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsedParams = ParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json({ success: false, error: 'Invalid lead id' }, { status: 400 });
    }

    const { id } = parsedParams.data;

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    if (lead.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await jobQueueService.enqueue({
      type: 'EMAIL_DISCOVER',
      idempotencyKey: `discover:lead:${id}`,
      payload: { leadId: id },
    });

    return NextResponse.json({
      success: true,
      data: { queued: true },
    });
  } catch (error) {
    console.error('[API FindEmail] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
