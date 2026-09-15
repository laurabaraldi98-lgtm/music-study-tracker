jest.mock("@clerk/express", () => ({
    clerkMiddleware: () =>
        (request, response, next) => next(),
    getAuth: jest.fn()
}));

jest.mock("../db", () => ({
    query: jest.fn()
}));

const request = require("supertest");
const { getAuth } = require("@clerk/express");
const pool = require("../db");
const app = require("../app");

const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => { });

function authenticateUser() {
    getAuth.mockReturnValue({
        isAuthenticated: true,
        userId: "user_test"
    });
}

function makeValidPayload(overrides = {}) {
    return {
        date: "2026-08-08",
        name: "Dettato test",
        youtubeLink:
            "https://youtube.com/test",
        dictationTypeId: 2,
        collection: "Corali di Bach",
        availableCategories: [
            "Tonalità",
            "Ritmo",
            "Intervalli"
        ],
        correctCategories: [
            "Tonalità",
            "Intervalli"
        ],
        ...overrides
    };
}

function makeSavedDictation(overrides = {}) {
    return {
        id: 1,
        date: "2026-08-08",
        name: "Dettato test",
        youtube_link:
            "https://youtube.com/test",
        type: "melodic",
        collection: "Corali di Bach",
        available_categories: [
            "Tonalità",
            "Ritmo",
            "Intervalli"
        ],
        correct_categories: [
            "Tonalità",
            "Intervalli"
        ],
        user_id: "user_test",
        dictation_type_id: 2,
        dictation_type_name: "Melodico",
        ...overrides
    };
}

beforeEach(function () {
    jest.clearAllMocks();
});

afterAll(function () {
    consoleErrorSpy.mockRestore();
});

describe("GET /dictations", function () {
    test(
        "returns 401 when the user is not authenticated",
        async function () {
            getAuth.mockReturnValue({
                isAuthenticated: false
            });

            const response = await request(app)
                .get("/dictations");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                error: "Utente non autenticato"
            });

            expect(pool.query)
                .not.toHaveBeenCalled();
        }
    );

    test(
        "returns the authenticated user's dictations with their type names",
        async function () {
            authenticateUser();

            const savedDictations = [
                makeSavedDictation()
            ];

            pool.query.mockResolvedValue({
                rows: savedDictations
            });

            const response = await request(app)
                .get("/dictations");

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                savedDictations
            );

            expect(pool.query)
                .toHaveBeenCalledWith(
                    expect.stringContaining(
                        "dictation_types.name AS dictation_type_name"
                    ),
                    ["user_test"]
                );
        }
    );

    test(
        "returns 500 when retrieving dictations fails",
        async function () {
            authenticateUser();

            pool.query.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app)
                .get("/dictations");

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error:
                    "Errore durante il recupero dei dettati"
            });

            expect(consoleErrorSpy)
                .toHaveBeenCalled();
        }
    );
});

describe("POST /dictations", function () {
    test(
        "returns 401 when the user is not authenticated",
        async function () {
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

            expect(pool.query)
                .not.toHaveBeenCalled();
        }
    );

    test.each([
        ["missing", undefined],
        ["not a string", 123],
        ["wrongly formatted", "08-08-2026"]
    ])(
        "returns 400 when the date is %s",
        async function (_caseName, invalidDate) {
            authenticateUser();

            const payload = makeValidPayload({
                date: invalidDate
            });

            const response = await request(app)
                .post("/dictations")
                .send(payload);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "Data non valida"
            });
        }
    );

    test.each([
        ["empty", "   "],
        ["not a string", 123],
        ["too long", "a".repeat(101)]
    ])(
        "returns 400 when the dictation name is %s",
        async function (_caseName, invalidName) {
            authenticateUser();

            const response = await request(app)
                .post("/dictations")
                .send(
                    makeValidPayload({
                        name: invalidName
                    })
                );

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error:
                    "Nome del dettato non valido"
            });
        }
    );

    test.each([
        ["malformed", "not-a-valid-url"],
        ["not a string", 123],
        ["unsupported protocol", "ftp://example.com"]
    ])(
        "returns 400 when the link is %s",
        async function (_caseName, invalidLink) {
            authenticateUser();

            const response = await request(app)
                .post("/dictations")
                .send(
                    makeValidPayload({
                        youtubeLink: invalidLink
                    })
                );

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "Link non valido"
            });
        }
    );

    test.each([
        ["missing", undefined],
        ["not a number", "2"],
        ["zero", 0],
        ["negative", -1],
        ["not an integer", 1.5]
    ])(
        "returns 400 when the dictation type ID is %s",
        async function (
            _caseName,
            invalidDictationTypeId
        ) {
            authenticateUser();

            const payload = makeValidPayload({
                dictationTypeId:
                    invalidDictationTypeId
            });

            const response = await request(app)
                .post("/dictations")
                .send(payload);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error:
                    "Tipo di dettato non valido"
            });

            expect(pool.query)
                .not.toHaveBeenCalled();
        }
    );

    test.each([
        ["a number", 123],
        ["an array", ["test"]],
        ["a boolean", true]
    ])(
        "returns 400 when the collection is %s",
        async function (
            _caseName,
            invalidCollection
        ) {
            authenticateUser();

            const response = await request(app)
                .post("/dictations")
                .send(
                    makeValidPayload({
                        collection:
                            invalidCollection
                    })
                );

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "Raccolta non valida"
            });
        }
    );

    test(
        "returns 400 when the collection name is too long",
        async function () {
            authenticateUser();

            const response = await request(app)
                .post("/dictations")
                .send(
                    makeValidPayload({
                        collection:
                            "a".repeat(101)
                    })
                );

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error:
                    "Nome della raccolta troppo lungo"
            });
        }
    );

    test.each([
        ["not an array", "Tonalità"],
        [
            "contains a non-string value",
            ["Tonalità", 123]
        ]
    ])(
        "returns 400 when available categories are %s",
        async function (
            _caseName,
            invalidCategories
        ) {
            authenticateUser();

            const response = await request(app)
                .post("/dictations")
                .send(
                    makeValidPayload({
                        availableCategories:
                            invalidCategories
                    })
                );

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error:
                    "Categorie disponibili non valide"
            });
        }
    );

    test.each([
        ["not an array", "Tonalità"],
        [
            "contains a non-string value",
            ["Tonalità", 123]
        ]
    ])(
        "returns 400 when correct categories are %s",
        async function (
            _caseName,
            invalidCategories
        ) {
            authenticateUser();

            const response = await request(app)
                .post("/dictations")
                .send(
                    makeValidPayload({
                        correctCategories:
                            invalidCategories
                    })
                );

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error:
                    "Categorie corrette non valide"
            });
        }
    );

    test(
        "creates a dictation linked to the selected type",
        async function () {
            authenticateUser();

            const savedDictation =
                makeSavedDictation();

            pool.query.mockResolvedValue({
                rows: [savedDictation]
            });

            const response = await request(app)
                .post("/dictations")
                .send(
                    makeValidPayload({
                        name: "  Dettato test  "
                    })
                );

            expect(response.status).toBe(201);
            expect(response.body).toEqual(
                savedDictation
            );

            expect(pool.query)
                .toHaveBeenCalledWith(
                    expect.stringContaining(
                        "dictation_type_id"
                    ),
                    [
                        "2026-08-08",
                        "Dettato test",
                        "https://youtube.com/test",
                        2,
                        "Corali di Bach",
                        [
                            "Tonalità",
                            "Ritmo",
                            "Intervalli"
                        ],
                        [
                            "Tonalità",
                            "Intervalli"
                        ],
                        "user_test"
                    ]
                );

            expect(
                pool.query.mock.calls[0][0]
            ).toContain(
                "dictation_types.user_id = $8"
            );
        }
    );

    test(
        "creates a dictation with an HTTP link",
        async function () {
            authenticateUser();

            const savedDictation =
                makeSavedDictation({
                    youtube_link:
                        "http://example.com/test"
                });

            pool.query.mockResolvedValue({
                rows: [savedDictation]
            });

            const response = await request(app)
                .post("/dictations")
                .send(
                    makeValidPayload({
                        youtubeLink:
                            "http://example.com/test"
                    })
                );

            expect(response.status).toBe(201);
        }
    );

    test(
        "creates a dictation without a collection",
        async function () {
            authenticateUser();

            const savedDictation =
                makeSavedDictation({
                    id: 2,
                    collection: null
                });

            pool.query.mockResolvedValue({
                rows: [savedDictation]
            });

            const response = await request(app)
                .post("/dictations")
                .send(
                    makeValidPayload({
                        collection: ""
                    })
                );

            expect(response.status).toBe(201);

            expect(
                pool.query.mock.calls[0][1][4]
            ).toBeNull();
        }
    );

    test(
        "accepts an explicitly null collection",
        async function () {
            authenticateUser();

            const savedDictation =
                makeSavedDictation({
                    collection: null
                });

            pool.query.mockResolvedValue({
                rows: [savedDictation]
            });

            const response = await request(app)
                .post("/dictations")
                .send(
                    makeValidPayload({
                        collection: null
                    })
                );

            expect(response.status).toBe(201);

            expect(
                pool.query.mock.calls[0][1][4]
            ).toBeNull();
        }
    );

    test(
        "accepts an omitted collection",
        async function () {
            authenticateUser();

            const payload = makeValidPayload();

            delete payload.collection;

            pool.query.mockResolvedValue({
                rows: [
                    makeSavedDictation({
                        collection: null
                    })
                ]
            });

            const response = await request(app)
                .post("/dictations")
                .send(payload);

            expect(response.status).toBe(201);

            expect(
                pool.query.mock.calls[0][1][4]
            ).toBeNull();
        }
    );

    test(
        "returns 404 when the selected type does not belong to the user",
        async function () {
            authenticateUser();

            pool.query.mockResolvedValue({
                rows: []
            });

            const response = await request(app)
                .post("/dictations")
                .send(makeValidPayload());

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error:
                    "Tipo di dettato non trovato"
            });
        }
    );

    test(
        "returns 500 when creating a dictation fails",
        async function () {
            authenticateUser();

            pool.query.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app)
                .post("/dictations")
                .send(makeValidPayload());

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error:
                    "Errore durante il salvataggio del dettato"
            });

            expect(consoleErrorSpy)
                .toHaveBeenCalled();
        }
    );
});

describe("DELETE /dictations/:id", function () {
    test(
        "returns 401 when the user is not authenticated",
        async function () {
            getAuth.mockReturnValue({
                isAuthenticated: false
            });

            const response = await request(app)
                .delete("/dictations/1");

            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                error: "Utente non autenticato"
            });
        }
    );

    test.each([
        ["not a number", "abc"],
        ["zero", "0"],
        ["negative", "-1"],
        ["not an integer", "1.5"]
    ])(
        "returns 400 when the dictation ID is %s",
        async function (_caseName, invalidId) {
            authenticateUser();

            const response = await request(app)
                .delete(
                    `/dictations/${invalidId}`
                );

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error:
                    "ID del dettato non valido"
            });
        }
    );

    test(
        "returns 404 when the dictation is not found",
        async function () {
            authenticateUser();

            pool.query.mockResolvedValue({
                rows: []
            });

            const response = await request(app)
                .delete("/dictations/1");

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: "Dettato non trovato"
            });
        }
    );

    test(
        "deletes and returns the authenticated user's dictation",
        async function () {
            authenticateUser();

            const deletedDictation =
                makeSavedDictation();

            pool.query.mockResolvedValue({
                rows: [deletedDictation]
            });

            const response = await request(app)
                .delete("/dictations/1");

            expect(response.status).toBe(200);
            expect(response.body).toEqual(
                deletedDictation
            );

            expect(pool.query)
                .toHaveBeenCalledWith(
                    expect.stringContaining(
                        "AND user_id = $2"
                    ),
                    [
                        1,
                        "user_test"
                    ]
                );
        }
    );

    test(
        "returns 500 when deleting a dictation fails",
        async function () {
            authenticateUser();

            pool.query.mockRejectedValue(
                new Error("Database error")
            );

            const response = await request(app)
                .delete("/dictations/1");

            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error:
                    "Errore durante l'eliminazione del dettato"
            });

            expect(consoleErrorSpy)
                .toHaveBeenCalled();
        }
    );
});