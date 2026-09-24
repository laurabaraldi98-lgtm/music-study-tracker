const { test, expect } = require("@playwright/test");

test("loads the Music Study Tracker application", async function ({ page }) {
    await page.goto("/");

    await expect(page).toHaveTitle(/Music Study Tracker/i);
    await expect(page.locator("body")).toBeVisible();
});