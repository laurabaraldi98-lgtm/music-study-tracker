function setupPracticeReportDom() {
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
            <div id="practice-report-types"></div>
            <div id="practice-report-categories"></div>
            <div id="practice-report-insights"></div>
        </section>
    `;

    return {
        showPracticeReportButton: document.getElementById(
            "show-practice-report-button"
        ),
        practiceReportSection: document.getElementById(
            "practice-report-section"
        ),
        practiceReportPeriod: document.getElementById(
            "practice-report-period"
        ),
        practiceReportCustomPeriod: document.getElementById(
            "practice-report-custom-period"
        ),
        practiceReportFrom: document.getElementById(
            "practice-report-from"
        ),
        practiceReportTo: document.getElementById(
            "practice-report-to"
        ),
        practiceReportCollection: document.getElementById(
            "practice-report-collection"
        ),
        practiceReportType: document.getElementById(
            "practice-report-type"
        ),
        practiceReportSummary: document.getElementById(
            "practice-report-summary"
        ),
        practiceReportMonths: document.getElementById(
            "practice-report-months"
        ),
        practiceReportTypes: document.getElementById(
            "practice-report-types"
        ),
        practiceReportCategories: document.getElementById(
            "practice-report-categories"
        ),
        practiceReportInsights: document.getElementById(
            "practice-report-insights"
        )
    };
}

function makeReport(overrides = {}) {
    return {
        summary: {
            totalDictations: 8,
            evaluatedCategories: 20,
            correctCategories: 15,
            accuracy: 75
        },
        months: [],
        types: [],
        categories: [],
        ...overrides
    };
}

async function waitForAsyncCode() {
    await Promise.resolve();
    await Promise.resolve();
}

function setupGlobals(getStatisticsReportFromServerMock) {
    global.getStatisticsReportFromServer =
        getStatisticsReportFromServerMock;

    global.collections = [
        { id: 1, name: "Esame" },
        { id: 2, name: "Lezione" }
    ];

    global.dictationTypes = [
        { id: 1, name: "Ritmico" },
        { id: 2, name: "Melodico" }
    ];
}

module.exports = {
    setupPracticeReportDom,
    makeReport,
    waitForAsyncCode,
    setupGlobals
};