const express = require("express");
const request = require("supertest");
const pool = require("../db");
const { getAuth } = require("@clerk/express");
const { generatePracticeInsight } = require("../services/gemini");

jest.mock("../db", () => ({
    query: jest.fn()
}));

jest.mock("@clerk/express", () => ({
    getAuth: jest.fn()
}));

jest.mock("../services/gemini", () => ({
    generatePracticeInsight: jest.fn()
}));

const statisticsRouter = require("../routes/statistics");

const app = express();

app.use(express.json());
app.use("/statistics", statisticsRouter);

function mockReportQueries({
    summary = {
        total_dictations: 0,
        evaluated_categories: 0,
        correct_categories: 0,
        first_date: null,
        last_date: null
    },
    months = [],
    days = [],
    types = [],
    categories = []
} = {}) {
    pool.query
        .mockResolvedValueOnce({ rows: [summary] })
        .mockResolvedValueOnce({ rows: months })
        .mockResolvedValueOnce({ rows: days })
        .mockResolvedValueOnce({ rows: types })
        .mockResolvedValueOnce({ rows: categories });
}

beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-16T12:00:00.000Z"));
});

beforeEach(() => {
    pool.query.mockReset();
    getAuth.mockReset();
    generatePracticeInsight.mockReset();

    getAuth.mockReturnValue({
        isAuthenticated: true,
        userId: "user_test"
    });

    generatePracticeInsight.mockResolvedValue("Commento AI di prova");
});

afterAll(() => {
    jest.useRealTimers();
});

test("rejects unauthenticated users", async () => {
    getAuth.mockReturnValue({
        isAuthenticated: false,
        userId: null
    });

    const response = await request(app).get("/statistics/report");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
        error: "Utente non autenticato"
    });
    expect(pool.query).not.toHaveBeenCalled();
    expect(generatePracticeInsight).not.toHaveBeenCalled();
});

test("uses the last six months by default", async () => {
    mockReportQueries();

    const response = await request(app).get("/statistics/report");

    expect(response.status).toBe(200);
    expect(response.body.period).toEqual({
        type: "6-months",
        from: "2026-04-01",
        to: "2026-09-16"
    });

    expect(response.body.insights).toEqual({
        best: {
            categories: [],
            accuracy: null
        },
        improvement: {
            categories: [],
            accuracy: null,
            allEqual: false
        },
        trend: {
            direction: "insufficient",
            slope: null
        }
    });

    expect(response.body.aiInsight).toBeUndefined();
    expect(generatePracticeInsight).not.toHaveBeenCalled();

    expect(pool.query).toHaveBeenCalledTimes(5);

    for (const call of pool.query.mock.calls) {
        expect(call[1]).toEqual([
            "user_test",
            "2026-04-01",
            "2026-09-16",
            null,
            null
        ]);
    }
});

test.each([
    ["current-month", "2026-09-01", "2026-09-16"],
    ["previous-month", "2026-08-01", "2026-08-31"],
    ["3-months", "2026-07-01", "2026-09-16"],
    ["6-months", "2026-04-01", "2026-09-16"]
])("resolves the %s period", async (period, expectedFrom, expectedTo) => {
    mockReportQueries();

    const response = await request(app)
        .get("/statistics/report")
        .query({ period });

    expect(response.status).toBe(200);
    expect(response.body.period).toEqual({
        type: period,
        from: expectedFrom,
        to: expectedTo
    });
});

test("supports the complete history", async () => {
    mockReportQueries({
        summary: {
            total_dictations: 2,
            evaluated_categories: 4,
            correct_categories: 3,
            first_date: "2026-01-12",
            last_date: "2026-03-20"
        },
        months: [
            {
                month: "2026-01-01",
                total_dictations: 1,
                evaluated_categories: 2,
                correct_categories: 1
            },
            {
                month: "2026-03-01",
                total_dictations: 1,
                evaluated_categories: 2,
                correct_categories: 2
            }
        ]
    });

    const response = await request(app)
        .get("/statistics/report")
        .query({ period: "all" });

    expect(response.status).toBe(200);

    expect(response.body.period).toEqual({
        type: "all",
        from: "2026-01-12",
        to: "2026-03-20"
    });

    expect(response.body.months).toHaveLength(3);

    expect(response.body.months[1]).toEqual({
        month: "2026-02",
        totalDictations: 0,
        evaluatedCategories: 0,
        correctCategories: 0,
        accuracy: null,
        differenceFromPreviousMonth: null,
        isPartial: false
    });

    expect(response.body.insights.trend).toEqual({
        direction: "up",
        slope: 50
    });
});

test("supports a custom period and marks partial months", async () => {
    mockReportQueries({
        summary: {
            total_dictations: 2,
            evaluated_categories: 4,
            correct_categories: 3,
            first_date: "2026-04-20",
            last_date: "2026-05-05"
        },
        months: [
            {
                month: "2026-04-01",
                total_dictations: 1,
                evaluated_categories: 2,
                correct_categories: 1
            },
            {
                month: "2026-05-01",
                total_dictations: 1,
                evaluated_categories: 2,
                correct_categories: 2
            }
        ]
    });

    const response = await request(app)
        .get("/statistics/report")
        .query({
            period: "custom",
            from: "2026-04-15",
            to: "2026-05-10"
        });

    expect(response.status).toBe(200);

    expect(response.body.period).toEqual({
        type: "custom",
        from: "2026-04-15",
        to: "2026-05-10"
    });

    expect(response.body.months[0].isPartial).toBe(true);
    expect(response.body.months[1].isPartial).toBe(true);

    expect(response.body.insights.trend).toEqual({
        direction: "insufficient",
        slope: null
    });
});

test("calculates summaries, monthly differences, types, categories and insights", async () => {
    mockReportQueries({
        summary: {
            total_dictations: 4,
            evaluated_categories: 10,
            correct_categories: 7,
            first_date: "2026-07-01",
            last_date: "2026-08-31"
        },
        months: [
            {
                month: "2026-07-01",
                total_dictations: 2,
                evaluated_categories: 4,
                correct_categories: 2
            },
            {
                month: "2026-08-01",
                total_dictations: 2,
                evaluated_categories: 6,
                correct_categories: 5
            },
        ],
        days: [
            {
                day: "2026-07-01",
                total_dictations: 2,
                evaluated_categories: 4,
                correct_categories: 2
            },
            {
                day: "2026-08-15",
                total_dictations: 2,
                evaluated_categories: 6,
                correct_categories: 5
            },
            {
                day: "2026-08-20",
                total_dictations: 1,
                evaluated_categories: 0,
                correct_categories: 0
            }
        ],
        types: [
            {
                id: 1,
                name: "Ritmico",
                total_dictations: 3,
                evaluated_categories: 8,
                correct_categories: 6
            },
            {
                id: 4,
                name: "Contrappunto",
                total_dictations: 1,
                evaluated_categories: 0,
                correct_categories: 0
            }
        ],
        categories: [
            {
                name: "Metrica",
                attempts: 5,
                correct: 4
            },
            {
                name: "Intervalli",
                attempts: 2,
                correct: 1
            }
        ]
    });

    const response = await request(app)
        .get("/statistics/report")
        .query({ period: "all" });

    expect(response.status).toBe(200);

    expect(response.body.summary).toEqual({
        totalDictations: 4,
        evaluatedCategories: 10,
        correctCategories: 7,
        accuracy: 70
    });

    expect(response.body.months[0].accuracy).toBe(50);
    expect(response.body.months[1].accuracy).toBe(83.3);
    expect(response.body.months[1].differenceFromPreviousMonth).toBe(33.3);

    expect(response.body.days).toEqual([
        {
            date: "2026-07-01",
            totalDictations: 2,
            evaluatedCategories: 4,
            correctCategories: 2,
            accuracy: 50
        },
        {
            date: "2026-08-15",
            totalDictations: 2,
            evaluatedCategories: 6,
            correctCategories: 5,
            accuracy: 83.3
        },
        {
            date: "2026-08-20",
            totalDictations: 1,
            evaluatedCategories: 0,
            correctCategories: 0,
            accuracy: null
        }
    ]);

    expect(response.body.types).toEqual([
        {
            id: 1,
            name: "Ritmico",
            totalDictations: 3,
            evaluatedCategories: 8,
            correctCategories: 6,
            accuracy: 75
        },
        {
            id: 4,
            name: "Contrappunto",
            totalDictations: 1,
            evaluatedCategories: 0,
            correctCategories: 0,
            accuracy: null
        }
    ]);

    expect(response.body.categories).toEqual([
        {
            name: "Metrica",
            attempts: 5,
            correct: 4,
            accuracy: 80
        },
        {
            name: "Intervalli",
            attempts: 2,
            correct: 1,
            accuracy: 50
        }
    ]);

    expect(response.body.insights).toEqual({
        best: {
            categories: ["Metrica"],
            accuracy: 80
        },
        improvement: {
            categories: ["Intervalli"],
            accuracy: 50,
            allEqual: false
        },
        trend: {
            direction: "up",
            slope: 33.3
        }
    });

    expect(response.body.aiInsight).toBeUndefined();
    expect(generatePracticeInsight).not.toHaveBeenCalled();
});

test("supports collection and dictation type filters", async () => {
    mockReportQueries();

    const response = await request(app)
        .get("/statistics/report")
        .query({
            collection: "  Esame  ",
            dictationTypeId: "4"
        });

    expect(response.status).toBe(200);

    expect(pool.query.mock.calls[0][1]).toEqual([
        "user_test",
        "2026-04-01",
        "2026-09-16",
        "Esame",
        4
    ]);
});

test("rejects an invalid period", async () => {
    const response = await request(app)
        .get("/statistics/report")
        .query({ period: "banana" });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
        error: "Periodo non valido"
    });

    expect(pool.query).not.toHaveBeenCalled();
    expect(generatePracticeInsight).not.toHaveBeenCalled();
});

test.each([
    {},
    {
        from: "2026-01-01"
    },
    {
        from: "2026/01/01",
        to: "2026-02-01"
    },
    {
        from: "2026-02-30",
        to: "2026-03-01"
    }
])("rejects invalid custom dates", async customDates => {
    const response = await request(app)
        .get("/statistics/report")
        .query({
            period: "custom",
            ...customDates
        });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("formato YYYY-MM-DD");
    expect(pool.query).not.toHaveBeenCalled();
});

test("rejects a reversed custom period", async () => {
    const response = await request(app)
        .get("/statistics/report")
        .query({
            period: "custom",
            from: "2026-05-01",
            to: "2026-04-01"
        });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
        error: "La data iniziale non può essere successiva alla data finale"
    });
});

test.each([
    "",
    "a".repeat(256)
])("rejects invalid collections", async collection => {
    const response = await request(app)
        .get("/statistics/report")
        .query({ collection });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
        error: "Raccolta non valida"
    });

    expect(pool.query).not.toHaveBeenCalled();
});

test.each([
    "0",
    "-1",
    "abc",
    "1.5"
])("rejects invalid dictation type IDs", async dictationTypeId => {
    const response = await request(app)
        .get("/statistics/report")
        .query({ dictationTypeId });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
        error: "Tipo di dettato non valido"
    });

    expect(pool.query).not.toHaveBeenCalled();
});

test("returns null accuracy when no categories were evaluated", async () => {
    mockReportQueries();

    const response = await request(app)
        .get("/statistics/report")
        .query({ period: "all" });

    expect(response.status).toBe(200);
    expect(response.body.summary.accuracy).toBeNull();
    expect(response.body.months).toEqual([]);

    expect(response.body.insights).toEqual({
        best: {
            categories: [],
            accuracy: null
        },
        improvement: {
            categories: [],
            accuracy: null,
            allEqual: false
        },
        trend: {
            direction: "insufficient",
            slope: null
        }
    });
});

test("returns 500 when the database fails", async () => {
    const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => { });

    pool.query.mockRejectedValueOnce(
        new Error("Database error")
    );

    const response = await request(app)
        .get("/statistics/report");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
        error: "Errore durante il recupero del report"
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(generatePracticeInsight).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
});

test("generates AI insight separately", async () => {
    const reportData = {
        period: {
            type: "6-months",
            from: "2026-04-01",
            to: "2026-09-16"
        },
        summary: {
            totalDictations: 5,
            evaluatedCategories: 10,
            correctCategories: 7,
            accuracy: 70
        },
        insights: {
            best: {
                categories: ["Metrica"],
                accuracy: 80
            },
            improvement: {
                categories: ["Intervalli"],
                accuracy: 50,
                allEqual: false
            },
            trend: {
                direction: "up",
                slope: 10
            }
        }
    };

    const response = await request(app)
        .post("/statistics/report/ai")
        .send(reportData);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
        aiInsight: "Commento AI di prova"
    });

    expect(generatePracticeInsight).toHaveBeenCalledTimes(1);
    expect(generatePracticeInsight).toHaveBeenCalledWith(reportData);
    expect(pool.query).not.toHaveBeenCalled();
});

test("rejects unauthenticated AI requests", async () => {
    getAuth.mockReturnValue({
        isAuthenticated: false,
        userId: null
    });

    const response = await request(app)
        .post("/statistics/report/ai")
        .send({
            period: {},
            summary: {},
            insights: {}
        });

    expect(response.status).toBe(401);

    expect(response.body).toEqual({
        error: "Utente non autenticato"
    });

    expect(generatePracticeInsight).not.toHaveBeenCalled();
});

test("rejects invalid AI report data", async () => {
    const response = await request(app)
        .post("/statistics/report/ai")
        .send({
            period: {},
            summary: {}
        });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
        error: "Dati del report non validi"
    });

    expect(generatePracticeInsight).not.toHaveBeenCalled();
});

test("returns 500 when separate Gemini request fails", async () => {
    const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => { });

    generatePracticeInsight.mockRejectedValueOnce(
        new Error("Gemini error")
    );

    const response = await request(app)
        .post("/statistics/report/ai")
        .send({
            period: {
                type: "6-months"
            },
            summary: {
                totalDictations: 5
            },
            insights: {
                trend: {
                    direction: "up"
                }
            }
        });

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
        error: "Errore durante la generazione dell'analisi"
    });

    expect(generatePracticeInsight).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
});