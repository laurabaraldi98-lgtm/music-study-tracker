const { test, expect } = require("@playwright/test");

test("user can create and delete a collection", async function ({ page }) {
    const collectionName = `E2E Collection ${Date.now()}`;

    await page.goto("/");

    await page.getByRole("button", { name: "Gestisci raccolte" }).click();

    await page.locator("#new-collection").fill(collectionName);
    await page.getByRole("button", { name: "Aggiungi", exact: true }).click();

    await expect(
        page.locator("#dictation-collection")
    ).toHaveValue(collectionName);

    await expect(
        page.locator("#collections-list")
    ).toContainText(collectionName);

    page.once("dialog", async function (dialog) {
        await dialog.accept();
    });

    const collectionRow = page.locator("#collections-list div").filter({
        hasText: collectionName
    });

    await collectionRow.getByRole("button", { name: "Rimuovi" }).click();

    await expect(
        page.locator("#collections-list")
    ).not.toContainText(collectionName);
});