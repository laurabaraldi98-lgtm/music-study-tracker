const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",

    webServer: {
        command: "npm.cmd run serve:e2e",
        url: "http://127.0.0.1:5500",
        reuseExistingServer: true
    },

    use: {
        baseURL: "http://127.0.0.1:5500",
        trace: "on-first-retry"
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] }
        }
    ]
});