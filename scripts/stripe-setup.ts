import "dotenv/config";

import Stripe from "stripe";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

async function main() {
  const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"), { typescript: true });

  const starterProduct = await stripe.products.create({
    name: "LeadIntel Starter",
    description: "Starter subscription for LeadIntel Pro",
  });

  const proProduct = await stripe.products.create({
    name: "LeadIntel Pro",
    description: "Pro subscription for LeadIntel Pro",
  });

  const addonProduct = await stripe.products.create({
    name: "LeadIntel Add-on Credits",
    description: "One-time add-on credits (50 credits, 3-month expiry)",
  });

  const starterPrice = await stripe.prices.create({
    product: starterProduct.id,
    currency: "usd",
    unit_amount: 2900,
    recurring: { interval: "month" },
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    currency: "usd",
    unit_amount: 7900,
    recurring: { interval: "month" },
  });

  const addonPrice = await stripe.prices.create({
    product: addonProduct.id,
    currency: "usd",
    unit_amount: 500,
  });

  console.log("Stripe products and prices created:");
  console.log({
    STRIPE_STARTER_PRICE_ID: starterPrice.id,
    STRIPE_PRO_PRICE_ID: proPrice.id,
    STRIPE_ADDON_PRICE_ID: addonPrice.id,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
