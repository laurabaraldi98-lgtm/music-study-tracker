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

const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

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

    const values = Array.from(practiceReportCollection.options).map(option => option.value);

    expect(values).toEqual([
        "",
        "Esame",
        "Lezione"
    ]);
});

test("populates dictation type filter", () => {
    window.dispatchEvent(new Event("dictation-types-loaded"));

    const values = Array.from(practiceReportType.options).map(option => option.value);

    expect(values).toEqual([
        "",
        "1",
        "2"
    ]);

    expect(
        Array.from(practiceReportType.options).map(option => option.textContent.trim())
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

test("shows no data when accuracy is null", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({ accuracy: null })
    );

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(practiceReportSummary.textContent).toContain("Accuratezza: Nessun dato");
});

test("displays monthly report data", async () => {
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

    expect(practiceReportMonths.textContent).toContain("Agosto 2026");
    expect(practiceReportMonths.textContent).toContain("Dettati completati: 5");
    expect(practiceReportMonths.textContent).toContain("Accuratezza: 70%");
});

test("shows no data for empty month", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 0,
            evaluatedCategories: 0,
            correctCategories: 0,
            accuracy: null
        },
        months: [
            {
                month: "2026-08",
                totalDictations: 0,
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

    expect(practiceReportMonths.textContent).toContain("Nessun dato");
});

test("displays positive monthly difference", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 5,
            evaluatedCategories: 10,
            correctCategories: 8,
            accuracy: 80
        },
        months: [
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 8,
                accuracy: 80,
                differenceFromPreviousMonth: 12.5,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(practiceReportMonths.textContent)
        .toContain("Variazione: +12.5 punti percentuali");
});

test("displays negative monthly difference", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 5,
            evaluatedCategories: 10,
            correctCategories: 4,
            accuracy: 40
        },
        months: [
            {
                month: "2026-08",
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 4,
                accuracy: 40,
                differenceFromPreviousMonth: -10,
                isPartial: false
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(practiceReportMonths.textContent)
        .toContain("Variazione: -10 punti percentuali");
});

test("shows partial for a partial past month", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 3,
            evaluatedCategories: 6,
            correctCategories: 3,
            accuracy: 50
        },
        months: [
            {
                month: "2026-08",
                totalDictations: 3,
                evaluatedCategories: 6,
                correctCategories: 3,
                accuracy: 50,
                differenceFromPreviousMonth: null,
                isPartial: true
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(practiceReportMonths.textContent).toContain("Parziale");
});

test("shows in progress for current month", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce({
        summary: {
            totalDictations: 5,
            evaluatedCategories: 9,
            correctCategories: 4,
            accuracy: 44.4
        },
        months: [
            {
                month: "2026-09",
                totalDictations: 5,
                evaluatedCategories: 9,
                correctCategories: 4,
                accuracy: 44.4,
                differenceFromPreviousMonth: null,
                isPartial: true
            }
        ]
    });

    showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(practiceReportMonths.textContent).toContain("In corso");
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

test("shows no accuracy when month has dictations but no evaluated categories", async () => {
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

    expect(practiceReportMonths.textContent)
        .toContain("Dettati completati: 2");

    expect(practiceReportMonths.textContent)
        .toContain("Accuratezza: Nessun dato");
});