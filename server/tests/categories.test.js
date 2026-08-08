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

describe("GET /categories", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: false
        });

        const response = await request(app).get("/categories");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Utente non autenticato"
        });
    });

    test("returns saved categories for an authenticated user", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        pool.query
            .mockResolvedValueOnce({
                rows: [
                    {
                        categories_initialized: true
                    }
                ]
            })
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        type: "melodic",
                        name: "Tonalità",
                        user_id: "user_test"
                    },
                    {
                        id: 2,
                        type: "melodic",
                        name: "Ritmo",
                        user_id: "user_test"
                    }
                ]
            });

        const response = await request(app).get("/categories");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                id: 1,
                type: "melodic",
                name: "Tonalità",
                user_id: "user_test"
            },
            {
                id: 2,
                type: "melodic",
                name: "Ritmo",
                user_id: "user_test"
            }
        ]);
    });

    test("initializes default categories when they have not been initialized yet", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const savedCategories = [
            {
                id: 1,
                type: "melodic",
                name: "Tonalità",
                user_id: "user_test"
            },
            {
                id: 2,
                type: "melodic",
                name: "Ritmo",
                user_id: "user_test"
            }
        ];

        pool.query
            .mockResolvedValueOnce({
                rows: [
                    {
                        categories_initialized: false
                    }
                ]
            })
            .mockResolvedValue({
                rows: savedCategories
            });

        const response = await request(app).get("/categories");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(savedCategories);

        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO categories"),
            ["rhythmic", "Metrica", "user_test"]
        );
    });

    test("returns 500 when the database query fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        pool.query.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app).get("/categories");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: "Errore durante il recupero delle categorie"
        });
    });
});

describe("POST /categories", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: false
        });

        const response = await request(app)
            .post("/categories")
            .send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Utente non autenticato"
        });
    });

    test("returns 400 when the category type is invalid", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const response = await request(app)
            .post("/categories")
            .send({
                type: "invalid-type",
                name: "Tonalità"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Tipo di categoria non valido"
        });
    });

    test.each([
        ["empty", "   "],
        ["not a string", 123],
        ["too long", "a".repeat(51)]
    ])(
        "returns 400 when the category name is %s",
        async function (caseName, invalidName) {
            getAuth.mockReturnValue({
                isAuthenticated: true,
                userId: "user_test"
            });

            const response = await request(app)
                .post("/categories")
                .send({
                    type: "melodic",
                    name: invalidName
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "Nome della categoria non valido"
            });
        }
    );

    test("creates and returns a new category", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const newSavedCategory = {
            id: 11,
            type: "melodic",
            name: "Memoria melodica",
            user_id: "user_test"
        };

        pool.query.mockResolvedValue({
            rows: [newSavedCategory]
        });

        const response = await request(app)
            .post("/categories")
            .send({
                type: "melodic",
                name: "Memoria melodica"
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(newSavedCategory);
    });

    test("returns 500 when creating a category fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        pool.query.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app)
            .post("/categories")
            .send({
                type: "melodic",
                name: "Memoria melodica"
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: "Errore durante il salvataggio della categoria"
        });
    });
});

describe("DELETE /categories/:id", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: false
        });

        const response = await request(app)
            .delete("/categories/1");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Utente non autenticato"
        });
    });

    test("returns 400 when the category ID is invalid", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const response = await request(app)
            .delete("/categories/abc");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "ID della categoria non valido"
        });
    });

    test("returns 404 when the category is not found", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        pool.query.mockResolvedValue({
            rows: []
        });

        const response = await request(app)
            .delete("/categories/1");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: "Categoria non trovata"
        });
    });

    test("deletes and returns the category", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const deletedCategory = {
            id: 11,
            type: "melodic",
            name: "Memoria melodica",
            user_id: "user_test"
        };

        pool.query.mockResolvedValue({
            rows: [deletedCategory]
        });

        const response = await request(app)
            .delete("/categories/11");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(deletedCategory);
    });

    test("returns 500 when deleting a category fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        pool.query.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app)
            .delete("/categories/11");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: "Errore durante la cancellazione della categoria"
        });
    });
});