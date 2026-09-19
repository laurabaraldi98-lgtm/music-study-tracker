const {
    setupPracticeReportDom
} = require(
    "./helpers/practice-report-test-utils"
);

const {
    displayPracticeReportCategories
} = require(
    "../practice-report-categories.js"
);

let elements;

beforeEach(() => {
    elements =
        setupPracticeReportDom();
});

test(
    "renders category bars",
    () => {
        displayPracticeReportCategories([
            {
                name: "Intervalli",
                attempts: 10,
                correct: 8,
                accuracy: 80
            },
            {
                name: "Accordi",
                attempts: 5,
                correct: 2,
                accuracy: 40
            }
        ]);

        const rows =
            elements.practiceReportCategories
                .querySelectorAll(
                    ".practice-report-category-row"
                );

        const fills =
            elements.practiceReportCategories
                .querySelectorAll(
                    ".practice-report-category-bar-fill"
                );

        expect(rows).toHaveLength(2);
        expect(fills).toHaveLength(2);

        expect(
            elements.practiceReportCategories.textContent
        ).toContain("Intervalli");

        expect(
            elements.practiceReportCategories.textContent
        ).toContain("Accordi");

        expect(
            fills[0].style.width
        ).toBe("80%");

        expect(
            fills[1].style.width
        ).toBe("40%");
    }
);

test(
    "shows no data when categories are empty",
    () => {
        displayPracticeReportCategories([]);

        expect(
            elements.practiceReportCategories.textContent
        ).toContain(
            "Nessun dato"
        );

        expect(
            elements.practiceReportCategories
                .querySelectorAll(
                    ".practice-report-category-row"
                )
        ).toHaveLength(0);
    }
);

test(
    "renders category even with one attempt",
    () => {
        displayPracticeReportCategories([
            {
                name: "Ritmo",
                attempts: 1,
                correct: 1,
                accuracy: 100
            }
        ]);

        expect(
            elements.practiceReportCategories.textContent
        ).toContain(
            "Ritmo"
        );

        expect(
            elements.practiceReportCategories.textContent
        ).toContain(
            "100%"
        );

        const fill =
            elements.practiceReportCategories
                .querySelector(
                    ".practice-report-category-bar-fill"
                );

        expect(
            fill.style.width
        ).toBe("100%");
    }
);

test(
    "shows category popup on mouse enter",
    () => {
        displayPracticeReportCategories([
            {
                name: "Intervalli",
                attempts: 10,
                correct: 8,
                accuracy: 80
            }
        ]);

        const bar =
            elements.practiceReportCategories
                .querySelector(
                    ".practice-report-category-bar"
                );

        const popup =
            elements.practiceReportCategories
                .querySelector(
                    ".practice-report-category-popup"
                );

        bar.dispatchEvent(
            new Event("mouseenter")
        );

        expect(
            popup.hidden
        ).toBe(false);

        expect(
            popup.textContent
        ).toContain(
            "Intervalli"
        );

        expect(
            popup.textContent
        ).toContain(
            "Tentativi: 10"
        );

        expect(
            popup.textContent
        ).toContain(
            "Corrette: 8"
        );

        expect(
            popup.textContent
        ).toContain(
            "Accuratezza: 80%"
        );
    }
);

test(
    "hides category popup on mouse leave when not pinned",
    () => {
        displayPracticeReportCategories([
            {
                name: "Intervalli",
                attempts: 10,
                correct: 8,
                accuracy: 80
            }
        ]);

        const bar =
            elements.practiceReportCategories
                .querySelector(
                    ".practice-report-category-bar"
                );

        const popup =
            elements.practiceReportCategories
                .querySelector(
                    ".practice-report-category-popup"
                );

        bar.dispatchEvent(
            new Event("mouseenter")
        );

        bar.dispatchEvent(
            new Event("mouseleave")
        );

        expect(
            popup.hidden
        ).toBe(true);
    }
);

test(
    "keeps category popup open after clicking bar",
    () => {
        displayPracticeReportCategories([
            {
                name: "Intervalli",
                attempts: 10,
                correct: 8,
                accuracy: 80
            }
        ]);

        const bar =
            elements.practiceReportCategories
                .querySelector(
                    ".practice-report-category-bar"
                );

        const popup =
            elements.practiceReportCategories
                .querySelector(
                    ".practice-report-category-popup"
                );

        bar.dispatchEvent(
            new Event("click")
        );

        bar.dispatchEvent(
            new Event("mouseleave")
        );

        expect(
            bar.classList.contains("pinned")
        ).toBe(true);

        expect(
            popup.hidden
        ).toBe(false);
    }
);

test(
    "closes pinned category popup when clicking same bar again",
    () => {
        displayPracticeReportCategories([
            {
                name: "Intervalli",
                attempts: 10,
                correct: 8,
                accuracy: 80
            }
        ]);

        const bar =
            elements.practiceReportCategories
                .querySelector(
                    ".practice-report-category-bar"
                );

        const popup =
            elements.practiceReportCategories
                .querySelector(
                    ".practice-report-category-popup"
                );

        bar.dispatchEvent(
            new Event("click")
        );

        expect(
            popup.hidden
        ).toBe(false);

        bar.dispatchEvent(
            new Event("click")
        );

        expect(
            bar.classList.contains("pinned")
        ).toBe(false);

        expect(
            popup.hidden
        ).toBe(true);
    }
);

test(
    "moves pinned category popup to another bar",
    () => {
        displayPracticeReportCategories([
            {
                name: "Intervalli",
                attempts: 10,
                correct: 8,
                accuracy: 80
            },
            {
                name: "Accordi",
                attempts: 5,
                correct: 2,
                accuracy: 40
            }
        ]);

        const bars =
            elements.practiceReportCategories
                .querySelectorAll(
                    ".practice-report-category-bar"
                );

        const popups =
            elements.practiceReportCategories
                .querySelectorAll(
                    ".practice-report-category-popup"
                );

        bars[0].dispatchEvent(
            new Event("click")
        );

        expect(
            popups[0].hidden
        ).toBe(false);

        bars[1].dispatchEvent(
            new Event("click")
        );

        expect(
            bars[0].classList.contains("pinned")
        ).toBe(false);

        expect(
            popups[0].hidden
        ).toBe(true);

        expect(
            bars[1].classList.contains("pinned")
        ).toBe(true);

        expect(
            popups[1].hidden
        ).toBe(false);
    }
);