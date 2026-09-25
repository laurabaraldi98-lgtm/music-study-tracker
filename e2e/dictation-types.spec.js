const { test, expect } = require("@playwright/test");

test("user can create and delete a custom dictation type", async function ({ page }) {
    const dictationTypeName = `E2E Type ${Date.now()}`;

    const dictationTypesLoaded = page.waitForResponse(function (response) {
        return (
            response.url().endsWith("/dictation-types") &&
            response.request().method() === "GET" &&
            response.ok()
        );
    });

    await page.goto("/");
    await dictationTypesLoaded;

    await page.getByRole("button", { name: "Gestisci tipi di dettato" }).click();

    await page.locator("#new-dictation-type").fill(dictationTypeName);

    await page.locator("#add-dictation-type-button").click();

    await expect(
        page.locator("#dictation-types-list")
    ).toContainText(dictationTypeName);

    await expect(
        page.locator("#dictation-type")
    ).toHaveValue(
        await page
            .locator("#dictation-type option")
            .filter({ hasText: dictationTypeName })
            .getAttribute("value")
    );

    const typeRow = page.locator("#dictation-types-list div").filter({
        hasText: dictationTypeName
    });

    page.once("dialog", async function (dialog) {
        await dialog.accept();
    });

    await typeRow.getByRole("button", { name: "Rimuovi" }).click();

    await expect(
        page.locator("#dictation-types-list")
    ).not.toContainText(dictationTypeName);

    await expect(
        page.locator("#dictation-type")
    ).not.toContainText(dictationTypeName);
});