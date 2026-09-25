require("dotenv").config();

const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",

    webServer: [
        {
            command: "npm run serve:e2e",
            url: "http://127.0.0.1:5500",
            reuseExistingServer: true
        },
        {
            command: "node server/server.js",
            url: "http://127.0.0.1:3000",
            reuseExistingServer: true
        }
    ],

    use: {
        baseURL: "http://127.0.0.1:5500",
        trace: "on-first-retry"
    },

    projects: [
        {
            name: "setup",
            testMatch: /global\.setup\.js/
        },
        {
            name: "chromium",
            dependencies: ["setup"],
            use: {
                ...devices["Desktop Chrome"],

                // Reuse the Clerk session created by global.setup.js.
                storageState: "e2e/.auth/user.json"
            }
        }
    ]
});