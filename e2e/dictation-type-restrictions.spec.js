const { test, expect } = require("@playwright/test");

test("used dictation type is archived without deleting saved dictations and can be reactivated", async function ({ page }) {
    const uniqueId = Date.now();
    const typeName = `E2E Archived Type ${uniqueId}`;
    const dictationName = `E2E Archived Dictation ${uniqueId}`;

    const dictationTypesLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictation-types") &&
            response.request().method() === "GET" &&
            response.ok();
    });

    await page.goto("/");
    await dictationTypesLoaded;

    // Create a custom dictation type.
    await page.getByRole("button", { name: "Gestisci tipi di dettato" }).click();
    await page.locator("#new-dictation-type").fill(typeName);

    const typeCreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictation-types") &&
            response.request().method() === "POST" &&
            response.status() === 201;
    });

    await page.locator("#add-dictation-type-button").click();
    await typeCreated;

    // Create a dictation that uses the custom type.
    const typeOption = page.locator("#dictation-type option").filter({ hasText: typeName });
    const typeId = await typeOption.getAttribute("value");

    await page.locator("#dictation-type").selectOption(typeId);
    await page.locator("#dictation-date").fill("2026-09-25");
    await page.locator("#dictation-name").fill(dictationName);
    await page.locator("#youtube-link").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    const dictationCreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") &&
            response.request().method() === "POST" &&
            response.ok();
    });

    await page.locator("#save-button").click();
    await dictationCreated;

    // Removing a used type should archive it instead of deleting it.
    const typeRow = page.locator("#dictation-types-list div").filter({ hasText: typeName });

    page.once("dialog", async function (dialog) {
        await dialog.accept();
    });

    const typeArchived = page.waitForResponse(function (response) {
        return response.url().includes("/dictation-types/") &&
            response.request().method() === "DELETE" &&
            response.ok();
    });

    await typeRow.getByRole("button", { name: "Rimuovi" }).click();
    await typeArchived;

    // The archived type should no longer be available for new dictations.
    await expect(page.locator("#dictation-types-list")).not.toContainText(typeName);
    await expect(page.locator("#dictation-type")).not.toContainText(typeName);

    // The existing dictation must remain saved.
    const savedDictationsLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") &&
            response.request().method() === "GET" &&
            response.ok();
    });

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Dettati salvati" }).click();
    await savedDictationsLoaded;

    const savedDictation = page.locator("#saved-dictations-container details").filter({
        hasText: dictationName
    });

    await expect(savedDictation).toHaveCount(1);

    // Creating the same type again should reactivate the archived record.
    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Nuovo dettato" }).click();
    await page.locator("#new-dictation-type").fill(typeName);

    const typeReactivated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictation-types") &&
            response.request().method() === "POST";
    });

    await page.locator("#add-dictation-type-button").click();

    const reactivationResponse = await typeReactivated;

    expect(reactivationResponse.status()).toBe(200);

    await expect(page.locator("#dictation-types-list")).toContainText(typeName);
    await expect(page.locator("#dictation-type")).toContainText(typeName);
});