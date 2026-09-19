const practiceReportSection = document.getElementById(
    "practice-report-section"
);

const practiceReportPeriod = document.getElementById(
    "practice-report-period"
);

const practiceReportCustomPeriod = document.getElementById(
    "practice-report-custom-period"
);

const practiceReportFrom = document.getElementById(
    "practice-report-from"
);

const practiceReportTo = document.getElementById(
    "practice-report-to"
);

const practiceReportCollection = document.getElementById(
    "practice-report-collection"
);

const practiceReportType = document.getElementById(
    "practice-report-type"
);

const practiceReportSummary = document.getElementById(
    "practice-report-summary"
);

let renderPracticeReportMonths;
let renderPracticeReportTypes;
let renderPracticeReportCategories;
let renderPracticeReportInsights;
let renderPracticeReportAiInsight;

/* istanbul ignore else */
if (
    typeof module !== "undefined" &&
    module.exports
) {
    renderPracticeReportMonths =
        require("./practice-report-months.js")
            .displayPracticeReportMonths;

    renderPracticeReportTypes =
        require("./practice-report-types.js")
            .displayPracticeReportTypes;

    renderPracticeReportCategories =
        require("./practice-report-categories.js")
            .displayPracticeReportCategories;

    renderPracticeReportInsights =
        require("./practice-report-insights.js")
            .displayPracticeReportInsights;

    renderPracticeReportAiInsight =
        require("./practice-report-ai.js")
            .displayPracticeReportAiInsight;
} else {
    renderPracticeReportMonths = displayPracticeReportMonths;
    renderPracticeReportTypes = displayPracticeReportTypes;
    renderPracticeReportCategories = displayPracticeReportCategories;
    renderPracticeReportInsights = displayPracticeReportInsights;
    renderPracticeReportAiInsight = displayPracticeReportAiInsight;
}

function updateCustomPeriodVisibility() {
    practiceReportCustomPeriod.hidden =
        practiceReportPeriod.value !== "custom";
}

function populatePracticeReportCollections() {
    practiceReportCollection.innerHTML = `
        <option value="">
            Tutte le raccolte
        </option>
    `;

    for (const collection of collections) {
        const option = document.createElement("option");
        option.value = collection.name;
        option.textContent = collection.name;

        practiceReportCollection.appendChild(option);
    }
}

function populatePracticeReportTypes() {
    practiceReportType.innerHTML = `
        <option value="">
            Tutti i tipi
        </option>
    `;

    for (const type of dictationTypes) {
        const option = document.createElement("option");
        option.value = String(type.id);
        option.textContent = type.name;

        practiceReportType.appendChild(option);
    }
}

function createSummaryCard(value, label) {
    const card = document.createElement("div");
    card.className = "practice-report-summary-card";

    const valueElement = document.createElement("span");
    valueElement.className = "practice-report-summary-value";
    valueElement.textContent = value;

    const labelElement = document.createElement("span");
    labelElement.className = "practice-report-summary-label";
    labelElement.textContent = label;

    card.appendChild(valueElement);
    card.appendChild(labelElement);

    return card;
}

async function displayPracticeReport() {
    const filters = {
        period: practiceReportPeriod.value,
        collection:
            practiceReportCollection.value || null,
        dictationTypeId:
            practiceReportType.value || null
    };

    if (practiceReportPeriod.value === "custom") {
        filters.from =
            practiceReportFrom.value || null;

        filters.to =
            practiceReportTo.value || null;
    }

    let report;

    try {
        report =
            await getStatisticsReportFromServer(
                filters
            );
    } catch (error) {
        console.error(error);

        practiceReportSummary.textContent =
            "Non è stato possibile caricare il report.";

        return;
    }

    practiceReportSummary.innerHTML = "";

    const accuracyValue =
        report.summary.accuracy == null
            ? "—"
            : `${report.summary.accuracy}%`;

    practiceReportSummary.appendChild(
        createSummaryCard(
            report.summary.totalDictations,
            "Dettati"
        )
    );

    practiceReportSummary.appendChild(
        createSummaryCard(
            report.summary.evaluatedCategories,
            "Categorie valutate"
        )
    );

    practiceReportSummary.appendChild(
        createSummaryCard(
            report.summary.correctCategories,
            "Corrette"
        )
    );

    practiceReportSummary.appendChild(
        createSummaryCard(
            accuracyValue,
            "Accuratezza"
        )
    );

    renderPracticeReportMonths(report);
    renderPracticeReportTypes(report.types);
    renderPracticeReportCategories(report.categories);
    renderPracticeReportInsights(report);
    renderPracticeReportAiInsight("Generazione analisi...");

    try {
        const aiResult =
            await getStatisticsReportAiInsight(
                report
            );

        renderPracticeReportAiInsight(
            aiResult.aiInsight
        );
    } catch (error) {
        console.error(error);

        renderPracticeReportAiInsight(
            "Analisi non disponibile."
        );
    }
}

practiceReportPeriod.addEventListener(
    "change",
    function () {
        updateCustomPeriodVisibility();
        displayPracticeReport();
    }
);

practiceReportCollection.addEventListener(
    "change",
    displayPracticeReport
);

practiceReportType.addEventListener(
    "change",
    displayPracticeReport
);

practiceReportFrom.addEventListener(
    "change",
    displayPracticeReport
);

practiceReportTo.addEventListener(
    "change",
    displayPracticeReport
);

updateCustomPeriodVisibility();

window.addEventListener(
    "collections-loaded",
    function () {
        populatePracticeReportCollections();
    }
);

window.addEventListener(
    "dictation-types-loaded",
    function () {
        populatePracticeReportTypes();
    }
);

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        displayPracticeReport
    };
}