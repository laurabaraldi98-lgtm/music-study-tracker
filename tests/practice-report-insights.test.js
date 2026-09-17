const {
    setupPracticeReportDom
} = require(
    "./helpers/practice-report-test-utils"
);

const {
    displayPracticeReportInsights,
    calculateTrendSlope
} = require(
    "../practice-report-insights.js"
);

let elements;

beforeEach(() => {
    elements =
        setupPracticeReportDom();
});

test(
    "shows best and worst category",
    () => {
        displayPracticeReportInsights({
            categories: [
                {
                    name: "Ritmo",
                    attempts: 1,
                    correct: 1,
                    accuracy: 100
                },
                {
                    name: "Intervalli",
                    attempts: 4,
                    correct: 2,
                    accuracy: 50
                }
            ],
            months: []
        });

        expect(
            elements.practiceReportInsights.textContent
        ).toContain(
            "Miglior risultato: Ritmo (100%)"
        );

        expect(
            elements.practiceReportInsights.textContent
        ).toContain(
            "Area da migliorare: Intervalli (50%)"
        );
    }
);

test(
    "includes category with one attempt",
    () => {
        displayPracticeReportInsights({
            categories: [
                {
                    name: "Soprano",
                    attempts: 1,
                    correct: 1,
                    accuracy: 100
                }
            ],
            months: []
        });

        expect(
            elements.practiceReportInsights.textContent
        ).toContain(
            "Miglior risultato: Soprano (100%)"
        );
    }
);

test(
    "shows no category data when categories are empty",
    () => {
        displayPracticeReportInsights({
            categories: [],
            months: []
        });

        expect(
            elements.practiceReportInsights.textContent
        ).toContain(
            "Miglior risultato: nessun dato"
        );

        expect(
            elements.practiceReportInsights.textContent
        ).toContain(
            "Area da migliorare: nessun dato"
        );
    }
);

test(
    "shows no improvement area when categories have same accuracy",
    () => {
        displayPracticeReportInsights({
            categories: [
                {
                    name: "Ritmo",
                    attempts: 2,
                    correct: 1,
                    accuracy: 50
                },
                {
                    name: "Intervalli",
                    attempts: 4,
                    correct: 2,
                    accuracy: 50
                }
            ],
            months: []
        });

        expect(
            elements.practiceReportInsights.textContent
        ).toContain(
            "Area da migliorare: nessuna categoria emerge rispetto alle altre"
        );
    }
);

test(
    "returns null when fewer than two valid months exist",
    () => {
        expect(
            calculateTrendSlope([
                {
                    month: "2026-09",
                    accuracy: 70,
                    isPartial: false
                }
            ])
        ).toBeNull();
    }
);

test(
    "ignores months without accuracy",
    () => {
        expect(
            calculateTrendSlope([
                {
                    month: "2026-06",
                    accuracy: null,
                    isPartial: false
                },
                {
                    month: "2026-07",
                    accuracy: 50,
                    isPartial: false
                },
                {
                    month: "2026-08",
                    accuracy: 60,
                    isPartial: false
                }
            ])
        ).toBe(10);
    }
);

test(
    "ignores partial months",
    () => {
        expect(
            calculateTrendSlope([
                {
                    month: "2026-07",
                    accuracy: 50,
                    isPartial: false
                },
                {
                    month: "2026-08",
                    accuracy: 60,
                    isPartial: false
                },
                {
                    month: "2026-09",
                    accuracy: 100,
                    isPartial: true
                }
            ])
        ).toBe(10);
    }
);

test(
    "calculates positive trend using all valid months",
    () => {
        expect(
            calculateTrendSlope([
                {
                    month: "2026-04",
                    accuracy: 40,
                    isPartial: false
                },
                {
                    month: "2026-05",
                    accuracy: 48,
                    isPartial: false
                },
                {
                    month: "2026-06",
                    accuracy: 44,
                    isPartial: false
                },
                {
                    month: "2026-07",
                    accuracy: 57,
                    isPartial: false
                },
                {
                    month: "2026-08",
                    accuracy: 63,
                    isPartial: false
                },
                {
                    month: "2026-09",
                    accuracy: 68,
                    isPartial: false
                }
            ])
        ).toBe(5.7);
    }
);

test(
    "calculates negative trend",
    () => {
        expect(
            calculateTrendSlope([
                {
                    month: "2026-04",
                    accuracy: 80,
                    isPartial: false
                },
                {
                    month: "2026-05",
                    accuracy: 70,
                    isPartial: false
                },
                {
                    month: "2026-06",
                    accuracy: 60,
                    isPartial: false
                }
            ])
        ).toBe(-10);
    }
);

test(
    "calculates stable trend",
    () => {
        expect(
            calculateTrendSlope([
                {
                    month: "2026-04",
                    accuracy: 60,
                    isPartial: false
                },
                {
                    month: "2026-05",
                    accuracy: 60,
                    isPartial: false
                },
                {
                    month: "2026-06",
                    accuracy: 60,
                    isPartial: false
                }
            ])
        ).toBe(0);
    }
);

test(
    "shows insufficient trend data",
    () => {
        displayPracticeReportInsights({
            categories: [],
            months: [
                {
                    month: "2026-09",
                    accuracy: 70,
                    isPartial: false
                }
            ]
        });

        expect(
            elements.practiceReportInsights.textContent
        ).toContain(
            "Tendenza del periodo: dati insufficienti"
        );
    }
);

test(
    "shows improving trend",
    () => {
        displayPracticeReportInsights({
            categories: [],
            months: [
                {
                    month: "2026-07",
                    accuracy: 50,
                    isPartial: false
                },
                {
                    month: "2026-08",
                    accuracy: 60,
                    isPartial: false
                },
                {
                    month: "2026-09",
                    accuracy: 70,
                    isPartial: false
                }
            ]
        });

        expect(
            elements.practiceReportInsights.textContent
        ).toContain(
            "Tendenza del periodo: in miglioramento (+10 punti/mese)"
        );
    }
);

test(
    "shows declining trend",
    () => {
        displayPracticeReportInsights({
            categories: [],
            months: [
                {
                    month: "2026-07",
                    accuracy: 80,
                    isPartial: false
                },
                {
                    month: "2026-08",
                    accuracy: 70,
                    isPartial: false
                },
                {
                    month: "2026-09",
                    accuracy: 60,
                    isPartial: false
                }
            ]
        });

        expect(
            elements.practiceReportInsights.textContent
        ).toContain(
            "Tendenza del periodo: in calo (-10 punti/mese)"
        );
    }
);

test(
    "shows stable trend",
    () => {
        displayPracticeReportInsights({
            categories: [],
            months: [
                {
                    month: "2026-07",
                    accuracy: 60,
                    isPartial: false
                },
                {
                    month: "2026-08",
                    accuracy: 60,
                    isPartial: false
                },
                {
                    month: "2026-09",
                    accuracy: 60,
                    isPartial: false
                }
            ]
        });

        expect(
            elements.practiceReportInsights.textContent
        ).toContain(
            "Tendenza del periodo: stabile"
        );
    }
);