import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("renders login form and toggles sign up", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(page.getByPlaceholder("name@company.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();

    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  });
});
