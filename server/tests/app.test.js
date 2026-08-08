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

describe("GET /", function () {
    test("returns 200 and the server status message", async function () {
        const response = await request(app).get("/");

        expect(response.status).toBe(200);
        expect(response.text).toBe("Il server funziona!");
    });
});

describe("GET /dictations", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: false
        });

        const response = await request(app).get("/dictations");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Utente non autenticato"
        });
    });

    test("returns saved dictations for an authenticated user", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const savedDictations = [
            {
                id: 1,
                date: "2026-08-08",
                name: "Dettato test",
                youtube_link: "https://youtube.com/test",
                type: "melodic",
                collection: "Corali di Bach",
                available_categories: [
                    "Tonalità",
                    "Ritmo",
                    "Intervalli",
                    "Modulazioni"
                ],
                correct_categories: [
                    "Tonalità",
                    "Intervalli"
                ],
                user_id: "user_test"
            }
        ];

        pool.query.mockResolvedValue({
            rows: savedDictations
        });

        const response = await request(app).get("/dictations");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(savedDictations);
    });

    test("returns 500 when the database query fails", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        pool.query.mockRejectedValue(
            new Error("Database error")
        );

        const response = await request(app).get("/dictations");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: "Errore durante il recupero dei dettati"
        });
    });
});

describe("POST /dictations", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: false
        });

        const response = await request(app)
            .post("/dictations")
            .send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Utente non autenticato"
        });
    });

    test("returns 400 when the date is invalid", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const response = await request(app)
            .post("/dictations")
            .send({
                date: "08-08-2026"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Data non valida"
        });
    });

    test("returns 400 when the dictation name is invalid", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const response = await request(app)
            .post("/dictations")
            .send({
                date: "2026-08-08",
                name: "   "
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Nome del dettato non valido"
        });
    });

    test("returns 400 when the YouTube link is invalid", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const response = await request(app)
            .post("/dictations")
            .send({
                date: "2026-08-08",
                name: "Dettato test",
                youtubeLink: "not-a-valid-url"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Link non valido"
        });
    });

    test("returns 400 when the dictation type is invalid", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const response = await request(app)
            .post("/dictations")
            .send({
                date: "2026-08-08",
                name: "Dettato test",
                youtubeLink: "https://youtube.com/test",
                type: "invalid-type"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Tipo di dettato non valido"
        });
    });

    test("returns 400 when the collection is invalid", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const response = await request(app)
            .post("/dictations")
            .send({
                date: "2026-08-08",
                name: "Dettato test",
                youtubeLink: "https://youtube.com/test",
                type: "melodic",
                collection: 123
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Raccolta non valida"
        });
    });

    test("returns 400 when available categories are invalid", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const response = await request(app)
            .post("/dictations")
            .send({
                date: "2026-08-08",
                name: "Dettato test",
                youtubeLink: "https://youtube.com/test",
                type: "melodic",
                collection: "Corali di Bach",
                availableCategories: "Tonalità"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Categorie disponibili non valide"
        });
    });

    test("returns 400 when correct categories are invalid", async function () {
        getAuth.mockReturnValue({
            isAuthenticated: true,
            userId: "user_test"
        });

        const response = await request(app)
            .post("/dictations")
            .send({
                date: "2026-08-08",
                name: "Dettato test",
                youtubeLink: "https://youtube.com/test",
                type: "melodic",
                collection: "Corali di Bach",
                availableCategories: [
                    "Tonalità",
                    "Ritmo",
                    "Intervalli"
                ],
                correctCategories: "Tonalità"
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Categorie corrette non valide"
        });
    });
});