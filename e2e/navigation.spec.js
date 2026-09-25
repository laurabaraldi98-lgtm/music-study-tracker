const { test, expect } = require("@playwright/test");

test("authenticated user can navigate through the main sections", async function ({ page }) {
    await page.goto("/");

    await expect(page.locator("#new-dictation-section")).toBeVisible();

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Dettati salvati" }).click();
    await expect(page.locator("#saved-dictations-section")).toBeVisible();

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Calendario" }).click();
    await expect(page.locator("#calendar-section")).toBeVisible();

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Report progressi" }).click();
    await expect(page.locator("#practice-report-section")).toBeVisible();

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Nuovo dettato" }).click();
    await expect(page.locator("#new-dictation-section")).toBeVisible();
});