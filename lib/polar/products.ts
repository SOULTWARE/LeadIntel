import { PlanType } from "@prisma/client";

import {
  POLAR_ADDON_PRODUCT_ID,
  POLAR_PRO_PRODUCT_ID,
  POLAR_STARTER_PRODUCT_ID,
} from "@/lib/polar/config";

export function getPlanTypeByProductId(productId: string): PlanType | null {
  if (productId === POLAR_STARTER_PRODUCT_ID) return PlanType.STARTER;
  if (productId === POLAR_PRO_PRODUCT_ID) return PlanType.PRO;
  return null;
}

export function isAddonProductId(productId: string): boolean {
  return productId === POLAR_ADDON_PRODUCT_ID;
}
