jest.mock("@google/genai", () => ({
    GoogleGenAI: jest.fn(() => ({
        models: {
            generateContent: jest.fn()
        }
    }))
}));

const { GoogleGenAI } = require("@google/genai");
const { generatePracticeInsight } = require("../services/gemini");

const mockGenerateContent =
    GoogleGenAI.mock.results[0].value.models.generateContent;

beforeEach(() => {
    mockGenerateContent.mockReset();
});

test("generates a practice insight from deterministic insights", async () => {
    mockGenerateContent.mockResolvedValue({
        text: "Il rendimento è in miglioramento."
    });

    const report = {
        period: {
            type: "6-months",
            from: "2026-04-01",
            to: "2026-09-16"
        },
        summary: {
            totalDictations: 10,
            evaluatedCategories: 20,
            correctCategories: 15,
            accuracy: 75
        },
        months: [],
        types: [],
        categories: [
            {
                name: "QUESTA NON DEVE FINIRE NEL PROMPT",
                accuracy: 100
            }
        ],
        insights: {
            best: {
                categories: ["Metrica"],
                accuracy: 87.5
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

    const result = await generatePracticeInsight(report);

    expect(result).toBe("Il rendimento è in miglioramento.");

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    expect(mockGenerateContent).toHaveBeenCalledWith({
        model: "gemini-3.5-flash-lite",
        contents: expect.any(String)
    });

    const request = mockGenerateContent.mock.calls[0][0];

    expect(request.contents).toContain('"accuracy": 75');
    expect(request.contents).toContain('"Metrica"');
    expect(request.contents).toContain('"Intervalli"');
    expect(request.contents).toContain('"direction": "up"');
    expect(request.contents).toContain('"slope": 10');
    expect(request.contents).toContain("fonte di verità");
    expect(request.contents).toContain("Non ricalcolare i risultati");

    expect(request.contents).not.toContain(
        "QUESTA NON DEVE FINIRE NEL PROMPT"
    );
});