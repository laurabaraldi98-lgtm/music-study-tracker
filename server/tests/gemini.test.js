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

test("generates a practice insight from report data", async () => {
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
                name: "Metrica",
                attempts: 8,
                correct: 7,
                accuracy: 87.5
            },
            {
                name: "Intervalli",
                attempts: 4,
                correct: 2,
                accuracy: 50
            }
        ]
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
    expect(request.contents).toContain('"name": "Metrica"');
    expect(request.contents).toContain('"name": "Intervalli"');
    expect(request.contents).toContain("Non inventare valori");
    expect(request.contents).toContain("massimo 3 frasi");
});