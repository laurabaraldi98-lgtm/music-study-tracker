const { test, expect } = require("@playwright/test");

test("user can filter saved dictations by collection", async function ({ page }) {
    const uniqueId = Date.now();
    const collectionA = `E2E Collection A ${uniqueId}`;
    const collectionB = `E2E Collection B ${uniqueId}`;
    const typeName = `E2E Filter Type ${uniqueId}`;
    const dictationA = `E2E Dictation A ${uniqueId}`;
    const dictationB = `E2E Dictation B ${uniqueId}`;
    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    // Wait for the initial async data before creating test records.
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
    await page.locator("#dictation-date").fill("2026-09-24");
    await page.locator("#dictation-name").fill(dictationA);
    await page.locator("#youtube-link").fill(youtubeUrl);

    const dictationACreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "POST" && response.ok();
    });

    await page.locator("#save-button").click();
    await dictationACreated;

    await page.locator("#dictation-type").selectOption(typeId);
    await page.locator("#dictation-collection").selectOption({ label: collectionB });
    await page.locator("#dictation-date").fill("2026-09-25");
    await page.locator("#dictation-name").fill(dictationB);
    await page.locator("#youtube-link").fill(youtubeUrl);

    const dictationBCreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "POST" && response.ok();
    });

    await page.locator("#save-button").click();
    await dictationBCreated;

    const savedDictationsLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Dettati salvati" }).click();
    await savedDictationsLoaded;

    const filter = page.locator("#saved-collection-filter");
    const savedContainer = page.locator("#saved-dictations-container");

    const collectionAFiltered = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await filter.selectOption({ label: collectionA });
    await collectionAFiltered;

    await expect(savedContainer).toContainText(dictationA);
    await expect(savedContainer).not.toContainText(dictationB);

    const collectionBFiltered = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await filter.selectOption({ label: collectionB });
    await collectionBFiltered;

    await expect(savedContainer).toContainText(dictationB);
    await expect(savedContainer).not.toContainText(dictationA);

    // Delete the dictations first because they depend on the shared type and collections.
    const allDictationsLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await filter.selectOption("");
    await allDictationsLoaded;

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
        await expect(savedContainer).not.toContainText(dictationName);
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