import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { jobQueueService } from '@/services/jobQueueService';
import { creditsService, InsufficientCreditsError } from '@/services/creditsService';
import { CreditAction, getCreditCost } from '@/lib/credits/costs';
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

    const jobIdempotencyKey = `discover:lead:${id}`;
    const holdAmount = getCreditCost(CreditAction.EMAIL_DISCOVER);

    try {
      await creditsService.createHold({
        userId: user.id,
        action: CreditAction.EMAIL_DISCOVER,
        amount: holdAmount,
        idempotencyKey: jobIdempotencyKey,
        meta: { leadId: id },
      });
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        return NextResponse.json({ success: false, error: 'Insufficient credits' }, { status: 402 });
      }
      throw err;
    }

    try {
      await jobQueueService.enqueue({
        type: 'EMAIL_DISCOVER',
        idempotencyKey: jobIdempotencyKey,
        payload: { leadId: id },
      });
    } catch (err) {
      try {
        await creditsService.releaseHold({
          userId: user.id,
          action: CreditAction.EMAIL_DISCOVER,
          idempotencyKey: jobIdempotencyKey,
        });
      } catch {}
      throw err;
    }

    return NextResponse.json({
      success: true,
      data: { queued: true },
    });
  } catch (error) {
    console.error('[API FindEmail] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
