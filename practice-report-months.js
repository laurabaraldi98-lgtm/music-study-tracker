function displayPracticeReportMonths(months) {
    const practiceReportMonths = document.getElementById(
        "practice-report-months"
    );

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

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        displayPracticeReportMonths
    };
}