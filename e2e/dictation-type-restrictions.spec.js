const { test, expect } = require("@playwright/test");

test("user cannot delete a dictation type that is used by a dictation", async function ({ page }) {
    const uniqueId = Date.now();
    const typeName = `E2E Restricted Type ${uniqueId}`;
    const dictationName = `E2E Restricted Dictation ${uniqueId}`;

    const dictationTypesLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictation-types") && response.request().method() === "GET" && response.ok();
    });

    await page.goto("/");
    await dictationTypesLoaded;

    await page.getByRole("button", { name: "Gestisci tipi di dettato" }).click();
    await page.locator("#new-dictation-type").fill(typeName);

    const typeCreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictation-types") && response.request().method() === "POST" && response.ok();
    });

    await page.locator("#add-dictation-type-button").click();
    await typeCreated;

    const typeOption = page.locator("#dictation-type option").filter({ hasText: typeName });
    const typeId = await typeOption.getAttribute("value");

    await page.locator("#dictation-type").selectOption(typeId);
    await page.locator("#dictation-date").fill("2026-09-25");
    await page.locator("#dictation-name").fill(dictationName);
    await page.locator("#youtube-link").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    const dictationCreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "POST" && response.ok();
    });

    await page.locator("#save-button").click();
    await dictationCreated;

    const typeRow = page.locator("#dictation-types-list div").filter({ hasText: typeName });

    // The first dialog is the delete confirmation; the second is the backend 409 error shown as an alert.
    page.once("dialog", async function (dialog) {
        await dialog.accept();
    });

    const deleteRejected = page.waitForResponse(function (response) {
        return response.url().includes("/dictation-types/") && response.request().method() === "DELETE" && response.status() === 409;
    });

    const errorDialog = page.waitForEvent("dialog", {
        predicate: function (dialog) {
            return dialog.type() === "alert";
        }
    });

    await typeRow.getByRole("button", { name: "Rimuovi" }).click();
    await deleteRejected;

    const dialog = await errorDialog;

    expect(dialog.message()).toBe("Non puoi eliminare un tipo utilizzato da dettati o categorie");
    await dialog.accept();

    await expect(page.locator("#dictation-types-list")).toContainText(typeName);

    const savedDictationsLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Dettati salvati" }).click();
    await savedDictationsLoaded;

    const savedDictation = page.locator("#saved-dictations-container details").filter({ hasText: dictationName });

    await savedDictation.locator("summary").click();

    page.once("dialog", async function (dialog) {
        await dialog.accept();
    });

    const dictationDeleted = page.waitForResponse(function (response) {
        return response.url().includes("/dictations/") && response.request().method() === "DELETE" && response.ok();
    });

    await savedDictation.getByRole("button", { name: "Elimina" }).click();
    await dictationDeleted;

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Nuovo dettato" }).click();

    // Cleanup: once the dependent dictation is gone, the type can be deleted normally.
    page.once("dialog", async function (dialog) {
        await dialog.accept();
    });

    const typeDeleted = page.waitForResponse(function (response) {
        return response.url().includes("/dictation-types/") && response.request().method() === "DELETE" && response.ok();
    });

    await typeRow.getByRole("button", { name: "Rimuovi" }).click();
    await typeDeleted;

    await expect(page.locator("#dictation-types-list")).not.toContainText(typeName);
});