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
const app = require("../app");

let client;

beforeEach(function () {
    client = { query: jest.fn() };
    withUserContext.mockImplementation(async function (userId, callback) {
        return callback(client);
    });
});

afterEach(function () {
    jest.resetAllMocks();
});

describe("GET /dictation-types", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({ isAuthenticated: false });

        const response = await request(app).get("/dictation-types");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Utente non autenticato" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test("returns the authenticated user's dictation types", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const savedTypes = [
            { id: 1, name: "Ritmico", user_id: "user_test", is_default: true },
            { id: 2, name: "Melodico", user_id: "user_test", is_default: true },
            { id: 3, name: "Armonico", user_id: "user_test", is_default: true }
        ];

        client.query
            .mockResolvedValueOnce({ rows: [{ dictation_types_initialized: true }] })
            .mockResolvedValueOnce({ rows: savedTypes });

        const response = await request(app).get("/dictation-types");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(savedTypes);
        expect(withUserContext).toHaveBeenCalledWith("user_test", expect.any(Function));
        expect(client.query).toHaveBeenLastCalledWith(
            expect.stringContaining("FROM dictation_types"),
            ["user_test"]
        );
    });

    test("initializes default types for a new user", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "new_user" });

        const defaultTypes = [
            { id: 1, name: "Ritmico", user_id: "new_user", is_default: true },
            { id: 2, name: "Melodico", user_id: "new_user", is_default: true },
            { id: 3, name: "Armonico", user_id: "new_user", is_default: true }
        ];

        client.query
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: defaultTypes });

        const response = await request(app).get("/dictation-types");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(defaultTypes);
        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO dictation_types"),
            ["new_user", ["Ritmico", "Melodico", "Armonico"]]
        );
    });

    test("returns 500 when retrieving dictation types fails", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockRejectedValue(new Error("Database error"));

        const response = await request(app).get("/dictation-types");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Errore durante il recupero dei tipi di dettato" });
    });
});

describe("POST /dictation-types", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({ isAuthenticated: false });

        const response = await request(app).post("/dictation-types").send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Utente non autenticato" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["empty", "   "],
        ["not a string", 123],
        ["too long", "a".repeat(51)]
    ])("returns 400 when the name is %s", async function (caseName, invalidName) {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).post("/dictation-types").send({ name: invalidName });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Nome del tipo di dettato non valido" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test("creates and returns a custom dictation type", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const savedType = {
            id: 4,
            name: "Contrappuntistico",
            user_id: "user_test",
            is_default: false
        };

        client.query.mockResolvedValue({ rows: [savedType] });

        const response = await request(app)
            .post("/dictation-types")
            .send({ name: "  Contrappuntistico  " });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(savedType);
        expect(withUserContext).toHaveBeenCalledWith("user_test", expect.any(Function));
        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO dictation_types"),
            ["Contrappuntistico", "user_test"]
        );
    });

    test("returns 409 when the name already exists", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockRejectedValue({ code: "23505" });

        const response = await request(app)
            .post("/dictation-types")
            .send({ name: "Ritmico" });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: "Esiste già un tipo di dettato con questo nome" });
    });

    test("returns 500 when creating a type fails", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockRejectedValue(new Error("Database error"));

        const response = await request(app)
            .post("/dictation-types")
            .send({ name: "Contrappuntistico" });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Errore durante il salvataggio del tipo di dettato" });
    });
});

describe("DELETE /dictation-types/:id", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({ isAuthenticated: false });

        const response = await request(app).delete("/dictation-types/1");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Utente non autenticato" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["not a number", "abc"],
        ["zero", "0"],
        ["negative", "-1"],
        ["not an integer", "1.5"]
    ])("returns 400 when the ID is %s", async function (caseName, invalidId) {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).delete(`/dictation-types/${invalidId}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "ID del tipo di dettato non valido" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test("returns 404 when the type is not found", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockResolvedValue({ rows: [] });

        const response = await request(app).delete("/dictation-types/10");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Tipo di dettato non trovato" });
        expect(withUserContext).toHaveBeenCalledWith("user_test", expect.any(Function));
    });

    test("deletes and returns the dictation type", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const deletedType = {
            id: 4,
            name: "Contrappuntistico",
            user_id: "user_test",
            is_default: false
        };

        client.query.mockResolvedValue({ rows: [deletedType] });

        const response = await request(app).delete("/dictation-types/4");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(deletedType);
        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("DELETE FROM dictation_types"),
            [4, "user_test"]
        );
    });

    test.each(["23503", "23001"])(
        "returns 409 when the type is already in use (%s)",
        async function (errorCode) {
            getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
            client.query.mockRejectedValue({ code: errorCode });

            const response = await request(app).delete("/dictation-types/1");

            expect(response.status).toBe(409);
            expect(response.body).toEqual({
                error: "Non puoi eliminare un tipo utilizzato da dettati o categorie"
            });
        }
    );

    test("returns 500 when deleting a type fails", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockRejectedValue(new Error("Database error"));

        const response = await request(app).delete("/dictation-types/4");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: "Errore durante la cancellazione del tipo di dettato"
        });
    });
});