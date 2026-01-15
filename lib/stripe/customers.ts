import { prisma } from "@/db";
import { stripe } from "@/lib/stripe/server";

export async function getOrCreateStripeCustomer(input: {
  userId: string;
  email?: string | null;
}): Promise<string> {
  const existing = await (prisma as any).stripeCustomer.findUnique({
    where: { userId: input.userId },
  });

  if (existing) return existing.customerId;

  const customer = await stripe.customers.create({
    email: input.email || undefined,
    metadata: { userId: input.userId },
  });

  await (prisma as any).stripeCustomer.create({
    data: {
      userId: input.userId,
      customerId: customer.id,
    },
  });

  return customer.id;
}

export async function getStripeCustomerIdByUserId(userId: string): Promise<string | null> {
  const existing = await (prisma as any).stripeCustomer.findUnique({ where: { userId } });
  return existing?.customerId ?? null;
}

export async function getUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  const existing = await (prisma as any).stripeCustomer.findUnique({ where: { customerId } });
  return existing?.userId ?? null;
}
