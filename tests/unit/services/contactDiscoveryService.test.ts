import { describe, it, expect, vi, beforeEach } from "vitest";
import { contactDiscoveryService } from "@/services/contactDiscoveryService";
import { hunterService } from "@/services/hunterService";

vi.mock("@/services/hunterService", () => ({
  hunterService: {
    domainSearch: vi.fn(),
  },
}));

describe("ContactDiscoveryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty list when url is null", async () => {
    const result = await contactDiscoveryService.findEmails(null);
    expect(result).toEqual([]);
    expect(hunterService.domainSearch).not.toHaveBeenCalled();
  });

  it("returns empty list for invalid url", async () => {
    const result = await contactDiscoveryService.findEmails("not a url");
    expect(result).toEqual([]);
    expect(hunterService.domainSearch).not.toHaveBeenCalled();
  });

  it("normalizes hostname and returns unique lowercased emails", async () => {
    vi.mocked(hunterService.domainSearch).mockResolvedValue([
      { value: "Admin@Example.com" },
      { value: "admin@example.com" },
      { value: "support@example.com" },
      { value: "invalid" },
    ] as Awaited<ReturnType<typeof hunterService.domainSearch>>);

    const result = await contactDiscoveryService.findEmails("https://www.Example.com/about");

    expect(hunterService.domainSearch).toHaveBeenCalledWith("example.com");
    expect(result).toEqual(["admin@example.com", "support@example.com"]);
  });
});
