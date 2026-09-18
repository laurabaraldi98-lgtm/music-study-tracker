const {
    calculateTrendSlope,
    calculatePracticeInsights
} = require("../services/practice-insights");

test("returns null trend with fewer than two valid months", () => {
    expect(calculateTrendSlope([
        {
            accuracy: 70,
            isPartial: false
        }
    ])).toBeNull();
});

test("ignores missing and partial months", () => {
    expect(calculateTrendSlope([
        {
            accuracy: null,
            isPartial: false
        },
        {
            accuracy: 50,
            isPartial: false
        },
        {
            accuracy: 60,
            isPartial: false
        },
        {
            accuracy: 100,
            isPartial: true
        }
    ])).toBe(10);
});

test("calculates positive trend", () => {
    expect(calculateTrendSlope([
        {
            accuracy: 40,
            isPartial: false
        },
        {
            accuracy: 50,
            isPartial: false
        },
        {
            accuracy: 60,
            isPartial: false
        }
    ])).toBe(10);
});

test("calculates negative trend", () => {
    expect(calculateTrendSlope([
        {
            accuracy: 80,
            isPartial: false
        },
        {
            accuracy: 70,
            isPartial: false
        },
        {
            accuracy: 60,
            isPartial: false
        }
    ])).toBe(-10);
});

test("calculates stable trend", () => {
    expect(calculateTrendSlope([
        {
            accuracy: 60,
            isPartial: false
        },
        {
            accuracy: 60,
            isPartial: false
        }
    ])).toBe(0);
});

test("calculates best and worst categories", () => {
    const result = calculatePracticeInsights({
        months: [
            {
                accuracy: 50,
                isPartial: false
            },
            {
                accuracy: 70,
                isPartial: false
            }
        ],
        categories: [
            {
                name: "Ritmo",
                accuracy: 100
            },
            {
                name: "Intervalli",
                accuracy: 50
            },
            {
                name: "Soprano",
                accuracy: 50
            }
        ]
    });

    expect(result).toEqual({
        best: {
            categories: ["Ritmo"],
            accuracy: 100
        },
        improvement: {
            categories: ["Intervalli", "Soprano"],
            accuracy: 50,
            allEqual: false
        },
        trend: {
            direction: "up",
            slope: 20
        }
    });
});

test("keeps all tied best categories", () => {
    const result = calculatePracticeInsights({
        months: [],
        categories: [
            {
                name: "Ritmo",
                accuracy: 100
            },
            {
                name: "Metrica",
                accuracy: 100
            },
            {
                name: "Intervalli",
                accuracy: 50
            }
        ]
    });

    expect(result.best).toEqual({
        categories: ["Ritmo", "Metrica"],
        accuracy: 100
    });
});

test("marks categories as equal when all accuracies match", () => {
    const result = calculatePracticeInsights({
        months: [],
        categories: [
            {
                name: "Ritmo",
                accuracy: 50
            },
            {
                name: "Intervalli",
                accuracy: 50
            }
        ]
    });

    expect(result.improvement).toEqual({
        categories: ["Ritmo", "Intervalli"],
        accuracy: 50,
        allEqual: true
    });

    expect(result.trend).toEqual({
        direction: "insufficient",
        slope: null
    });
});

test("returns empty category insights when there are no categories", () => {
    const result = calculatePracticeInsights({
        months: [],
        categories: []
    });

    expect(result).toEqual({
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

test("returns down direction for negative trend", () => {
    const result = calculatePracticeInsights({
        months: [
            {
                accuracy: 80,
                isPartial: false
            },
            {
                accuracy: 60,
                isPartial: false
            }
        ],
        categories: []
    });

    expect(result.trend).toEqual({
        direction: "down",
        slope: -20
    });
});

test("returns stable direction for zero trend", () => {
    const result = calculatePracticeInsights({
        months: [
            {
                accuracy: 60,
                isPartial: false
            },
            {
                accuracy: 60,
                isPartial: false
            }
        ],
        categories: []
    });

    expect(result.trend).toEqual({
        direction: "stable",
        slope: 0
    });
});