// Mock Clerk authentication to control auth state during tests
jest.mock("@clerk/express", () => ({
    clerkMiddleware: () => (request, response, next) => next(),
    getAuth: jest.fn()
}));

// Mock the database to avoid real PostgreSQL queries during tests
jest.mock("../db", () => ({
    query: jest.fn()
}));

const request = require("supertest");
const app = require("../app");

describe("GET /", function () {
    test("returns 200 and the server status message", async function () {
        const response = await request(app).get("/");

        expect(response.status).toBe(200);
        expect(response.text).toBe("Il server funziona!");
    });

    test("rejects requests from an unauthorized origin", async function () {
        const response = await request(app)
            .get("/")
            .set("Origin", "https://example.com");

        expect(response.status).toBe(500);
    });
});