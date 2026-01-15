import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { jobQueueService } from '@/services/jobQueueService';
import { creditsService, InsufficientCreditsError } from '@/services/creditsService';
import { CreditAction, getCreditCost } from '@/lib/credits/costs';
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

    const costPer = getCreditCost(CreditAction.EMAIL_DISCOVER);
    const [balance, addonBalance] = await Promise.all([
      creditsService.getBalance(user.id),
      creditsService.getAddonBalance(user.id),
    ]);
    const totalCredits = balance + addonBalance.remaining;
    if (totalCredits < leads.length * costPer) {
      return NextResponse.json({ success: false, error: 'Insufficient credits' }, { status: 402 });
    }

    const heldKeys: string[] = [];

    try {
      for (const lead of leads) {
        const jobIdempotencyKey = `discover:lead:${lead.id}`;
        await creditsService.createHold({
          userId: user.id,
          action: CreditAction.EMAIL_DISCOVER,
          amount: costPer,
          idempotencyKey: jobIdempotencyKey,
          meta: { leadId: lead.id },
        });
        heldKeys.push(jobIdempotencyKey);

        await jobQueueService.enqueue({
          type: 'EMAIL_DISCOVER',
          idempotencyKey: jobIdempotencyKey,
          payload: { leadId: lead.id },
        });
      }
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        for (const key of heldKeys) {
          await creditsService.releaseHold({
            userId: user.id,
            action: CreditAction.EMAIL_DISCOVER,
            idempotencyKey: key,
          });
        }
        return NextResponse.json({ success: false, error: 'Insufficient credits' }, { status: 402 });
      }
      for (const key of heldKeys) {
        await creditsService.releaseHold({
          userId: user.id,
          action: CreditAction.EMAIL_DISCOVER,
          idempotencyKey: key,
        });
      }
      throw err;
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
