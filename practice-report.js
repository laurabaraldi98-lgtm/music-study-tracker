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

const practiceReportTypes = document.getElementById(
    "practice-report-types"
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

    const chartWidth = 600;
    const chartHeight = 260;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 55;
    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.setAttribute(
        "viewBox",
        `0 0 ${chartWidth} ${chartHeight}`
    );

    svg.setAttribute(
        "class",
        "practice-report-chart"
    );

    const axisColor = "currentColor";

    const yAxis = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
    );

    yAxis.setAttribute("x1", paddingLeft);
    yAxis.setAttribute("x2", paddingLeft);
    yAxis.setAttribute("y1", paddingTop);
    yAxis.setAttribute("y2", paddingTop + plotHeight);
    yAxis.setAttribute("stroke", axisColor);

    svg.appendChild(yAxis);

    const xAxis = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
    );

    xAxis.setAttribute("x1", paddingLeft);
    xAxis.setAttribute("x2", paddingLeft + plotWidth);
    xAxis.setAttribute("y1", paddingTop + plotHeight);
    xAxis.setAttribute("y2", paddingTop + plotHeight);
    xAxis.setAttribute("stroke", axisColor);

    svg.appendChild(xAxis);

    const yValues = [0, 25, 50, 75, 100];

    for (const value of yValues) {
        const y =
            paddingTop +
            plotHeight -
            (value / 100) * plotHeight;

        const gridLine = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

        gridLine.setAttribute("x1", paddingLeft);
        gridLine.setAttribute("x2", paddingLeft + plotWidth);
        gridLine.setAttribute("y1", y);
        gridLine.setAttribute("y2", y);
        gridLine.setAttribute(
            "class",
            "practice-report-chart-grid"
        );

        svg.appendChild(gridLine);

        const label = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        label.setAttribute("x", paddingLeft - 8);
        label.setAttribute("y", y + 4);
        label.setAttribute(
            "text-anchor",
            "end"
        );

        label.textContent = `${value}%`;

        svg.appendChild(label);
    }

    const points = [];

    months.forEach((monthData, index) => {
        const x =
            months.length === 1
                ? paddingLeft + plotWidth / 2
                : paddingLeft +
                (index / (months.length - 1)) *
                plotWidth;

        const [year, month] =
            monthData.month.split("-");

        const monthName = new Date(
            Number(year),
            Number(month) - 1
        ).toLocaleDateString(
            "it-IT",
            {
                month: "short"
            }
        );

        const monthLabel =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

        monthLabel.setAttribute(
            "x",
            x
        );

        monthLabel.setAttribute(
            "y",
            chartHeight - 25
        );

        monthLabel.setAttribute(
            "text-anchor",
            "middle"
        );

        monthLabel.textContent = monthName;

        svg.appendChild(monthLabel);

        if (monthData.accuracy == null) {
            return;
        }

        const y =
            paddingTop +
            plotHeight -
            (monthData.accuracy / 100) *
            plotHeight;

        points.push({
            x,
            y,
            data: monthData
        });
    });

    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];

        const currentIndex =
            months.findIndex(
                month =>
                    month.month ===
                    current.data.month
            );

        const nextIndex =
            months.findIndex(
                month =>
                    month.month ===
                    next.data.month
            );

        if (nextIndex - currentIndex !== 1) {
            continue;
        }

        const line =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );

        line.setAttribute(
            "x1",
            current.x
        );

        line.setAttribute(
            "y1",
            current.y
        );

        line.setAttribute(
            "x2",
            next.x
        );

        line.setAttribute(
            "y2",
            next.y
        );

        line.setAttribute(
            "class",
            "practice-report-chart-line"
        );

        svg.appendChild(line);
    }

    const popupWidth = 190;
    const popupHeight = 92;

    const popup = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
    );

    popup.setAttribute(
        "class",
        "practice-report-chart-popup"
    );

    popup.style.display = "none";

    const popupBackground =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
        );

    popupBackground.setAttribute(
        "width",
        popupWidth
    );

    popupBackground.setAttribute(
        "height",
        popupHeight
    );

    popupBackground.setAttribute(
        "rx",
        8
    );

    popupBackground.setAttribute(
        "class",
        "practice-report-chart-popup-background"
    );

    popup.appendChild(
        popupBackground
    );

    const popupText =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

    popupText.setAttribute(
        "class",
        "practice-report-chart-popup-text"
    );

    popup.appendChild(
        popupText
    );

    svg.appendChild(popup);

    let pinnedPoint = null;

    function showPopup(point) {
        let popupX = point.x + 12;
        let popupY = point.y - popupHeight - 12;

        if (
            popupX + popupWidth >
            chartWidth - 5
        ) {
            popupX =
                point.x -
                popupWidth -
                12;
        }

        if (popupY < 5) {
            popupY =
                point.y + 12;
        }

        popup.setAttribute(
            "transform",
            `translate(${popupX} ${popupY})`
        );

        popupText.innerHTML = "";

        const [year, month] =
            point.data.month.split("-");

        const monthName = new Date(
            Number(year),
            Number(month) - 1
        ).toLocaleDateString(
            "it-IT",
            {
                month: "long",
                year: "numeric"
            }
        );

        const lines = [
            monthName.charAt(0).toUpperCase() +
            monthName.slice(1),
            `Accuratezza: ${point.data.accuracy}%`,
            `Dettati: ${point.data.totalDictations}`,
            `Categorie valutate: ${point.data.evaluatedCategories}`
        ];

        lines.forEach((line, index) => {
            const textLine =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "tspan"
                );

            textLine.setAttribute(
                "x",
                12
            );

            textLine.setAttribute(
                "y",
                20 + index * 20
            );

            if (index === 0) {
                textLine.setAttribute(
                    "class",
                    "practice-report-chart-popup-title"
                );
            }

            textLine.textContent = line;

            popupText.appendChild(
                textLine
            );
        });

        popup.style.display = "";
    }

    function hidePopup() {
        popup.style.display = "none";
    }

    for (const point of points) {
        const circle =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );

        circle.setAttribute(
            "cx",
            point.x
        );

        circle.setAttribute(
            "cy",
            point.y
        );

        circle.setAttribute(
            "r",
            5
        );

        circle.setAttribute(
            "class",
            "practice-report-chart-point"
        );

        circle.addEventListener(
            "mouseenter",
            function () {
                if (pinnedPoint === null) {
                    showPopup(point);
                }
            }
        );

        circle.addEventListener(
            "mouseleave",
            function () {
                if (pinnedPoint === null) {
                    hidePopup();
                }
            }
        );

        circle.addEventListener(
            "click",
            function () {
                if (pinnedPoint === point) {
                    pinnedPoint = null;
                    hidePopup();
                    return;
                }

                pinnedPoint = point;
                showPopup(point);
            }
        );

        svg.appendChild(circle);
    }

    practiceReportMonths.appendChild(svg);
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

    const totalDictations =
        document.createElement("p");

    totalDictations.textContent =
        `Dettati completati: ${report.summary.totalDictations}`;

    const evaluatedCategories =
        document.createElement("p");

    evaluatedCategories.textContent =
        `Categorie valutate: ${report.summary.evaluatedCategories}`;

    const correctCategories =
        document.createElement("p");

    correctCategories.textContent =
        `Categorie corrette: ${report.summary.correctCategories}`;

    const accuracy =
        document.createElement("p");

    accuracy.textContent =
        report.summary.accuracy == null
            ? "Accuratezza: Nessun dato"
            : `Accuratezza: ${report.summary.accuracy}%`;

    practiceReportSummary.appendChild(
        totalDictations
    );

    practiceReportSummary.appendChild(
        evaluatedCategories
    );

    practiceReportSummary.appendChild(
        correctCategories
    );

    practiceReportSummary.appendChild(
        accuracy
    );

    displayPracticeReportMonths(
        report.months
    );

    displayPracticeReportTypes(
        report.types
    );
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

function displayPracticeReportTypes(types) {
    practiceReportTypes.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Dettaglio per tipo";
    practiceReportTypes.appendChild(title);

    if (types.length === 0) {
        const noData = document.createElement("p");
        noData.textContent = "Nessun dato";
        practiceReportTypes.appendChild(noData);
        return;
    }

    for (const type of types) {
        const row = document.createElement("div");
        row.className = "practice-report-type-row";

        const header = document.createElement("div");
        header.className = "practice-report-type-header";

        const name = document.createElement("span");
        name.textContent = type.name;

        const value = document.createElement("span");
        value.textContent =
            type.accuracy == null
                ? "Nessun dato"
                : `${type.accuracy}%`;

        header.appendChild(name);
        header.appendChild(value);

        const bar = document.createElement("div");
        bar.className = "practice-report-type-bar";

        const fill = document.createElement("div");
        fill.className = "practice-report-type-bar-fill";

        fill.style.width =
            type.accuracy == null
                ? "0%"
                : `${type.accuracy}%`;

        const popup = document.createElement("div");
        popup.className = "practice-report-type-popup";
        popup.hidden = true;

        popup.innerHTML = `
            <strong>${type.name}</strong><br>
            Accuratezza: ${type.accuracy == null
                ? "Nessun dato"
                : `${type.accuracy}%`
            }<br>
            Dettati: ${type.totalDictations}<br>
            Categorie valutate: ${type.evaluatedCategories}<br>
            Categorie corrette: ${type.correctCategories}
        `;

        fill.addEventListener("mouseenter", function () {
            popup.hidden = false;
        });

        fill.addEventListener("mouseleave", function () {
            if (!fill.classList.contains("pinned")) {
                popup.hidden = true;
            }
        });

        fill.addEventListener("click", function () {
            const isPinned =
                fill.classList.contains("pinned");

            document
                .querySelectorAll(".practice-report-type-bar-fill.pinned")
                .forEach(element => {
                    element.classList.remove("pinned");
                });

            document
                .querySelectorAll(".practice-report-type-popup")
                .forEach(element => {
                    element.hidden = true;
                });

            if (isPinned) {
                return;
            }

            fill.classList.add("pinned");
            popup.hidden = false;
        });

        bar.appendChild(fill);

        row.appendChild(header);
        row.appendChild(bar);
        row.appendChild(popup);

        practiceReportTypes.appendChild(row);
    }
}