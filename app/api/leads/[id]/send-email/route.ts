import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/db';
import { advanceStage } from '@/lib/outreachStateMachine';

const requestSchema = z.object({
  emailDraftId: z.string().uuid('Invalid email draft ID'),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: leadId } = await params;

    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 422 }
      );
    }

    const { emailDraftId } = validation.data;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, outreachStage: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const emailDraft = await prisma.emailDraft.findUnique({
      where: { id: emailDraftId },
      select: { id: true, leadId: true, status: true, sentAt: true },
    });

    if (!emailDraft) {
      return NextResponse.json(
        { error: 'Email draft not found' },
        { status: 404 }
      );
    }

    if (emailDraft.leadId !== leadId) {
      return NextResponse.json(
        { error: 'Email draft does not belong to this lead' },
        { status: 400 }
      );
    }

    if (emailDraft.sentAt) {
      return NextResponse.json(
        { error: 'Email has already been marked as sent' },
        { status: 400 }
      );
    }

    const sentAt = new Date();

    await prisma.emailDraft.update({
      where: { id: emailDraftId },
      data: {
        status: 'sent',
        sentAt,
      },
    });

    const stageResult = await advanceStage(leadId);

    console.log(
      `[API /api/leads/${leadId}/send-email] Email ${emailDraftId} marked as sent at ${sentAt.toISOString()}`
    );

    return NextResponse.json({
      success: true,
      emailDraftId,
      sentAt: sentAt.toISOString(),
      stageTransition: {
        success: stageResult.success,
        previousStage: stageResult.previousStage,
        newStage: stageResult.newStage,
        error: stageResult.error,
      },
    });
  } catch (error) {
    console.error('[API /api/leads/[id]/send-email] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
