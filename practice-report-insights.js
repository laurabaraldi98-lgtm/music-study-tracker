function displayPracticeReportInsights(report) {
    const practiceReportInsights = document.getElementById(
        "practice-report-insights"
    );

    practiceReportInsights.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Insight";
    practiceReportInsights.appendChild(title);

    const bestBlock = document.createElement("p");
    const improvementBlock = document.createElement("p");
    const trendBlock = document.createElement("p");

    const { best, improvement, trend } = report.insights;

    if (best.accuracy == null) {
        bestBlock.textContent =
            "Miglior risultato: nessun dato";
    } else {
        bestBlock.textContent =
            `Miglior risultato: ${best.categories.join(", ")} (${best.accuracy}%)`;
    }

    if (improvement.accuracy == null) {
        improvementBlock.textContent =
            "Area da migliorare: nessun dato";
    } else if (improvement.allEqual) {
        improvementBlock.textContent =
            "Area da migliorare: nessuna categoria emerge rispetto alle altre";
    } else {
        improvementBlock.textContent =
            `Area da migliorare: ${improvement.categories.join(", ")} (${improvement.accuracy}%)`;
    }

    if (trend.direction === "insufficient") {
        trendBlock.textContent =
            "Tendenza del periodo: dati insufficienti";
    } else if (trend.direction === "up") {
        trendBlock.textContent =
            `Tendenza del periodo: in miglioramento (+${trend.slope} punti/mese)`;
    } else if (trend.direction === "down") {
        trendBlock.textContent =
            `Tendenza del periodo: in calo (${trend.slope} punti/mese)`;
    } else {
        trendBlock.textContent =
            "Tendenza del periodo: stabile";
    }

    practiceReportInsights.appendChild(bestBlock);
    practiceReportInsights.appendChild(improvementBlock);
    practiceReportInsights.appendChild(trendBlock);
}

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        displayPracticeReportInsights
    };
}