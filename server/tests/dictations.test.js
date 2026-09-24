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

describe("GET /dictations", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({ isAuthenticated: false });

        const response = await request(app).get("/dictations");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Utente non autenticato" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test("returns the authenticated user's dictations with their type names", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const savedDictations = [{
            id: 1,
            date: "2026-08-08",
            name: "Dettato test",
            youtube_link: "https://youtube.com/test",
            type: "melodic",
            collection: "Corali di Bach",
            available_categories: ["Tonalità", "Ritmo", "Intervalli", "Modulazioni"],
            correct_categories: ["Tonalità", "Intervalli"],
            user_id: "user_test",
            dictation_type_id: 2,
            dictation_type_name: "Melodico"
        }];

        client.query.mockResolvedValue({ rows: savedDictations });

        const response = await request(app).get("/dictations");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(savedDictations);
        expect(withUserContext).toHaveBeenCalledWith("user_test", expect.any(Function));
        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("FROM dictations"),
            ["user_test"]
        );
    });

    test("returns 500 when retrieving dictations fails", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockRejectedValue(new Error("Database error"));

        const response = await request(app).get("/dictations");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Errore durante il recupero dei dettati" });
    });
});

describe("POST /dictations", function () {
    const validBody = {
        date: "2026-08-08",
        name: "Dettato test",
        youtubeLink: "https://youtube.com/test",
        dictationTypeId: 2,
        collection: "Corali di Bach",
        availableCategories: ["Tonalità", "Ritmo", "Intervalli"],
        correctCategories: ["Tonalità", "Intervalli"]
    };

    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({ isAuthenticated: false });

        const response = await request(app).post("/dictations").send({});

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Utente non autenticato" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test("returns 400 when the date is invalid", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            date: "08-08-2026"
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Data non valida" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["empty", "   "],
        ["not a string", 123],
        ["too long", "a".repeat(101)]
    ])("returns 400 when the dictation name is %s", async function (caseName, invalidName) {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            name: invalidName
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Nome del dettato non valido" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["malformed", "not-a-valid-url"],
        ["not a string", 123],
        ["unsupported protocol", "ftp://example.com/test"]
    ])("returns 400 when the link is %s", async function (caseName, invalidLink) {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            youtubeLink: invalidLink
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Link non valido" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["missing", undefined],
        ["string", "2"],
        ["zero", 0],
        ["negative", -1],
        ["decimal", 1.5]
    ])("returns 400 when the dictation type ID is %s", async function (caseName, invalidId) {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            dictationTypeId: invalidId
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Tipo di dettato non valido" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["a number", 123],
        ["an array", ["test"]],
        ["a boolean", true]
    ])("returns 400 when the collection is %s", async function (caseName, invalidCollection) {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            collection: invalidCollection
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Raccolta non valida" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test("returns 400 when the collection name is too long", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            collection: "a".repeat(101)
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Nome della raccolta troppo lungo" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["not an array", "Tonalità"],
        ["contains a non-string value", ["Tonalità", 123]]
    ])("returns 400 when available categories are %s", async function (caseName, invalidCategories) {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            availableCategories: invalidCategories
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Categorie disponibili non valide" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["not an array", "Tonalità"],
        ["contains a non-string value", ["Tonalità", 123]]
    ])("returns 400 when correct categories are %s", async function (caseName, invalidCategories) {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            correctCategories: invalidCategories
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "Categorie corrette non valide" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test("returns 404 when the selected type does not belong to the user", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockResolvedValue({ rows: [] });

        const response = await request(app).post("/dictations").send(validBody);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Tipo di dettato non trovato" });
        expect(withUserContext).toHaveBeenCalledWith("user_test", expect.any(Function));
    });

    test("creates a dictation linked to the selected type", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const savedDictation = {
            id: 1,
            date: "2026-08-08",
            name: "Dettato test",
            youtube_link: "https://youtube.com/test",
            type: "melodic",
            collection: "Corali di Bach",
            available_categories: ["Tonalità", "Ritmo", "Intervalli"],
            correct_categories: ["Tonalità", "Intervalli"],
            user_id: "user_test",
            dictation_type_id: 2
        };

        client.query.mockResolvedValue({ rows: [savedDictation] });

        const response = await request(app).post("/dictations").send(validBody);

        expect(response.status).toBe(201);
        expect(response.body).toEqual(savedDictation);
        expect(withUserContext).toHaveBeenCalledWith("user_test", expect.any(Function));
        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO dictations"),
            [
                "2026-08-08",
                "Dettato test",
                "https://youtube.com/test",
                2,
                "Corali di Bach",
                ["Tonalità", "Ritmo", "Intervalli"],
                ["Tonalità", "Intervalli"],
                "user_test"
            ]
        );
    });

    test("creates a dictation with an HTTP link", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const savedDictation = {
            id: 2,
            date: "2026-08-08",
            name: "HTTP test",
            youtube_link: "http://youtube.com/test",
            type: "melodic",
            collection: "Corali di Bach",
            available_categories: ["Tonalità"],
            correct_categories: ["Tonalità"],
            user_id: "user_test",
            dictation_type_id: 2
        };

        client.query.mockResolvedValue({ rows: [savedDictation] });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            name: "HTTP test",
            youtubeLink: "http://youtube.com/test",
            availableCategories: ["Tonalità"],
            correctCategories: ["Tonalità"]
        });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(savedDictation);
    });

    test("creates a dictation without a collection", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const savedDictation = {
            id: 3,
            date: "2026-08-08",
            name: "Dettato senza raccolta",
            youtube_link: "https://youtube.com/test",
            type: "melodic",
            collection: null,
            available_categories: ["Tonalità"],
            correct_categories: ["Tonalità"],
            user_id: "user_test",
            dictation_type_id: 2
        };

        client.query.mockResolvedValue({ rows: [savedDictation] });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            name: "Dettato senza raccolta",
            collection: "   ",
            availableCategories: ["Tonalità"],
            correctCategories: ["Tonalità"]
        });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(savedDictation);
        expect(client.query.mock.calls[0][1][4]).toBeNull();
    });

    test("accepts an explicitly null collection", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockResolvedValue({ rows: [{ id: 4 }] });

        const response = await request(app).post("/dictations").send({
            ...validBody,
            collection: null
        });

        expect(response.status).toBe(201);
        expect(client.query.mock.calls[0][1][4]).toBeNull();
    });

    test("accepts an omitted collection", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockResolvedValue({ rows: [{ id: 5 }] });

        const payload = { ...validBody };
        delete payload.collection;

        const response = await request(app).post("/dictations").send(payload);

        expect(response.status).toBe(201);
        expect(client.query.mock.calls[0][1][4]).toBeNull();
    });

    test("returns 500 when creating a dictation fails", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockRejectedValue(new Error("Database error"));

        const response = await request(app).post("/dictations").send(validBody);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Errore durante il salvataggio del dettato" });
    });
});

describe("DELETE /dictations/:id", function () {
    test("returns 401 when the user is not authenticated", async function () {
        getAuth.mockReturnValue({ isAuthenticated: false });

        const response = await request(app).delete("/dictations/1");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: "Utente non autenticato" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test.each([
        ["not a number", "abc"],
        ["zero", "0"],
        ["negative", "-1"],
        ["not an integer", "1.5"]
    ])("returns 400 when the dictation ID is %s", async function (caseName, invalidId) {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const response = await request(app).delete(`/dictations/${invalidId}`);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: "ID del dettato non valido" });
        expect(withUserContext).not.toHaveBeenCalled();
    });

    test("returns 404 when the dictation is not found", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockResolvedValue({ rows: [] });

        const response = await request(app).delete("/dictations/1");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: "Dettato non trovato" });
        expect(withUserContext).toHaveBeenCalledWith("user_test", expect.any(Function));
    });

    test("deletes and returns the authenticated user's dictation", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });

        const deletedDictation = {
            id: 1,
            date: "2026-08-08",
            name: "Dettato test",
            youtube_link: "https://youtube.com/test",
            type: "melodic",
            collection: "Corali di Bach",
            available_categories: ["Tonalità", "Ritmo", "Intervalli"],
            correct_categories: ["Tonalità", "Intervalli"],
            user_id: "user_test",
            dictation_type_id: 2
        };

        client.query.mockResolvedValue({ rows: [deletedDictation] });

        const response = await request(app).delete("/dictations/1");

        expect(response.status).toBe(200);
        expect(response.body).toEqual(deletedDictation);
        expect(withUserContext).toHaveBeenCalledWith("user_test", expect.any(Function));
        expect(client.query).toHaveBeenCalledWith(
            expect.stringContaining("DELETE FROM dictations"),
            [1, "user_test"]
        );
    });

    test("returns 500 when deleting a dictation fails", async function () {
        getAuth.mockReturnValue({ isAuthenticated: true, userId: "user_test" });
        client.query.mockRejectedValue(new Error("Database error"));

        const response = await request(app).delete("/dictations/1");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Errore durante l'eliminazione del dettato" });
    });
});