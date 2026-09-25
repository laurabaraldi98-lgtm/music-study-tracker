const { test, expect } = require("@playwright/test");

test("user can filter the practice report by collection and custom date range", async function ({ page }) {
    const uniqueId = Date.now();
    const collectionA = `E2E Report Collection A ${uniqueId}`;
    const collectionB = `E2E Report Collection B ${uniqueId}`;
    const typeName = `E2E Report Filter Type ${uniqueId}`;
    const dictationA = `E2E Report Filter Dictation A ${uniqueId}`;
    const dictationB = `E2E Report Filter Dictation B ${uniqueId}`;
    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    const collectionsLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/collections") && response.request().method() === "GET" && response.ok();
    });

    const dictationTypesLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictation-types") && response.request().method() === "GET" && response.ok();
    });

    await page.goto("/");
    await Promise.all([collectionsLoaded, dictationTypesLoaded]);

    await page.getByRole("button", { name: "Gestisci raccolte" }).click();

    for (const collectionName of [collectionA, collectionB]) {
        await page.locator("#new-collection").fill(collectionName);

        const collectionCreated = page.waitForResponse(function (response) {
            return response.url().endsWith("/collections") && response.request().method() === "POST" && response.ok();
        });

        await page.locator("#add-collection-button").click();
        await collectionCreated;
    }

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
    await page.locator("#dictation-collection").selectOption({ label: collectionA });
    await page.locator("#dictation-date").fill("2026-01-10");
    await page.locator("#dictation-name").fill(dictationA);
    await page.locator("#youtube-link").fill(youtubeUrl);

    const dictationACreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "POST" && response.ok();
    });

    await page.locator("#save-button").click();
    await dictationACreated;

    await page.locator("#dictation-type").selectOption(typeId);
    await page.locator("#dictation-collection").selectOption({ label: collectionB });
    await page.locator("#dictation-date").fill("2026-02-10");
    await page.locator("#dictation-name").fill(dictationB);
    await page.locator("#youtube-link").fill(youtubeUrl);

    const dictationBCreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "POST" && response.ok();
    });

    await page.locator("#save-button").click();
    await dictationBCreated;

    const reportLoaded = page.waitForResponse(function (response) {
        return response.url().includes("/statistics/report") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Report progressi" }).click();
    await reportLoaded;

    const allPeriodLoaded = page.waitForResponse(function (response) {
        return response.url().includes("/statistics/report") && response.url().includes("period=all") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#practice-report-period").selectOption("all");
    await allPeriodLoaded;

    const typeFiltered = page.waitForResponse(function (response) {
        return response.url().includes("/statistics/report") && response.url().includes(`dictationTypeId=${typeId}`) && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#practice-report-type").selectOption(typeId);
    await typeFiltered;

    const summaryCards = page.locator("#practice-report-summary .practice-report-summary-card");

    await expect(summaryCards.nth(0)).toContainText("2");

    const collectionFiltered = page.waitForResponse(function (response) {
        const url = new URL(response.url());

        return url.pathname.endsWith("/statistics/report") &&
            url.searchParams.get("collection") === collectionA &&
            url.searchParams.get("dictationTypeId") === typeId &&
            response.request().method() === "GET" &&
            response.ok();
    });

    await page.locator("#practice-report-collection").selectOption({ label: collectionA });
    await collectionFiltered;

    await expect(summaryCards.nth(0)).toContainText("1");

    const collectionReset = page.waitForResponse(function (response) {
        return response.url().includes("/statistics/report") && !response.url().includes("collection=") && response.url().includes(`dictationTypeId=${typeId}`) && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#practice-report-collection").selectOption("");
    await collectionReset;

    await page.locator("#practice-report-period").selectOption("custom");
    await expect(page.locator("#practice-report-custom-period")).toBeVisible();

    await page.locator("#practice-report-from").fill("2026-01-01");

    const customPeriodLoaded = page.waitForResponse(function (response) {
        return response.url().includes("/statistics/report") &&
            response.url().includes("period=custom") &&
            response.url().includes("from=2026-01-01") &&
            response.url().includes("to=2026-01-31") &&
            response.url().includes(`dictationTypeId=${typeId}`) &&
            response.request().method() === "GET" &&
            response.ok();
    });

    await page.locator("#practice-report-to").fill("2026-01-31");
    await customPeriodLoaded;

    await expect(summaryCards.nth(0)).toContainText("1");

    // Cleanup: remove both dictations before deleting their shared type and collections.
    const savedDictationsLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Dettati salvati" }).click();
    await savedDictationsLoaded;

    for (const dictationName of [dictationA, dictationB]) {
        const savedDictation = page.locator("#saved-dictations-container details").filter({ hasText: dictationName });
        await savedDictation.locator("summary").click();

        page.once("dialog", async function (dialog) {
            await dialog.accept();
        });

        const dictationDeleted = page.waitForResponse(function (response) {
            return response.url().includes("/dictations/") && response.request().method() === "DELETE" && response.ok();
        });

        const savedDictationsRefreshed = page.waitForResponse(function (response) {
            return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
        });

        await savedDictation.getByRole("button", { name: "Elimina" }).click();
        await dictationDeleted;
        await savedDictationsRefreshed;
        await expect(page.locator("#saved-dictations-container")).not.toContainText(dictationName);
    }

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

    for (const collectionName of [collectionA, collectionB]) {
        const collectionRow = page.locator("#collections-list div").filter({ hasText: collectionName });

        page.once("dialog", async function (dialog) {
            await dialog.accept();
        });

        const collectionDeleted = page.waitForResponse(function (response) {
            return response.url().includes("/collections/") && response.request().method() === "DELETE" && response.ok();
        });

        await collectionRow.getByRole("button", { name: "Rimuovi" }).click();
        await collectionDeleted;
    }
});