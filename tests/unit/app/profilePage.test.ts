import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/services/creditsService", () => ({
  creditsService: {
    getAddonBalance: vi.fn(),
    getBalance: vi.fn(),
  },
}));

vi.mock("@/lib/polar/profile", () => ({
  reconcileAddonCredits: vi.fn(),
  resolveProfileBillingState: vi.fn(),
}));

vi.mock("@/components/InternalLayoutSetter", () => ({
  default: () => null,
}));

vi.mock("@/components/ProfileTabs", () => ({
  default: () => null,
}));

vi.mock("@/components/ProfileBillingActions", () => ({
  default: () => null,
}));

vi.mock("lucide-react", () => ({
  User: () => null,
}));

import ProfilePage from "@/app/(app)/profile/page";
import { createClient } from "@/lib/supabase/server";
import {
  reconcileAddonCredits,
  resolveProfileBillingState,
} from "@/lib/polar/profile";
import { creditsService } from "@/services/creditsService";

describe("ProfilePage addon reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "user-1@example.com",
              user_metadata: {},
            },
          },
        }),
      },
    } as Awaited<ReturnType<typeof createClient>>);
    vi.mocked(resolveProfileBillingState).mockResolvedValue({
      plan: null,
      subscription: null,
    });
    vi.mocked(creditsService.getBalance).mockResolvedValue(1000);
    vi.mocked(creditsService.getAddonBalance).mockResolvedValue({
      userId: "user-1",
      remaining: 0,
      expiresAt: null,
    });
  });

  it("does not reconcile add-ons on ordinary profile loads when the balance is zero", async () => {
    await ProfilePage({
      searchParams: Promise.resolve({}),
    });

    expect(reconcileAddonCredits).not.toHaveBeenCalled();
    expect(creditsService.getAddonBalance).toHaveBeenCalledTimes(1);
  });

  it("reconciles add-ons after a successful checkout redirect", async () => {
    await ProfilePage({
      searchParams: Promise.resolve({ checkout: "success" }),
    });

    expect(reconcileAddonCredits).toHaveBeenCalledWith(
      "user-1",
      "user-1@example.com",
    );
    expect(creditsService.getAddonBalance).toHaveBeenCalledTimes(2);
  });
});
