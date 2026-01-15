import { PlanType } from "@prisma/client";

import {
  STRIPE_ADDON_PRICE_ID,
  STRIPE_PRO_PRICE_ID,
  STRIPE_STARTER_PRICE_ID,
} from "@/lib/stripe/config";

export function getPlanTypeByPriceId(priceId: string): PlanType | null {
  if (priceId === STRIPE_STARTER_PRICE_ID) return PlanType.STARTER;
  if (priceId === STRIPE_PRO_PRICE_ID) return PlanType.PRO;
  return null;
}

export function isAddonPriceId(priceId: string): boolean {
  return priceId === STRIPE_ADDON_PRICE_ID;
}
