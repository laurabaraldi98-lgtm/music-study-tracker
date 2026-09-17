function calculateTrendSlope(months) {
    const validMonths = months.filter(
        month =>
            month.accuracy != null &&
            !month.isPartial
    );

    if (validMonths.length < 2) {
        return null;
    }

    const points = validMonths.map(
        (month, index) => ({
            x: index,
            y: month.accuracy
        })
    );

    const count = points.length;

    const sumX = points.reduce(
        (sum, point) => sum + point.x,
        0
    );

    const sumY = points.reduce(
        (sum, point) => sum + point.y,
        0
    );

    const sumXY = points.reduce(
        (sum, point) =>
            sum + point.x * point.y,
        0
    );

    const sumXX = points.reduce(
        (sum, point) =>
            sum + point.x * point.x,
        0
    );

    const denominator =
        count * sumXX -
        sumX * sumX;

    const slope =
        (
            count * sumXY -
            sumX * sumY
        ) / denominator;

    return Number(
        slope.toFixed(1)
    );
}

function displayPracticeReportInsights(report) {
    const practiceReportInsights = document.getElementById(
        "practice-report-insights"
    );

    practiceReportInsights.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Insight";
    practiceReportInsights.appendChild(title);

    const categories = report.categories;

    const bestBlock = document.createElement("p");
    const improvementBlock = document.createElement("p");
    const trendBlock = document.createElement("p");

    if (categories.length === 0) {
        bestBlock.textContent =
            "Miglior risultato: nessun dato";

        improvementBlock.textContent =
            "Area da migliorare: nessun dato";
    } else {
        const accuracies = categories.map(
            category => category.accuracy
        );

        const bestAccuracy = Math.max(...accuracies);
        const worstAccuracy = Math.min(...accuracies);

        const bestCategories = categories
            .filter(
                category =>
                    category.accuracy === bestAccuracy
            )
            .map(
                category => category.name
            );

        const worstCategories = categories
            .filter(
                category =>
                    category.accuracy === worstAccuracy
            )
            .map(
                category => category.name
            );

        bestBlock.textContent =
            `Miglior risultato: ${bestCategories.join(", ")} (${bestAccuracy}%)`;

        if (bestAccuracy === worstAccuracy) {
            improvementBlock.textContent =
                "Area da migliorare: nessuna categoria emerge rispetto alle altre";
        } else {
            improvementBlock.textContent =
                `Area da migliorare: ${worstCategories.join(", ")} (${worstAccuracy}%)`;
        }
    }

    const trendSlope =
        calculateTrendSlope(
            report.months
        );

    if (trendSlope == null) {
        trendBlock.textContent =
            "Tendenza del periodo: dati insufficienti";
    } else if (trendSlope > 0) {
        trendBlock.textContent =
            `Tendenza del periodo: in miglioramento (+${trendSlope} punti/mese)`;
    } else if (trendSlope < 0) {
        trendBlock.textContent =
            `Tendenza del periodo: in calo (${trendSlope} punti/mese)`;
    } else {
        trendBlock.textContent =
            "Tendenza del periodo: stabile";
    }

    practiceReportInsights.appendChild(
        bestBlock
    );

    practiceReportInsights.appendChild(
        improvementBlock
    );

    practiceReportInsights.appendChild(
        trendBlock
    );
}

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        displayPracticeReportInsights,
        calculateTrendSlope
    };
}