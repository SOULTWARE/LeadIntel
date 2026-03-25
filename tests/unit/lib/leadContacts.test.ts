import { describe, expect, it } from "vitest";
import { getPrimaryContactCandidate, rankDiscoveredContacts } from "@/lib/leads/contacts";

describe("lead contact ranking", () => {
  it("prioritizes executive aliases when role hints align", () => {
    const ranked = rankDiscoveredContacts({
      emails: ["info@example.com", "ceo@example.com", "hello@example.com"],
      roleHints: ["CEO", "Founder"],
    });

    expect(ranked[0]?.email).toBe("ceo@example.com");
    expect(ranked[0]?.isDecisionMaker).toBe(true);
    expect(ranked[0]?.roleTitle).toBe("CEO");
  });

  it("infers a likely name from a personal pattern", () => {
    const candidate = getPrimaryContactCandidate({
      emails: ["jane.doe@example.com"],
      roleHints: ["Head of Growth"],
    });

    expect(candidate?.fullName).toBe("Jane Doe");
    expect(candidate?.roleTitle).toBe("Head Of Growth");
  });
});
