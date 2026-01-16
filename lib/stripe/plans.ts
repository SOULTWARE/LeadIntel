import { PlanType } from "@prisma/client";

const MAX_MONTHLY_CREDITS = 1000;

export const PLAN_LIMITS: Record<PlanType, {
  maxLeadsPerSearch: number;
  maxEnhancedLeadsPerMonth: number;
  maxEmailDiscoveriesPerMonth: number;
  maxEmailVerificationsPerMonth: number;
}> = {
  [PlanType.STARTER]: {
    maxLeadsPerSearch: 100,
    maxEnhancedLeadsPerMonth: MAX_MONTHLY_CREDITS,
    maxEmailDiscoveriesPerMonth: MAX_MONTHLY_CREDITS,
    maxEmailVerificationsPerMonth: Math.floor(MAX_MONTHLY_CREDITS / 2),
  },
  [PlanType.PRO]: {
    maxLeadsPerSearch: 100,
    maxEnhancedLeadsPerMonth: MAX_MONTHLY_CREDITS,
    maxEmailDiscoveriesPerMonth: MAX_MONTHLY_CREDITS,
    maxEmailVerificationsPerMonth: Math.floor(MAX_MONTHLY_CREDITS / 2),
  },
};

export const ADDON_CREDITS_AMOUNT = 50;
export const ADDON_CREDITS_MONTHS = 3;
