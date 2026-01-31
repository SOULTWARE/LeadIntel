import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("shows hero and primary actions", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Verified business data", { exact: false })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View Pricing" })).toBeVisible();
  });
});
