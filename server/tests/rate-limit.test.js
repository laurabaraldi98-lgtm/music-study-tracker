jest.mock("@clerk/express", () => ({
    getAuth: jest.fn()
}));

const express = require("express");
const request = require("supertest");
const { getAuth } = require("@clerk/express");

const {
    generalLimiter,
    writeLimiter,
    reportLimiter,
    aiReportLimiter,
    getRateLimitKey
} = require("../rate-limit");

function createTestApp(method, limiter) {
    const app = express();

    app[method]("/", limiter, function (request, response) {
        response.status(200).json({ ok: true });
    });

    return app;
}

beforeEach(function () {
    getAuth.mockReturnValue({
        isAuthenticated: false,
        userId: null
    });
});

test("uses the authenticated user ID as rate limit key", function () {
    getAuth.mockReturnValue({
        isAuthenticated: true,
        userId: "user_123"
    });

    const key = getRateLimitKey({
        ip: "127.0.0.1"
    });

    expect(key).toBe("user:user_123");
});

test("general limiter blocks requests after 100 per minute", async function () {
    const app = createTestApp("get", generalLimiter);

    for (let i = 0; i < 100; i++) {
        const response = await request(app).get("/");
        expect(response.status).toBe(200);
    }

    const blockedResponse = await request(app).get("/");

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body).toEqual({
        error: "Troppe richieste. Riprova tra poco."
    });
});

test("write limiter blocks requests after 30 per minute", async function () {
    const app = createTestApp("post", writeLimiter);

    for (let i = 0; i < 30; i++) {
        const response = await request(app).post("/");
        expect(response.status).toBe(200);
    }

    const blockedResponse = await request(app).post("/");

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body).toEqual({
        error: "Troppe operazioni di modifica. Riprova tra poco."
    });
});

test("report limiter blocks requests after 30 per minute", async function () {
    const app = createTestApp("get", reportLimiter);

    for (let i = 0; i < 30; i++) {
        const response = await request(app).get("/");
        expect(response.status).toBe(200);
    }

    const blockedResponse = await request(app).get("/");

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body).toEqual({
        error: "Troppe richieste al report. Riprova tra poco."
    });
});

test("AI report limiter blocks requests after 5 per minute", async function () {
    const app = createTestApp("post", aiReportLimiter);

    for (let i = 0; i < 5; i++) {
        const response = await request(app).post("/");
        expect(response.status).toBe(200);
    }

    const blockedResponse = await request(app).post("/");

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body).toEqual({
        error: "Troppe richieste di analisi AI. Riprova tra poco."
    });
});