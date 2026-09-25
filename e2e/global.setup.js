const { test: setup } = require("@playwright/test");
const { clerk, clerkSetup } = require("@clerk/testing/playwright");

setup.describe.configure({ mode: "serial" });

setup("configure Clerk", async function () {
    // Prepare Clerk's Playwright testing helpers using the test environment keys.
    await clerkSetup();
});

setup("authenticate test user", async function ({ page }) {
    const email = process.env.E2E_EMAIL;

    if (!email) {
        throw new Error("E2E_EMAIL is not configured");
    }

    await page.goto("/");

    // Create an authenticated Clerk session for the dedicated E2E test user.
    await clerk.signIn({
        page,
        emailAddress: email
    });

    await page.reload();

    // Save the authenticated browser state so all E2E tests can reuse it.
    await page.context().storageState({
        path: "e2e/.auth/user.json"
    });
});