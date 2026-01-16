export const STRIPE_SUCCESS_URL =
  process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/profile?checkout=success";
export const STRIPE_CANCEL_URL =
  process.env.STRIPE_CANCEL_URL || "http://localhost:3000/profile?checkout=cancel";
export const STRIPE_PORTAL_RETURN_URL =
  process.env.STRIPE_PORTAL_RETURN_URL || "http://localhost:3000/profile";

export const STRIPE_STARTER_PRICE_ID = process.env.STRIPE_STARTER_PRICE_ID || "";
export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "";
export const STRIPE_ADDON_PRICE_ID = process.env.STRIPE_ADDON_PRICE_ID || "";
