import { PlanType } from "@prisma/client";

const STARTER_MONTHLY_CREDITS = 1000;
const PRO_MONTHLY_CREDITS = 5000;

export const PLAN_LIMITS: Record<PlanType, {
  maxLeadsPerSearch: number;
  maxEnhancedLeadsPerMonth: number;
  maxEmailDiscoveriesPerMonth: number;
  maxEmailVerificationsPerMonth: number;
}> = {
  [PlanType.STARTER]: {
    maxLeadsPerSearch: 100,
    maxEnhancedLeadsPerMonth: STARTER_MONTHLY_CREDITS,
    maxEmailDiscoveriesPerMonth: STARTER_MONTHLY_CREDITS,
    maxEmailVerificationsPerMonth: Math.floor(STARTER_MONTHLY_CREDITS / 2),
  },
  [PlanType.PRO]: {
    maxLeadsPerSearch: 100,
    maxEnhancedLeadsPerMonth: PRO_MONTHLY_CREDITS,
    maxEmailDiscoveriesPerMonth: PRO_MONTHLY_CREDITS,
    maxEmailVerificationsPerMonth: Math.floor(PRO_MONTHLY_CREDITS / 2),
  },
};

export const ADDON_CREDITS_AMOUNT = 500;
export const ADDON_CREDITS_MONTHS = 3;
