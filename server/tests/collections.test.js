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
const { getAuth } = require("@clerk/express");
const pool = require("../db");
const app = require("../app");

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
    });

    test("returns saved collections for an authenticated user", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const savedCollections = [
            {
                id: 1,
                name: "Corali di Bach",
                user_id: "user_test"
            },
            {
                id: 2,
                name: "Dettati armonici",
                user_id: "user_test"
            }
        ];

        pool.query.mockResolvedValue({
            rows: savedCollections
        });

        const response = await request(app).get("/collections");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(savedCollections);
    });

    test("returns 500 when the database query fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        pool.query.mockRejectedValue(
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
    });

    test.each([
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
        }
    );

    test("creates and returns a new collection", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const newSavedCollection = {
            id: 3,
            name: "Dettati melodici",
            user_id: "user_test"
        };

        pool.query.mockResolvedValue({
            rows: [newSavedCollection]
        });

        const response = await request(app)
            .post("/collections")
            .send({
                name: "Dettati melodici"
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(newSavedCollection);
    });

    test("returns 500 when creating a collection fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        pool.query.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app)
            .post("/collections")
            .send({
                name: "Dettati melodici"
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
    });

    test("returns 400 when the collection ID is invalid", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const response = await request(app)
            .delete("/collections/abc");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "ID della raccolta non valido"
        });
    });

    test("returns 404 when the collection is not found", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        pool.query.mockResolvedValue({
            rows: []
        });

        const response = await request(app)
            .delete("/collections/1");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: "Raccolta non trovata"
        });
    });

    test("deletes and returns the collection", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const deletedCollection = {
            id: 3,
            name: "Dettati melodici",
            user_id: "user_test"
        };

        pool.query.mockResolvedValue({
            rows: [deletedCollection]
        });

        const response = await request(app)
            .delete("/collections/3");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(deletedCollection);
    });

    test("returns 500 when deleting a collection fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        pool.query.mockRejectedValue(
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