const { test, expect } = require("@playwright/test");

test("user can view practice statistics for saved dictations", async function ({ page }) {
    const uniqueId = Date.now();
    const typeName = `E2E Report Type ${uniqueId}`;
    const categoryA = `E2E Report Category A ${uniqueId}`;
    const categoryB = `E2E Report Category B ${uniqueId}`;
    const dictationName = `E2E Report Dictation ${uniqueId}`;
    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

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
    await page.getByRole("button", { name: "Gestisci categorie" }).click();

    for (const categoryName of [categoryA, categoryB]) {
        await page.locator("#new-category").fill(categoryName);

        const categoryCreated = page.waitForResponse(function (response) {
            return response.url().endsWith("/categories") && response.request().method() === "POST" && response.ok();
        });

        await page.locator("#add-category-button").click();
        await categoryCreated;
    }

    const categoryARow = page.locator("#categories-container div").filter({ hasText: categoryA });
    const categoryBRow = page.locator("#categories-container div").filter({ hasText: categoryB });

    await categoryARow.locator('input[type="checkbox"]').check();
    await expect(categoryBRow.locator('input[type="checkbox"]')).not.toBeChecked();

    await page.locator("#dictation-date").fill("2026-09-25");
    await page.locator("#dictation-name").fill(dictationName);
    await page.locator("#youtube-link").fill(youtubeUrl);

    const dictationCreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "POST" && response.ok();
    });

    await page.locator("#save-button").click();
    await dictationCreated;

    const reportLoaded = page.waitForResponse(function (response) {
        return response.url().includes("/statistics/report") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Report progressi" }).click();
    await reportLoaded;

    // Use the full period so the assertion does not depend on the current month.
    const allPeriodLoaded = page.waitForResponse(function (response) {
        return response.url().includes("/statistics/report") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#practice-report-period").selectOption("all");
    await allPeriodLoaded;

    // Filter by the unique test type so existing E2E data cannot affect the totals.
    const filteredReportLoaded = page.waitForResponse(function (response) {
        return response.url().includes("/statistics/report") && response.url().includes(`dictationTypeId=${typeId}`) && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#practice-report-type").selectOption(typeId);
    await filteredReportLoaded;

    const summaryCards = page.locator("#practice-report-summary .practice-report-summary-card");

    await expect(summaryCards).toHaveCount(4);
    await expect(summaryCards.nth(0)).toContainText("1");
    await expect(summaryCards.nth(0)).toContainText("Dettati");
    await expect(summaryCards.nth(1)).toContainText("2");
    await expect(summaryCards.nth(1)).toContainText("Categorie valutate");
    await expect(summaryCards.nth(2)).toContainText("1");
    await expect(summaryCards.nth(2)).toContainText("Corrette");
    await expect(summaryCards.nth(3)).toContainText("50%");
    await expect(summaryCards.nth(3)).toContainText("Accuratezza");

    await expect(page.locator("#practice-report-types")).toContainText(typeName);
    await expect(page.locator("#practice-report-types")).toContainText("50%");

    // Cleanup: remove the test dictation first, then its categories and type.
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
    await page.locator("#dictation-type").selectOption(typeId);

    if (await page.locator("#category-manager").isHidden()) {
        await page.getByRole("button", { name: "Gestisci categorie" }).click();
    }

    for (const categoryName of [categoryA, categoryB]) {
        const categoryRow = page.locator("#categories-container div").filter({ hasText: categoryName });

        page.once("dialog", async function (dialog) {
            await dialog.accept();
        });

        const categoryDeleted = page.waitForResponse(function (response) {
            return response.url().includes("/categories/") && response.request().method() === "DELETE" && response.ok();
        });

        await categoryRow.getByRole("button", { name: "Rimuovi" }).click();
        await categoryDeleted;
    }

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