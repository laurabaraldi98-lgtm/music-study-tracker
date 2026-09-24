const { test, expect } = require("@playwright/test");

test("authenticated user can access the app", async function ({ page }) {
    await page.goto("/");

    await expect(page.locator("#app-container")).toBeVisible();
    await expect(
        page.getByRole("heading", { name: "Music Study Tracker" })
    ).toBeVisible();
});