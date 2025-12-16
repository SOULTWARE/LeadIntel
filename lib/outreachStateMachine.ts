import { prisma } from '@/db';
import { OutreachStage } from '@prisma/client';

const FOLLOW_UP_DELAY_DAYS = 3;

const STAGE_TRANSITIONS: Record<OutreachStage, OutreachStage | null> = {
  NOT_CONTACTED: OutreachStage.FIRST_EMAIL_SENT,
  FIRST_EMAIL_SENT: OutreachStage.FOLLOW_UP_1_SENT,
  FOLLOW_UP_1_SENT: OutreachStage.FOLLOW_UP_2_SENT,
  FOLLOW_UP_2_SENT: OutreachStage.NO_RESPONSE,
  HOT_LEAD: null,
  NO_RESPONSE: null,
};

export interface StageTransitionResult {
  success: boolean;
  leadId: string;
  previousStage: OutreachStage;
  newStage: OutreachStage;
  error?: string;
}

async function getLead(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      outreachStage: true,
      updatedAt: true,
    },
  });

  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  return lead;
}

function daysSinceLastUpdate(updatedAt: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - updatedAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function canAdvanceWithDelay(currentStage: OutreachStage, daysSinceUpdate: number): boolean {
  if (currentStage === OutreachStage.FIRST_EMAIL_SENT ||
      currentStage === OutreachStage.FOLLOW_UP_1_SENT) {
    return daysSinceUpdate >= FOLLOW_UP_DELAY_DAYS;
  }
  return true;
}

export async function advanceStage(leadId: string): Promise<StageTransitionResult> {
  const lead = await getLead(leadId);
  const previousStage = lead.outreachStage;

  const nextStage = STAGE_TRANSITIONS[previousStage];

  if (nextStage === null) {
    return {
      success: false,
      leadId,
      previousStage,
      newStage: previousStage,
      error: `Cannot advance from ${previousStage} — terminal state`,
    };
  }

  const daysSinceUpdate = daysSinceLastUpdate(lead.updatedAt);

  if (!canAdvanceWithDelay(previousStage, daysSinceUpdate)) {
    const daysRemaining = FOLLOW_UP_DELAY_DAYS - daysSinceUpdate;
    return {
      success: false,
      leadId,
      previousStage,
      newStage: previousStage,
      error: `Cannot advance yet — wait ${daysRemaining} more day(s)`,
    };
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { outreachStage: nextStage },
  });

  console.log(`[OutreachStateMachine] Lead ${leadId}: ${previousStage} -> ${nextStage}`);

  return {
    success: true,
    leadId,
    previousStage,
    newStage: nextStage,
  };
}

export async function markHotLead(leadId: string): Promise<StageTransitionResult> {
  const lead = await getLead(leadId);
  const previousStage = lead.outreachStage;

  if (previousStage === OutreachStage.HOT_LEAD) {
    return {
      success: false,
      leadId,
      previousStage,
      newStage: previousStage,
      error: 'Lead is already marked as HOT_LEAD',
    };
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { outreachStage: OutreachStage.HOT_LEAD },
  });

  console.log(`[OutreachStateMachine] Lead ${leadId}: ${previousStage} -> HOT_LEAD (manual)`);

  return {
    success: true,
    leadId,
    previousStage,
    newStage: OutreachStage.HOT_LEAD,
  };
}

export async function markNoResponse(leadId: string): Promise<StageTransitionResult> {
  const lead = await getLead(leadId);
  const previousStage = lead.outreachStage;

  if (previousStage === OutreachStage.NO_RESPONSE) {
    return {
      success: false,
      leadId,
      previousStage,
      newStage: previousStage,
      error: 'Lead is already marked as NO_RESPONSE',
    };
  }

  if (previousStage === OutreachStage.NOT_CONTACTED) {
    return {
      success: false,
      leadId,
      previousStage,
      newStage: previousStage,
      error: 'Cannot mark as NO_RESPONSE — lead has not been contacted yet',
    };
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: { outreachStage: OutreachStage.NO_RESPONSE },
  });

  console.log(`[OutreachStateMachine] Lead ${leadId}: ${previousStage} -> NO_RESPONSE`);

  return {
    success: true,
    leadId,
    previousStage,
    newStage: OutreachStage.NO_RESPONSE,
  };
}

export function getNextStage(currentStage: OutreachStage): OutreachStage | null {
  return STAGE_TRANSITIONS[currentStage];
}

export function isTerminalState(stage: OutreachStage): boolean {
  return STAGE_TRANSITIONS[stage] === null;
}

export { OutreachStage };
