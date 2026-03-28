import { describe, expect, it } from "vitest";
import { isProtectedAppPath, publicSitePaths } from "@/lib/routing";

describe("isProtectedAppPath", () => {
  it("protects workspace routes", () => {
    expect(isProtectedAppPath("/results")).toBe(true);
    expect(isProtectedAppPath("/results/history")).toBe(true);
    expect(isProtectedAppPath("/profile")).toBe(true);
    expect(isProtectedAppPath("/sourcer")).toBe(true);
  });

  it("leaves marketing routes public", () => {
    for (const path of publicSitePaths) {
      expect(isProtectedAppPath(path)).toBe(false);
    }

    expect(isProtectedAppPath("/blog/how-to-find-b2b-leads")).toBe(false);
    expect(
      isProtectedAppPath("/blog/best-lead-generation-tools-agencies"),
    ).toBe(false);
  });

  it("does not overmatch similar prefixes", () => {
    expect(isProtectedAppPath("/results-archive")).toBe(false);
    expect(isProtectedAppPath("/profiled")).toBe(false);
    expect(isProtectedAppPath("/sourcery")).toBe(false);
  });
});
