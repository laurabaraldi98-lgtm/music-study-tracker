document.body.innerHTML = `
    <button id="show-practice-report-button">Vedi report progressi</button>

    <section id="practice-report-section" hidden>
        <select id="practice-report-period">
            <option value="6-months" selected>Ultimi 6 mesi</option>
            <option value="custom">Periodo personalizzato</option>
        </select>

        <div id="practice-report-custom-period" hidden>
            <input id="practice-report-from" type="date">
            <input id="practice-report-to" type="date">
        </div>

        <select id="practice-report-collection">
            <option value="">Tutte le raccolte</option>
        </select>

        <select id="practice-report-type">
            <option value="">Tutti i tipi</option>
        </select>

        <div id="practice-report-summary"></div>
        <div id="practice-report-months"></div>
    </section>
`;

const showPracticeReportButton = document.getElementById("show-practice-report-button");
const practiceReportSection = document.getElementById("practice-report-section");
const practiceReportPeriod = document.getElementById("practice-report-period");
const practiceReportCustomPeriod = document.getElementById("practice-report-custom-period");
const practiceReportFrom = document.getElementById("practice-report-from");
const practiceReportTo = document.getElementById("practice-report-to");
const practiceReportCollection = document.getElementById("practice-report-collection");
const practiceReportType = document.getElementById("practice-report-type");
const practiceReportSummary = document.getElementById("practice-report-summary");
const practiceReportMonths = document.getElementById("practice-report-months");

const getStatisticsReportFromServerMock = jest.fn();

global.getStatisticsReportFromServer = getStatisticsReportFromServerMock;

global.collections = [
    { id: 1, name: "Esame" },
    { id: 2, name: "Lezione" }
];

global.dictationTypes = [
    { id: 1, name: "Ritmico" },
    { id: 2, name: "Melodico" }
];

const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => { });

require("../practice-report.js");

async function waitForAsyncCode() {
    await Promise.resolve();
    await Promise.resolve();
}

function makeReport(overrides = {}) {
    return {
        summary: {
            totalDictations: 8,
            evaluatedCategories: 20,
            correctCategories: 15,
            accuracy: 75,
            ...overrides
        },
        months: []
    };
}

beforeEach(() => {
    getStatisticsReportFromServerMock.mockReset();
    getStatisticsReportFromServerMock.mockResolvedValue(makeReport());

    consoleErrorSpy.mockClear();

    practiceReportSection.hidden = true;
    showPracticeReportButton.textContent = "Vedi report progressi";

    practiceReportPeriod.value = "6-months";
    practiceReportFrom.value = "";
    practiceReportTo.value = "";

    practiceReportCollection.innerHTML = `
        <option value="">Tutte le raccolte</option>
    `;

    practiceReportType.innerHTML = `
        <option value="">Tutti i tipi</option>
    `;

    practiceReportSummary.innerHTML = "";
    practiceReportMonths.innerHTML = "";
    practiceReportCustomPeriod.hidden = true;
});

afterAll(() => {
    consoleErrorSpy.mockRestore();
});

test("shows and hides the practice report", async () => {
    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(practiceReportSection.hidden).toBe(false);
    expect(showPracticeReportButton.textContent).toBe("Nascondi report progressi");
    expect(getStatisticsReportFromServerMock).toHaveBeenCalledTimes(1);

    showPracticeReportButton.click();

    expect(practiceReportSection.hidden).toBe(true);
    expect(showPracticeReportButton.textContent).toBe("Vedi report progressi");
});

test("shows custom dates only for custom period", async () => {
    practiceReportPeriod.value = "custom";
    practiceReportPeriod.dispatchEvent(new Event("change"));
    await waitForAsyncCode();

    expect(practiceReportCustomPeriod.hidden).toBe(false);

    practiceReportPeriod.value = "6-months";
    practiceReportPeriod.dispatchEvent(new Event("change"));
    await waitForAsyncCode();

    expect(practiceReportCustomPeriod.hidden).toBe(true);
});

test("populates collection filter", () => {
    window.dispatchEvent(new Event("collections-loaded"));

    const values = Array.from(practiceReportCollection.options)
        .map(option => option.value);

    expect(values).toEqual([
        "",
        "Esame",
        "Lezione"
    ]);
});

test("populates dictation type filter", () => {
    window.dispatchEvent(new Event("dictation-types-loaded"));

    const values = Array.from(practiceReportType.options)
        .map(option => option.value);

    expect(values).toEqual([
        "",
        "1",
        "2"
    ]);

    expect(
        Array.from(practiceReportType.options)
            .map(option => option.textContent.trim())
    ).toEqual([
        "Tutti i tipi",
        "Ritmico",
        "Melodico"
    ]);
});

test("loads report with selected filters", async () => {
    window.dispatchEvent(new Event("collections-loaded"));
    window.dispatchEvent(new Event("dictation-types-loaded"));

    practiceReportCollection.value = "Esame";
    practiceReportType.value = "2";

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(getStatisticsReportFromServerMock).toHaveBeenCalledWith({
        period: "6-months",
        collection: "Esame",
        dictationTypeId: "2"
    });
});

test("adds custom dates to filters", async () => {
    practiceReportPeriod.value = "custom";
    practiceReportFrom.value = "2026-01-01";
    practiceReportTo.value = "2026-06-30";

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(getStatisticsReportFromServerMock).toHaveBeenCalledWith({
        period: "custom",
        collection: null,
        dictationTypeId: null,
        from: "2026-01-01",
        to: "2026-06-30"
    });
});

test("displays report summary", async () => {
    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(practiceReportSummary.textContent).toContain("Dettati completati: 8");
    expect(practiceReportSummary.textContent).toContain("Categorie valutate: 20");
    expect(practiceReportSummary.textContent).toContain("Categorie corrette: 15");
    expect(practiceReportSummary.textContent).toContain("Accuratezza: 75%");
});

test("shows no data when summary accuracy is null", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({ accuracy: null })
    );

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(practiceReportSummary.textContent)
        .toContain("Accuratezza: Nessun dato");
});

test("renders monthly chart with one data point", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 5,
            evaluatedCategories: 10,
            correctCategories: 7,
            accuracy: 70
        },
        months: [
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70,
                differenceFromPreviousMonth: null,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(
        practiceReportMonths.querySelector(".practice-report-chart")
    ).not.toBeNull();

    expect(
        practiceReportMonths.querySelectorAll(".practice-report-chart-point")
    ).toHaveLength(1);

    expect(practiceReportMonths.textContent).toContain("ago");
});

test("does not create a point when monthly accuracy is null", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 2,
            evaluatedCategories: 0,
            correctCategories: 0,
            accuracy: null
        },
        months: [
            {
                month: "2026-08",
                totalDictations: 2,
                evaluatedCategories: 0,
                correctCategories: 0,
                accuracy: null,
                differenceFromPreviousMonth: null,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(
        practiceReportMonths.querySelectorAll(".practice-report-chart-point")
    ).toHaveLength(0);
});

test("renders five horizontal grid lines", async () => {
    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(
        practiceReportMonths.querySelectorAll(".practice-report-chart-grid")
    ).toHaveLength(5);
});

test("connects consecutive months with a line", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 10,
            evaluatedCategories: 20,
            correctCategories: 12,
            accuracy: 60
        },
        months: [
            {
                month: "2026-07",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 5,
                accuracy: 50,
                differenceFromPreviousMonth: null,
                isPartial: false
            },
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70,
                differenceFromPreviousMonth: 20,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(
        practiceReportMonths.querySelectorAll(".practice-report-chart-line")
    ).toHaveLength(1);
});

test("does not connect points separated by a month without data", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 10,
            evaluatedCategories: 20,
            correctCategories: 12,
            accuracy: 60
        },
        months: [
            {
                month: "2026-06",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 5,
                accuracy: 50,
                differenceFromPreviousMonth: null,
                isPartial: false
            },
            {
                month: "2026-07",
                totalDictations: 0,
                evaluatedCategories: 0,
                correctCategories: 0,
                accuracy: null,
                differenceFromPreviousMonth: null,
                isPartial: false
            },
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70,
                differenceFromPreviousMonth: null,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(
        practiceReportMonths.querySelectorAll(".practice-report-chart-line")
    ).toHaveLength(0);
});

test("shows popup on mouse enter", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 5,
            evaluatedCategories: 10,
            correctCategories: 7,
            accuracy: 70
        },
        months: [
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70,
                differenceFromPreviousMonth: null,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    const point = practiceReportMonths.querySelector(
        ".practice-report-chart-point"
    );

    const popup = practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    point.dispatchEvent(new Event("mouseenter"));

    expect(popup.style.display).toBe("");
    expect(popup.textContent).toContain("Agosto 2026");
    expect(popup.textContent).toContain("Accuratezza: 70%");
    expect(popup.textContent).toContain("Dettati: 5");
    expect(popup.textContent).toContain("Categorie valutate: 10");
});

test("hides popup on mouse leave when it is not pinned", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 5,
            evaluatedCategories: 10,
            correctCategories: 7,
            accuracy: 70
        },
        months: [
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70,
                differenceFromPreviousMonth: null,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    const point = practiceReportMonths.querySelector(
        ".practice-report-chart-point"
    );

    const popup = practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    point.dispatchEvent(new Event("mouseenter"));
    point.dispatchEvent(new Event("mouseleave"));

    expect(popup.style.display).toBe("none");
});

test("keeps popup open after clicking a point", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 5,
            evaluatedCategories: 10,
            correctCategories: 7,
            accuracy: 70
        },
        months: [
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70,
                differenceFromPreviousMonth: null,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    const point = practiceReportMonths.querySelector(
        ".practice-report-chart-point"
    );

    const popup = practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    point.dispatchEvent(new Event("click"));
    point.dispatchEvent(new Event("mouseleave"));

    expect(popup.style.display).toBe("");
});

test("closes pinned popup when clicking the same point again", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 5,
            evaluatedCategories: 10,
            correctCategories: 7,
            accuracy: 70
        },
        months: [
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70,
                differenceFromPreviousMonth: null,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    const point = practiceReportMonths.querySelector(
        ".practice-report-chart-point"
    );

    const popup = practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    point.dispatchEvent(new Event("click"));

    expect(popup.style.display).toBe("");

    point.dispatchEvent(new Event("click"));

    expect(popup.style.display).toBe("none");
});

test("moves pinned popup when clicking another point", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 10,
            evaluatedCategories: 20,
            correctCategories: 12,
            accuracy: 60
        },
        months: [
            {
                month: "2026-07",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 5,
                accuracy: 50,
                differenceFromPreviousMonth: null,
                isPartial: false
            },
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70,
                differenceFromPreviousMonth: 20,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    const points = practiceReportMonths.querySelectorAll(
        ".practice-report-chart-point"
    );

    const popup = practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    points[0].dispatchEvent(new Event("click"));

    expect(popup.textContent).toContain("Luglio 2026");

    points[1].dispatchEvent(new Event("click"));

    expect(popup.textContent).toContain("Agosto 2026");
});

test("shows an error when report cannot be loaded", async () => {
    getStatisticsReportFromServerMock.mockRejectedValueOnce(
        new Error("Backend error")
    );

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(consoleErrorSpy).toHaveBeenCalled();

    expect(practiceReportSummary.textContent)
        .toBe("Non è stato possibile caricare il report.");
});

test("does not change pinned popup when hovering another point", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 10,
            evaluatedCategories: 20,
            correctCategories: 12,
            accuracy: 60
        },
        months: [
            {
                month: "2026-07",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 5,
                accuracy: 50,
                differenceFromPreviousMonth: null,
                isPartial: false
            },
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70,
                differenceFromPreviousMonth: 20,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    const points = practiceReportMonths.querySelectorAll(
        ".practice-report-chart-point"
    );

    const popup = practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    points[0].dispatchEvent(new Event("click"));

    expect(popup.textContent).toContain("Luglio 2026");

    points[1].dispatchEvent(new Event("mouseenter"));

    expect(popup.textContent).toContain("Luglio 2026");
});