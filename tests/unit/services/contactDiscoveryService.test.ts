import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

  afterEach(() => {
    vi.unstubAllGlobals();
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
      { value: "Admin@RealBusiness.com" },
      { value: "admin@realbusiness.com" },
      { value: "support@realbusiness.com" },
      { value: "invalid" },
    ] as Awaited<ReturnType<typeof hunterService.domainSearch>>);

    const result = await contactDiscoveryService.findEmails("https://www.RealBusiness.com/about");

    expect(hunterService.domainSearch).toHaveBeenCalledWith("realbusiness.com");
    expect(result).toEqual(["admin@realbusiness.com", "support@realbusiness.com"]);
  });

  it("falls back to scraping the website when Hunter returns no emails", async () => {
    vi.mocked(hunterService.domainSearch).mockResolvedValue([] as never);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `
            <html>
              <body>
                <a href="/contact">Contact</a>
                <a href="mailto:hello@realbusiness.com">Email us</a>
                <p>support@realbusiness.com</p>
              </body>
            </html>
          `,
          {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          }
        )
      )
    );

    const result = await contactDiscoveryService.findEmails("https://www.Example.com/about");

    expect(hunterService.domainSearch).toHaveBeenCalledWith("example.com");
    expect(fetch).toHaveBeenCalled();
    expect(result).toEqual(["hello@realbusiness.com", "support@realbusiness.com"]);
  });

  it("filters placeholder emails from scraped pages", async () => {
    vi.mocked(hunterService.domainSearch).mockResolvedValue([] as never);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `
            <html>
              <body>
                <a href="mailto:user@domain.com">Email us</a>
                <a href="mailto:support@realbusiness.com">Support</a>
              </body>
            </html>
          `,
          {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          }
        )
      )
    );

    const result = await contactDiscoveryService.findEmails("https://www.example.com");

    expect(result).toEqual(["support@realbusiness.com"]);
  });
});
