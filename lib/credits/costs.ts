export const STARTER_INITIAL_CREDITS = 20;
export const PRO_INITIAL_CREDITS = 60;

export type CreditAction =
  | "EMAIL_DISCOVER"
  | "EMAIL_VERIFY"
  | "AI_ENHANCE"
  | "GENERATE_EMAIL"
  | "SCRAPE"
  | "TOPUP";

export function getCreditCost(
  action: CreditAction,
  params?: {
    leadsCount?: number;
    resultsCount?: number;
  }
): number {
  if (action === CreditAction.SCRAPE) {
    return Math.max(0, params?.resultsCount ?? 0);
  }

  if (action === CreditAction.AI_ENHANCE) {
    return Math.max(0, params?.leadsCount ?? 0);
  }

  if (action === CreditAction.TOPUP) {
    return 0;
  }

  return 1;
}

export const CreditAction = {
  EMAIL_DISCOVER: "EMAIL_DISCOVER" as const,
  EMAIL_VERIFY: "EMAIL_VERIFY" as const,
  AI_ENHANCE: "AI_ENHANCE" as const,
  GENERATE_EMAIL: "GENERATE_EMAIL" as const,
  SCRAPE: "SCRAPE" as const,
  TOPUP: "TOPUP" as const,
};
