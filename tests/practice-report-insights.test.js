const {
    setupPracticeReportDom
} = require(
    "./helpers/practice-report-test-utils"
);

const {
    displayPracticeReportInsights
} = require(
    "../practice-report-insights.js"
);

let elements;

beforeEach(() => {
    elements =
        setupPracticeReportDom();
});

test("shows best and worst results", () => {
    displayPracticeReportInsights({
        insights: {
            best: {
                categories: ["Ritmo", "Metrica"],
                accuracy: 100
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
    });

    expect(
        elements.practiceReportInsights.textContent
    ).toContain(
        "Miglior risultato: Ritmo, Metrica (100%)"
    );

    expect(
        elements.practiceReportInsights.textContent
    ).toContain(
        "Area da migliorare: Intervalli (50%)"
    );

    expect(
        elements.practiceReportInsights.textContent
    ).toContain(
        "Tendenza del periodo: in miglioramento (+10 punti/mese)"
    );
});

test("shows missing category data", () => {
    displayPracticeReportInsights({
        insights: {
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
        }
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

    expect(
        elements.practiceReportInsights.textContent
    ).toContain(
        "Tendenza del periodo: dati insufficienti"
    );
});

test("shows no improvement area when all categories are equal", () => {
    displayPracticeReportInsights({
        insights: {
            best: {
                categories: ["Ritmo", "Intervalli"],
                accuracy: 50
            },
            improvement: {
                categories: ["Ritmo", "Intervalli"],
                accuracy: 50,
                allEqual: true
            },
            trend: {
                direction: "stable",
                slope: 0
            }
        }
    });

    expect(
        elements.practiceReportInsights.textContent
    ).toContain(
        "Area da migliorare: nessuna categoria emerge rispetto alle altre"
    );

    expect(
        elements.practiceReportInsights.textContent
    ).toContain(
        "Tendenza del periodo: stabile"
    );
});

test("shows declining trend", () => {
    displayPracticeReportInsights({
        insights: {
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
                direction: "down",
                slope: -10
            }
        }
    });

    expect(
        elements.practiceReportInsights.textContent
    ).toContain(
        "Tendenza del periodo: in calo (-10 punti/mese)"
    );
});