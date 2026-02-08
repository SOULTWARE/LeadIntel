import { prisma } from "@/db";
import { polar } from "@/lib/polar/server";

export async function getOrCreatePolarCustomer(input: {
  userId: string;
  email?: string | null;
}): Promise<string> {
  const existing = await prisma.polarCustomer.findUnique({
    where: { userId: input.userId },
  });

  if (existing) return existing.customerId;

  const customer = await polar.customers.create({
    email: input.email || "unknown@placeholder.local",
    externalId: input.userId,
  });

  await prisma.polarCustomer.create({
    data: {
      userId: input.userId,
      customerId: customer.id,
    },
  });

  return customer.id;
}

export async function getPolarCustomerIdByUserId(userId: string): Promise<string | null> {
  const existing = await prisma.polarCustomer.findUnique({ where: { userId } });
  return existing?.customerId ?? null;
}

export async function getUserIdByPolarCustomerId(customerId: string): Promise<string | null> {
  const existing = await prisma.polarCustomer.findUnique({ where: { customerId } });
  return existing?.userId ?? null;
}

export async function getUserIdByExternalId(externalId: string): Promise<string> {
  return externalId;
}
