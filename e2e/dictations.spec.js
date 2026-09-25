const { test, expect } = require("@playwright/test");

test("user can create, view and delete a complete dictation", async function ({ page }) {
    const uniqueId = Date.now();
    const collectionName = `E2E Collection ${uniqueId}`;
    const typeName = `E2E Type ${uniqueId}`;
    const categoryName = `E2E Category ${uniqueId}`;
    const dictationName = `E2E Dictation ${uniqueId}`;
    const dictationDate = "2026-09-24";
    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    // Wait for the initial async data loads before changing the UI,
    // otherwise they could overwrite freshly created test data.
    const collectionsLoaded = page.waitForResponse(function (response) {
        return (
            response.url().endsWith("/collections") &&
            response.request().method() === "GET" &&
            response.ok()
        );
    });

    const dictationTypesLoaded = page.waitForResponse(function (response) {
        return (
            response.url().endsWith("/dictation-types") &&
            response.request().method() === "GET" &&
            response.ok()
        );
    });

    await page.goto("/");

    await Promise.all([
        collectionsLoaded,
        dictationTypesLoaded
    ]);

    await page.getByRole("button", { name: "Gestisci raccolte" }).click();
    await page.locator("#new-collection").fill(collectionName);
    await page.locator("#add-collection-button").click();

    await expect(
        page.locator("#dictation-collection")
    ).toContainText(collectionName);

    await page.getByRole("button", { name: "Gestisci tipi di dettato" }).click();
    await page.locator("#new-dictation-type").fill(typeName);
    await page.locator("#add-dictation-type-button").click();

    const typeOption = page
        .locator("#dictation-type option")
        .filter({ hasText: typeName });

    const typeId = await typeOption.getAttribute("value");

    await expect(typeOption).toHaveCount(1);

    await page.locator("#dictation-type").selectOption(typeId);

    await expect(
        page.locator("#dictation-type")
    ).toHaveValue(typeId);

    await page.getByRole("button", { name: "Gestisci categorie" }).click();
    await page.locator("#new-category").fill(categoryName);
    await page.locator("#add-category-button").click();

    const categoryRow = page
        .locator("#categories-container div")
        .filter({ hasText: categoryName });

    await expect(categoryRow).toBeVisible();

    await categoryRow
        .locator('input[type="checkbox"]')
        .check();

    await page.locator("#dictation-date").fill(dictationDate);
    await page.locator("#dictation-name").fill(dictationName);
    await page.locator("#youtube-link").fill(youtubeUrl);

    await page.locator("#dictation-collection").selectOption({
        label: collectionName
    });

    // Confirm the backend actually persisted the dictation before
    // continuing to the saved-dictations view.
    const dictationCreated = page.waitForResponse(function (response) {
        return (
            response.url().endsWith("/dictations") &&
            response.request().method() === "POST" &&
            response.ok()
        );
    });

    await page.locator("#save-button").click();

    await dictationCreated;

    await page.locator("#sidebar-toggle").click();

    await page
        .getByRole("button", { name: "Dettati salvati" })
        .click();

    const savedDictation = page
        .locator("#saved-dictations-container details")
        .filter({ hasText: dictationName });

    await expect(savedDictation).toBeVisible();

    await savedDictation.locator("summary").click();

    await expect(savedDictation).toContainText(typeName);
    await expect(savedDictation).toContainText(collectionName);
    await expect(savedDictation).toContainText(categoryName);

    await expect(
        savedDictation.getByRole("link", { name: "Apri video" })
    ).toHaveAttribute("href", youtubeUrl);

    page.once("dialog", async function (dialog) {
        await dialog.accept();
    });

    await savedDictation
        .getByRole("button", { name: "Elimina" })
        .click();

    await expect(
        page.locator("#saved-dictations-container")
    ).not.toContainText(dictationName);
});