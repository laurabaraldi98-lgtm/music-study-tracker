const { test, expect } = require("@playwright/test");

test("user can filter the calendar by collection and navigate between months", async function ({ page }) {
    const uniqueId = Date.now();
    const collectionA = `E2E Calendar Collection A ${uniqueId}`;
    const collectionB = `E2E Calendar Collection B ${uniqueId}`;
    const typeName = `E2E Calendar Filter Type ${uniqueId}`;
    const dictationA = `E2E Calendar Dictation A ${uniqueId}`;
    const dictationB = `E2E Calendar Dictation B ${uniqueId}`;
    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    const collectionsLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/collections") && response.request().method() === "GET" && response.ok();
    });

    const dictationTypesLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictation-types") && response.request().method() === "GET" && response.ok();
    });

    await page.goto("/");
    await Promise.all([collectionsLoaded, dictationTypesLoaded]);

    // Build dates and month labels from the browser clock so the test always targets the calendar's initial month.
    const calendarDates = await page.evaluate(function () {
        const now = new Date();
        const year = now.getFullYear();
        const monthIndex = now.getMonth();
        const month = String(monthIndex + 1).padStart(2, "0");
        const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
        const nextMonthDate = new Date(year, monthIndex + 1, 1);

        return {
            dateA: `${year}-${month}-10`,
            dateB: `${year}-${month}-20`,
            currentMonthTitle: `${monthNames[monthIndex]} ${year}`,
            nextMonthTitle: `${monthNames[nextMonthDate.getMonth()]} ${nextMonthDate.getFullYear()}`
        };
    });

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
    await page.locator("#dictation-date").fill(calendarDates.dateA);
    await page.locator("#dictation-name").fill(dictationA);
    await page.locator("#youtube-link").fill(youtubeUrl);

    const dictationACreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "POST" && response.ok();
    });

    await page.locator("#save-button").click();
    await dictationACreated;

    await page.locator("#dictation-type").selectOption(typeId);
    await page.locator("#dictation-collection").selectOption({ label: collectionB });
    await page.locator("#dictation-date").fill(calendarDates.dateB);
    await page.locator("#dictation-name").fill(dictationB);
    await page.locator("#youtube-link").fill(youtubeUrl);

    const dictationBCreated = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "POST" && response.ok();
    });

    await page.locator("#save-button").click();
    await dictationBCreated;

    const calendarLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#sidebar-toggle").click();
    await page.getByRole("button", { name: "Calendario" }).click();
    await calendarLoaded;

    const calendarTitle = page.locator("#calendar-container .calendar-header h3");
    const filter = page.locator("#calendar-collection-filter");

    await expect(calendarTitle).toHaveText(calendarDates.currentMonthTitle);

    const collectionAFiltered = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await filter.selectOption({ label: collectionA });
    await collectionAFiltered;

    await expect(page.locator(".calendar-day.has-dictation").filter({ hasText: /^10$/ })).toBeVisible();
    await expect(page.locator(".calendar-day.has-dictation").filter({ hasText: /^20$/ })).toHaveCount(0);

    const collectionBFiltered = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await filter.selectOption({ label: collectionB });
    await collectionBFiltered;

    await expect(page.locator(".calendar-day.has-dictation").filter({ hasText: /^20$/ })).toBeVisible();
    await expect(page.locator(".calendar-day.has-dictation").filter({ hasText: /^10$/ })).toHaveCount(0);

    const nextMonthLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#calendar-container .calendar-navigation-button").nth(1).click();
    await nextMonthLoaded;
    await expect(calendarTitle).toHaveText(calendarDates.nextMonthTitle);

    const previousMonthLoaded = page.waitForResponse(function (response) {
        return response.url().endsWith("/dictations") && response.request().method() === "GET" && response.ok();
    });

    await page.locator("#calendar-container .calendar-navigation-button").nth(0).click();
    await previousMonthLoaded;
    await expect(calendarTitle).toHaveText(calendarDates.currentMonthTitle);
    await expect(page.locator(".calendar-day.has-dictation").filter({ hasText: /^20$/ })).toBeVisible();

    // Cleanup: remove the dictations first, then their shared type and collections.
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