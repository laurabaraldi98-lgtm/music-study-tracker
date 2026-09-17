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

const practiceReportMonths = document.getElementById(
    "practice-report-months"
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

function displayPracticeReportMonths(months) {
    practiceReportMonths.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Andamento mensile";

    practiceReportMonths.appendChild(title);

    for (const monthData of months) {
        const monthContainer = document.createElement("div");

        const monthTitle = document.createElement("h4");

        const [year, month] = monthData.month.split("-");

        const monthName = new Date(
            Number(year),
            Number(month) - 1
        ).toLocaleDateString("it-IT", {
            month: "long",
            year: "numeric"
        });

        monthTitle.textContent =
            monthName.charAt(0).toUpperCase() +
            monthName.slice(1);

        monthContainer.appendChild(monthTitle);

        if (monthData.totalDictations === 0) {
            const noData = document.createElement("p");

            noData.textContent = "Nessun dato";

            monthContainer.appendChild(noData);

            practiceReportMonths.appendChild(
                monthContainer
            );

            continue;
        }

        const totalDictations =
            document.createElement("p");

        totalDictations.textContent =
            `Dettati completati: ${monthData.totalDictations}`;

        const accuracy = document.createElement("p");

        accuracy.textContent =
            monthData.accuracy == null
                ? "Accuratezza: Nessun dato"
                : `Accuratezza: ${monthData.accuracy}%`;

        monthContainer.appendChild(totalDictations);
        monthContainer.appendChild(accuracy);

        const currentMonth = new Date()
            .toISOString()
            .slice(0, 7);

        if (monthData.month === currentMonth) {
            const inProgress = document.createElement("p");

            inProgress.textContent = "In corso";

            monthContainer.appendChild(inProgress);
        } else if (monthData.isPartial) {
            const partial = document.createElement("p");

            partial.textContent = "Parziale";

            monthContainer.appendChild(partial);
        }

        if (
            monthData.differenceFromPreviousMonth !== null
        ) {
            const difference =
                document.createElement("p");

            const value =
                monthData.differenceFromPreviousMonth;

            const sign = value > 0 ? "+" : "";

            difference.textContent =
                `Variazione: ${sign}${value} punti percentuali`;

            monthContainer.appendChild(difference);
        }

        practiceReportMonths.appendChild(
            monthContainer
        );
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

    displayPracticeReportMonths(report.months);
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