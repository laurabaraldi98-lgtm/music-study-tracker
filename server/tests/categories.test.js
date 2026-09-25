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
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test("returns the authenticated user's categories", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const savedCategories = [
            {
                id: 1,
                name: "Tonalità",
                user_id: "user_test",
                dictation_type_id: 2
            },
            {
                id: 2,
                name: "Ritmo",
                user_id: "user_test",
                dictation_type_id: 2
            }
        ];

        client.query
            .mockResolvedValueOnce({
                rows: [{
                    categories_initialized: true
                }]
            })
            .mockResolvedValueOnce({
                rows: savedCategories
            });

        const response = await request(app).get("/categories");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(savedCategories);

        expect(withUserContext).toHaveBeenCalledWith(
            "user_test",
            expect.any(Function)
        );

        expect(client.query).toHaveBeenLastCalledWith(
            expect.stringContaining("dictation_type_id"),
            ["user_test"]
        );
    });

    test("initializes default types and categories for a new user", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "new_user"
        });

        const savedCategories = [
            {
                id: 1,
                name: "Metrica",
                user_id: "new_user",
                dictation_type_id: 1
            },
            {
                id: 2,
                name: "Pause",
                user_id: "new_user",
                dictation_type_id: 1
            },
            {
                id: 3,
                name: "Gruppi irregolari",
                user_id: "new_user",
                dictation_type_id: 1
            }
        ];

        client.query
            .mockResolvedValueOnce({
                rows: [{
                    categories_initialized: false
                }]
            })
            .mockResolvedValue({
                rows: savedCategories
            });

        const response = await request(app).get("/categories");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(savedCategories);

        expect(withUserContext).toHaveBeenCalledWith(
            "new_user",
            expect.any(Function)
        );

        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO dictation_types"),
            [
                "new_user",
                [
                    "Ritmico",
                    "Melodico",
                    "Armonico"
                ]
            ]
        );

        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO categories"),
            [
                "rhythmic",
                "Metrica",
                "new_user",
                "Ritmico"
            ]
        );

        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("dictation_types_initialized = TRUE"),
            ["new_user"]
        );
    });

    test("returns 500 when retrieving categories fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        client.query.mockRejectedValue(
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
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["missing", undefined],
        ["not a number", "abc"],
        ["zero", 0],
        ["negative", -1],
        ["not an integer", 1.5]
    ])(
        "returns 400 when the dictation type ID is %s",
        async function (caseName, invalidId) {
            getAuth.mockReturnValue({
                isAuthenticated: true,
                userId: "user_test"
            });

            const response = await request(app)
                .post("/categories")
                .send({
                    dictationTypeId: invalidId,
                    name: "Tonalità"
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "Tipo di dettato non valido"
            });
            expect(withUserContext).not.toHaveBeenCalled();
        }
    );

    test.each([
        ["empty", "   "],
        ["not a string", 123],
        ["too long", "a".repeat(256)]
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
                    dictationTypeId: 2,
                    name: invalidName
                });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "Nome della categoria non valido"
            });
            expect(withUserContext).not.toHaveBeenCalled();
        }
    );

    test("returns 404 when the dictation type does not belong to the user", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        client.query.mockResolvedValue({
            rows: []
        });

        const response = await request(app)
            .post("/categories")
            .send({
                dictationTypeId: 99,
                name: "Memoria melodica"
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: "Tipo di dettato non trovato"
        });

        expect(withUserContext).toHaveBeenCalledWith(
            "user_test",
            expect.any(Function)
        );
    });

    test("creates a category linked to the selected dictation type", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const savedCategory = {
            id: 11,
            name: "Memoria melodica",
            user_id: "user_test",
            dictation_type_id: 2
        };

        client.query.mockResolvedValue({
            rows: [savedCategory]
        });

        const response = await request(app)
            .post("/categories")
            .send({
                dictationTypeId: 2,
                name: "Memoria melodica"
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(savedCategory);

        expect(withUserContext).toHaveBeenCalledWith(
            "user_test",
            expect.any(Function)
        );

        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("dictation_types.id"),
            [
                "Memoria melodica",
                "user_test",
                2
            ]
        );
    });

    test("returns 500 when creating a category fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        client.query.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app)
            .post("/categories")
            .send({
                dictationTypeId: 2,
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
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["not a number", "abc"],
        ["zero", "0"],
        ["negative", "-1"],
        ["not an integer", "1.5"]
    ])(
        "returns 400 when the category ID is %s",
        async function (caseName, invalidId) {
            getAuth.mockReturnValue({
                isAuthenticated: true,
                userId: "user_test"
            });

            const response = await request(app)
                .delete(`/categories/${invalidId}`);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "ID della categoria non valido"
            });
            expect(withUserContext).not.toHaveBeenCalled();
        }
    );

    test("returns 404 when the category is not found", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        client.query.mockResolvedValue({
            rows: []
        });

        const response = await request(app)
            .delete("/categories/1");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: "Categoria non trovata"
        });

        expect(withUserContext).toHaveBeenCalledWith(
            "user_test",
            expect.any(Function)
        );
    });

    test("deletes and returns the category", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const deletedCategory = {
            id: 11,
            name: "Memoria melodica",
            user_id: "user_test",
            dictation_type_id: 2
        };

        client.query.mockResolvedValue({
            rows: [deletedCategory]
        });

        const response = await request(app)
            .delete("/categories/11");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(deletedCategory);

        expect(withUserContext).toHaveBeenCalledWith(
            "user_test",
            expect.any(Function)
        );

        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("DELETE FROM categories"),
            [
                11,
                "user_test"
            ]
        );
    });

    test("returns 500 when deleting a category fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        client.query.mockRejectedValue(
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