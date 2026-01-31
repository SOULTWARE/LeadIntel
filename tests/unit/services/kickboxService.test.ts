import { describe, it, expect, vi, beforeEach } from "vitest";
import { KickboxService } from "@/services/kickboxService";
import { prisma } from "@/db";
import { EmailVerificationStatus } from "@prisma/client";

vi.mock("@/db", () => ({
  prisma: {
    emailVerification: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("KickboxService", () => {
  let service: KickboxService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.KICKBOX_API_KEY = "test-key";
    service = new KickboxService();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("throws when API key is missing", async () => {
    process.env.KICKBOX_API_KEY = "";
    const localService = new KickboxService();

    await expect(localService.verifyEmail("test@example.com")).rejects.toThrow(
      "KICKBOX_API_KEY is missing in environment variables"
    );
  });

  it("returns cached verification when present", async () => {
    vi.mocked(prisma.emailVerification.findUnique).mockResolvedValue({
      email: "test@example.com",
      provider: "kickbox",
      status: EmailVerificationStatus.VALID,
      rawResponseJson: { email: "test@example.com", result: "deliverable" },
    } as unknown as Awaited<ReturnType<typeof prisma.emailVerification.findUnique>>);

    const result = await service.verifyEmail("TEST@example.com");

    expect(result.status).toBe(EmailVerificationStatus.VALID);
    expect(result.normalizedEmail).toBe("test@example.com");
    expect(prisma.emailVerification.create).not.toHaveBeenCalled();
  });

  it("calls Kickbox and stores verification", async () => {
    vi.mocked(prisma.emailVerification.findUnique).mockResolvedValue(null);

    fetchMock.mockResolvedValue({
      status: 200,
      json: async () => ({
        success: true,
        result: "deliverable",
        email: "test@example.com",
        reason: null,
      }),
    });

    const result = await service.verifyEmail("TEST@example.com");

    expect(result.status).toBe(EmailVerificationStatus.VALID);
    expect(result.normalizedEmail).toBe("test@example.com");
    expect(prisma.emailVerification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "test@example.com",
          provider: "kickbox",
          status: EmailVerificationStatus.VALID,
        }),
      })
    );
  });
});
