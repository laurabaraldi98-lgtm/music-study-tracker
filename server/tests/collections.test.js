jest.mock("@clerk/express", () => ({
    clerkMiddleware: () => (request, response, next) => next(),
    getAuth: jest.fn()
}));

jest.mock("../db-context", () => ({
    withUserContext: jest.fn()
}));

const request = require("supertest");
const { getAuth } = require("@clerk/express");
const { withUserContext } = require("../db-context");

// Disable rate limiting here so route tests only test route logic.
jest.mock("../rate-limit", () => ({
    generalLimiter: (request, response, next) => next(),
    writeLimiter: (request, response, next) => next(),
    reportLimiter: (request, response, next) => next(),
    aiReportLimiter: (request, response, next) => next()
}));

const app = require("../app");

let client;

beforeEach(function () {
    client = {
        query: jest.fn()
    };

    withUserContext.mockImplementation(async function (userId, callback) {
        return callback(client);
    });
});

afterEach(function () {
    jest.resetAllMocks();
});

describe("GET /collections", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: false
        });

        const response = await request(app).get("/collections");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Utente non autenticato"
        });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test("returns the authenticated user's collections", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const savedCollections = [
            {
                id: 1,
                name: "Berklee",
                user_id: "user_test"
            },
            {
                id: 2,
                name: "Esame",
                user_id: "user_test"
            }
        ];

        client.query.mockResolvedValue({
            rows: savedCollections
        });

        const response = await request(app).get("/collections");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(savedCollections);

        expect(withUserContext).toHaveBeenCalledWith(
            "user_test",
            expect.any(Function)
        );

        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("FROM collections"),
            ["user_test"]
        );
    });

    test("returns 500 when retrieving collections fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        client.query.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app).get("/collections");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: "Errore durante il recupero delle raccolte"
        });
    });
});

describe("POST /collections", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: false
        });

        const response = await request(app)
            .post("/collections")
            .send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Utente non autenticato"
        });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["missing", undefined],
        ["empty", "   "],
        ["not a string", 123],
        ["too long", "a".repeat(101)]
    ])(
        "returns 400 when the collection name is %s",
        async function (caseName, invalidName) {
            getAuth.mockReturnValue({
                isAuthenticated: true,
                userId: "user_test"
            });

            const response = await request(app)
                .post("/collections")
                .send({
                    name: invalidName
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "Nome della raccolta non valido"
            });
            expect(withUserContext).not.toHaveBeenCalled();
        }
    );

    test("creates and returns a collection", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const savedCollection = {
            id: 3,
            name: "Berklee",
            user_id: "user_test"
        };

        client.query.mockResolvedValue({
            rows: [savedCollection]
        });

        const response = await request(app)
            .post("/collections")
            .send({
                name: "  Berklee  "
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(savedCollection);

        expect(withUserContext).toHaveBeenCalledWith(
            "user_test",
            expect.any(Function)
        );

        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO collections"),
            [
                "Berklee",
                "user_test"
            ]
        );
    });

    test("returns 500 when creating a collection fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        client.query.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app)
            .post("/collections")
            .send({
                name: "Berklee"
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: "Errore durante il salvataggio della raccolta"
        });
    });
});

describe("DELETE /collections/:id", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: false
        });

        const response = await request(app)
            .delete("/collections/1");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Utente non autenticato"
        });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["not a number", "abc"],
        ["zero", "0"],
        ["negative", "-1"],
        ["not an integer", "1.5"]
    ])(
        "returns 400 when the collection ID is %s",
        async function (caseName, invalidId) {
            getAuth.mockReturnValue({
                isAuthenticated: true,
                userId: "user_test"
            });

            const response = await request(app)
                .delete(`/collections/${invalidId}`);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "ID della raccolta non valido"
            });
            expect(withUserContext).not.toHaveBeenCalled();
        }
    );

    test("returns 404 when the collection is not found", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        client.query.mockResolvedValue({
            rows: []
        });

        const response = await request(app)
            .delete("/collections/1");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: "Raccolta non trovata"
        });

        expect(withUserContext).toHaveBeenCalledWith(
            "user_test",
            expect.any(Function)
        );
    });

    test("deletes and returns the collection", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const deletedCollection = {
            id: 3,
            name: "Berklee",
            user_id: "user_test"
        };

        client.query.mockResolvedValue({
            rows: [deletedCollection]
        });

        const response = await request(app)
            .delete("/collections/3");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(deletedCollection);

        expect(withUserContext).toHaveBeenCalledWith(
            "user_test",
            expect.any(Function)
        );

        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("DELETE FROM collections"),
            [
                3,
                "user_test"
            ]
        );
    });

    test("returns 500 when deleting a collection fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        client.query.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app)
            .delete("/collections/3");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: "Errore durante la cancellazione della raccolta"
        });
    });
});