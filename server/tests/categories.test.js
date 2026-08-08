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