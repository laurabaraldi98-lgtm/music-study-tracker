const { test, expect } = require("@playwright/test");

test("user can view a saved dictation in the calendar", async function ({ page }) {
    const uniqueId = Date.now();
    const typeName = `E2E Calendar Type ${uniqueId}`;
    const dictationName = `E2E Calendar Dictation ${uniqueId}`;
    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    const dictationTypesLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictation-types") && response.request().method() === "GET" && response.ok();
    });

    await page.goto("/");
    await dictationTypesLoaded;

    // Use the browser's current date because the calendar initially opens on its current month.
    const currentDate = await page.evaluate(function () {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return {
            inputValue: `${year}-${month}-${day}`,
            day: String(now.getDate()),
            modalDate: `${day}/${month}/${year}`
        };
    });

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
    await page.locator("#dictation-date").fill(currentDate.inputValue);
    await page.locator("#dictation-name").fill(dictationName);
    await page.locator("#youtube-link").fill(youtubeUrl);

    const dictationCreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "POST" && response.ok();
    });

    await page.locator("#save-button").click();
    await dictationCreated;

    const calendarLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Calendario" }).click();
    await calendarLoaded;

    const calendarDay = page.locator(".calendar-day.has-dictation").filter({
        hasText: new RegExp(`^${currentDate.day}$`)
    });

    await expect(calendarDay).toBeVisible();
    await calendarDay.click();

    await expect(page.locator("#calendar-modal")).toBeVisible();
    await expect(page.locator("#calendar-modal-title")).toHaveText(`Dettati del ${currentDate.modalDate}`);

    const modalDictation = page.locator(".calendar-modal-dictation").filter({ hasText: dictationName });

    await expect(modalDictation).toBeVisible();
    await expect(modalDictation).toContainText(typeName);
    await expect(modalDictation).toContainText("Raccolta: Nessuna");
    await expect(modalDictation.getByRole("link", { name: "Apri video" })).toHaveAttribute("href", youtubeUrl);

    await page.getByRole("button", { name: "Chiudi" }).click();

    // Cleanup: remove the dictation created for this test, then remove its type.
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

    const typeRow = page.locator("#dictation-types-list div").filter({ hasText: typeName });

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