import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/billing/webhook/route";
import { NextRequest } from "next/server";

vi.mock("@/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/stripe/server", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

describe("/api/billing/webhook", () => {
  it("returns 400 when signature missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/billing/webhook", {
      method: "POST",
      body: "payload",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
