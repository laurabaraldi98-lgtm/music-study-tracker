const {
    setupPracticeReportDom
} = require(
    "./helpers/practice-report-test-utils"
);

const {
    displayPracticeReportTypes
} = require(
    "../practice-report-types.js"
);

let elements;

beforeEach(() => {
    elements =
        setupPracticeReportDom();
});

test(
    "renders practice report type bars",
    () => {
        displayPracticeReportTypes([
            {
                id: 1,
                name: "Ritmico",
                totalDictations: 6,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70
            },
            {
                id: 2,
                name: "Melodico",
                totalDictations: 4,
                evaluatedCategories: 10,
                correctCategories: 5,
                accuracy: 50
            }
        ]);

        const rows =
            elements.practiceReportTypes
                .querySelectorAll(
                    ".practice-report-type-row"
                );

        const fills =
            elements.practiceReportTypes
                .querySelectorAll(
                    ".practice-report-type-bar-fill"
                );

        expect(rows).toHaveLength(2);
        expect(fills).toHaveLength(2);

        expect(
            elements.practiceReportTypes.textContent
        ).toContain("Ritmico");

        expect(
            elements.practiceReportTypes.textContent
        ).toContain("Melodico");

        expect(
            fills[0].style.width
        ).toBe("70%");

        expect(
            fills[1].style.width
        ).toBe("50%");
    }
);

test(
    "shows no data when there are no practice report types",
    () => {
        displayPracticeReportTypes([]);

        expect(
            elements.practiceReportTypes.textContent
        ).toContain(
            "Nessun dato"
        );

        expect(
            elements.practiceReportTypes
                .querySelectorAll(
                    ".practice-report-type-row"
                )
        ).toHaveLength(0);
    }
);

test(
    "renders zero width type bar when accuracy is null",
    () => {
        displayPracticeReportTypes([
            {
                id: 1,
                name: "Ritmico",
                totalDictations: 2,
                evaluatedCategories: 0,
                correctCategories: 0,
                accuracy: null
            }
        ]);

        const fill =
            elements.practiceReportTypes
                .querySelector(
                    ".practice-report-type-bar-fill"
                );

        expect(
            fill.style.width
        ).toBe("0%");

        expect(
            elements.practiceReportTypes.textContent
        ).toContain(
            "Nessun dato"
        );
    }
);

test(
    "shows type popup on mouse enter",
    () => {
        displayPracticeReportTypes([
            {
                id: 1,
                name: "Ritmico",
                totalDictations: 6,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70
            }
        ]);

        const fill =
            elements.practiceReportTypes
                .querySelector(
                    ".practice-report-type-bar-fill"
                );

        const popup =
            elements.practiceReportTypes
                .querySelector(
                    ".practice-report-type-popup"
                );

        fill.dispatchEvent(
            new Event("mouseenter")
        );

        expect(
            popup.hidden
        ).toBe(false);

        expect(
            popup.textContent
        ).toContain("Ritmico");

        expect(
            popup.textContent
        ).toContain(
            "Accuratezza: 70%"
        );

        expect(
            popup.textContent
        ).toContain(
            "Dettati: 6"
        );

        expect(
            popup.textContent
        ).toContain(
            "Categorie valutate: 10"
        );

        expect(
            popup.textContent
        ).toContain(
            "Categorie corrette: 7"
        );
    }
);

test(
    "hides type popup on mouse leave when not pinned",
    () => {
        displayPracticeReportTypes([
            {
                id: 1,
                name: "Ritmico",
                totalDictations: 6,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70
            }
        ]);

        const fill =
            elements.practiceReportTypes
                .querySelector(
                    ".practice-report-type-bar-fill"
                );

        const popup =
            elements.practiceReportTypes
                .querySelector(
                    ".practice-report-type-popup"
                );

        fill.dispatchEvent(
            new Event("mouseenter")
        );

        fill.dispatchEvent(
            new Event("mouseleave")
        );

        expect(
            popup.hidden
        ).toBe(true);
    }
);

test(
    "keeps type popup open after clicking bar",
    () => {
        displayPracticeReportTypes([
            {
                id: 1,
                name: "Ritmico",
                totalDictations: 6,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70
            }
        ]);

        const fill =
            elements.practiceReportTypes
                .querySelector(
                    ".practice-report-type-bar-fill"
                );

        const popup =
            elements.practiceReportTypes
                .querySelector(
                    ".practice-report-type-popup"
                );

        fill.dispatchEvent(
            new Event("click")
        );

        fill.dispatchEvent(
            new Event("mouseleave")
        );

        expect(
            fill.classList.contains("pinned")
        ).toBe(true);

        expect(
            popup.hidden
        ).toBe(false);
    }
);

test(
    "closes pinned type popup when clicking same bar again",
    () => {
        displayPracticeReportTypes([
            {
                id: 1,
                name: "Ritmico",
                totalDictations: 6,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70
            }
        ]);

        const fill =
            elements.practiceReportTypes
                .querySelector(
                    ".practice-report-type-bar-fill"
                );

        const popup =
            elements.practiceReportTypes
                .querySelector(
                    ".practice-report-type-popup"
                );

        fill.dispatchEvent(
            new Event("click")
        );

        expect(
            fill.classList.contains("pinned")
        ).toBe(true);

        expect(
            popup.hidden
        ).toBe(false);

        fill.dispatchEvent(
            new Event("click")
        );

        expect(
            fill.classList.contains("pinned")
        ).toBe(false);

        expect(
            popup.hidden
        ).toBe(true);
    }
);

test(
    "moves pinned type popup when clicking another bar",
    () => {
        displayPracticeReportTypes([
            {
                id: 1,
                name: "Ritmico",
                totalDictations: 6,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70
            },
            {
                id: 2,
                name: "Melodico",
                totalDictations: 4,
                evaluatedCategories: 10,
                correctCategories: 5,
                accuracy: 50
            }
        ]);

        const fills =
            elements.practiceReportTypes
                .querySelectorAll(
                    ".practice-report-type-bar-fill"
                );

        const popups =
            elements.practiceReportTypes
                .querySelectorAll(
                    ".practice-report-type-popup"
                );

        fills[0].dispatchEvent(
            new Event("click")
        );

        expect(
            fills[0].classList.contains("pinned")
        ).toBe(true);

        expect(
            popups[0].hidden
        ).toBe(false);

        fills[1].dispatchEvent(
            new Event("click")
        );

        expect(
            fills[0].classList.contains("pinned")
        ).toBe(false);

        expect(
            popups[0].hidden
        ).toBe(true);

        expect(
            fills[1].classList.contains("pinned")
        ).toBe(true);

        expect(
            popups[1].hidden
        ).toBe(false);
    }
);