const showPracticeReportButton = document.getElementById(
    "show-practice-report-button"
);

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

async function displayPracticeReport() {
    const filters = {
        period: practiceReportPeriod.value,
        collection:
            practiceReportCollection.value || null,
        dictationTypeId:
            practiceReportType.value || null
    };

    if (practiceReportPeriod.value === "custom") {
        filters.from = practiceReportFrom.value || null;
        filters.to = practiceReportTo.value || null;
    }

    let report;

    try {
        report = await getStatisticsReportFromServer(filters);
    } catch (error) {
        console.error(error);

        practiceReportSummary.textContent =
            "Non è stato possibile caricare il report.";

        return;
    }

    practiceReportSummary.innerHTML = "";

    const totalDictations = document.createElement("p");
    totalDictations.textContent =
        `Dettati completati: ${report.summary.totalDictations}`;

    const evaluatedCategories = document.createElement("p");
    evaluatedCategories.textContent =
        `Categorie valutate: ${report.summary.evaluatedCategories}`;

    const correctCategories = document.createElement("p");
    correctCategories.textContent =
        `Categorie corrette: ${report.summary.correctCategories}`;

    const accuracy = document.createElement("p");

    accuracy.textContent =
        report.summary.accuracy == null
            ? "Accuratezza: Nessun dato"
            : `Accuratezza: ${report.summary.accuracy}%`;

    practiceReportSummary.appendChild(totalDictations);
    practiceReportSummary.appendChild(evaluatedCategories);
    practiceReportSummary.appendChild(correctCategories);
    practiceReportSummary.appendChild(accuracy);
}

showPracticeReportButton.addEventListener(
    "click",
    function () {
        practiceReportSection.hidden =
            !practiceReportSection.hidden;

        if (practiceReportSection.hidden) {
            showPracticeReportButton.textContent =
                "Vedi report progressi";
        } else {
            showPracticeReportButton.textContent =
                "Nascondi report progressi";

            displayPracticeReport();
        }
    }
);

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