const {
    setupPracticeReportDom,
    makeReport,
    waitForAsyncCode,
    setupGlobals
} = require("./helpers/practice-report-test-utils");

const getStatisticsReportFromServerMock = jest.fn();
const getStatisticsReportAiInsightMock = jest.fn();

let elements;
let consoleErrorSpy;
let displayPracticeReport;

beforeAll(() => {
    elements = setupPracticeReportDom();

    setupGlobals(
        getStatisticsReportFromServerMock,
        getStatisticsReportAiInsightMock
    );

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

    ({ displayPracticeReport } = require("../practice-report.js"));
});

beforeEach(() => {
    getStatisticsReportFromServerMock.mockReset();
    getStatisticsReportAiInsightMock.mockReset();

    getStatisticsReportFromServerMock.mockResolvedValue(makeReport());
    getStatisticsReportAiInsightMock.mockResolvedValue({
        aiInsight: "Commento AI di prova"
    });

    consoleErrorSpy.mockClear();

    elements.practiceReportSection.hidden = true;
    elements.practiceReportPeriod.value = "6-months";
    elements.practiceReportFrom.value = "";
    elements.practiceReportTo.value = "";

    elements.practiceReportCollection.innerHTML = `
        <option value="">
            Tutte le raccolte
        </option>
    `;

    elements.practiceReportType.innerHTML = `
        <option value="">
            Tutti i tipi
        </option>
    `;

    elements.practiceReportSummary.innerHTML = "";
    elements.practiceReportMonths.innerHTML = "";
    elements.practiceReportTypes.innerHTML = "";
    elements.practiceReportCategories.innerHTML = "";
    elements.practiceReportInsights.innerHTML = "";
    elements.practiceReportAiInsight.innerHTML = "";
    elements.practiceReportCustomPeriod.hidden = true;
});

afterAll(() => {
    consoleErrorSpy.mockRestore();
});

test("shows custom dates only for custom period", async () => {
    elements.practiceReportPeriod.value = "custom";
    elements.practiceReportPeriod.dispatchEvent(new Event("change"));

    await waitForAsyncCode();

    expect(elements.practiceReportCustomPeriod.hidden).toBe(false);

    elements.practiceReportPeriod.value = "6-months";
    elements.practiceReportPeriod.dispatchEvent(new Event("change"));

    await waitForAsyncCode();

    expect(elements.practiceReportCustomPeriod.hidden).toBe(true);
});

test("populates collection filter", () => {
    window.dispatchEvent(new Event("collections-loaded"));

    const values = Array.from(elements.practiceReportCollection.options).map(
        option => option.value
    );

    expect(values).toEqual([
        "",
        "Esame",
        "Lezione"
    ]);
});

test("populates dictation type filter", () => {
    window.dispatchEvent(new Event("dictation-types-loaded"));

    const values = Array.from(elements.practiceReportType.options).map(
        option => option.value
    );

    expect(values).toEqual([
        "",
        "1",
        "2"
    ]);

    expect(
        Array.from(elements.practiceReportType.options).map(
            option => option.textContent.trim()
        )
    ).toEqual([
        "Tutti i tipi",
        "Ritmico",
        "Melodico"
    ]);
});

test("updates dictation type filter when types change", () => {
    window.dispatchEvent(new Event("dictation-types-changed"));

    const values = Array.from(elements.practiceReportType.options).map(option => option.value);

    expect(values).toEqual(["", "1", "2"]);
});

test("loads report with selected filters", async () => {
    window.dispatchEvent(new Event("collections-loaded"));
    window.dispatchEvent(new Event("dictation-types-loaded"));

    elements.practiceReportCollection.value = "Esame";
    elements.practiceReportType.value = "2";

    await displayPracticeReport();

    expect(getStatisticsReportFromServerMock).toHaveBeenCalledWith({
        period: "6-months",
        collection: "Esame",
        dictationTypeId: "2"
    });
});

test("adds custom dates to filters", async () => {
    elements.practiceReportPeriod.value = "custom";
    elements.practiceReportFrom.value = "2026-01-01";
    elements.practiceReportTo.value = "2026-06-30";

    await displayPracticeReport();

    expect(getStatisticsReportFromServerMock).toHaveBeenCalledWith({
        period: "custom",
        collection: null,
        dictationTypeId: null,
        from: "2026-01-01",
        to: "2026-06-30"
    });
});

test("displays report summary cards", async () => {
    await displayPracticeReport();

    const cards = elements.practiceReportSummary.querySelectorAll(
        ".practice-report-summary-card"
    );

    expect(cards).toHaveLength(4);

    expect(cards[0].textContent).toContain("8");
    expect(cards[0].textContent).toContain("Dettati");

    expect(cards[1].textContent).toContain("20");
    expect(cards[1].textContent).toContain("Categorie valutate");

    expect(cards[2].textContent).toContain("15");
    expect(cards[2].textContent).toContain("Corrette");

    expect(cards[3].textContent).toContain("75%");
    expect(cards[3].textContent).toContain("Accuratezza");
});

test("shows dash when summary accuracy is null", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            summary: {
                totalDictations: 0,
                evaluatedCategories: 0,
                correctCategories: 0,
                accuracy: null
            }
        })
    );

    await displayPracticeReport();

    const cards = elements.practiceReportSummary.querySelectorAll(
        ".practice-report-summary-card"
    );

    expect(cards[3].textContent).toContain("—");
    expect(cards[3].textContent).toContain("Accuratezza");
});

test("requests AI analysis after loading the report", async () => {
    const report = makeReport();

    getStatisticsReportFromServerMock.mockResolvedValueOnce(report);

    await displayPracticeReport();

    expect(getStatisticsReportAiInsightMock).toHaveBeenCalledTimes(1);
    expect(getStatisticsReportAiInsightMock).toHaveBeenCalledWith(report);
});

test("displays AI analysis when it is loaded", async () => {
    getStatisticsReportAiInsightMock.mockResolvedValueOnce({
        aiInsight: "Analisi AI caricata"
    });

    await displayPracticeReport();

    expect(elements.practiceReportAiInsight.textContent).toContain(
        "Analisi AI caricata"
    );
});

test("shows loading message while AI analysis is pending", async () => {
    let resolveAi;

    getStatisticsReportAiInsightMock.mockReturnValueOnce(
        new Promise(resolve => {
            resolveAi = resolve;
        })
    );

    const promise = displayPracticeReport();

    await waitForAsyncCode();

    expect(elements.practiceReportAiInsight.textContent).toContain(
        "Generazione analisi..."
    );

    resolveAi({
        aiInsight: "Commento finale"
    });

    await promise;

    expect(elements.practiceReportAiInsight.textContent).toContain(
        "Commento finale"
    );
});

test("shows fallback text when AI analysis fails", async () => {
    getStatisticsReportAiInsightMock.mockRejectedValueOnce(
        new Error("Gemini error")
    );

    await displayPracticeReport();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(elements.practiceReportAiInsight.textContent).toContain(
        "Analisi non disponibile."
    );
});

test("shows an error when report cannot be loaded", async () => {
    getStatisticsReportFromServerMock.mockRejectedValueOnce(
        new Error("Backend error")
    );

    await displayPracticeReport();

    expect(consoleErrorSpy).toHaveBeenCalled();

    expect(elements.practiceReportSummary.textContent).toBe(
        "Non è stato possibile caricare il report."
    );

    expect(getStatisticsReportAiInsightMock).not.toHaveBeenCalled();
});