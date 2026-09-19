function displayPracticeReportAiInsight(aiInsight) {
    const container = document.getElementById("practice-report-ai-insight");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!aiInsight) {
        return;
    }

    const title = document.createElement("h3");
    title.textContent = "Analisi del periodo";

    const paragraph = document.createElement("p");
    paragraph.textContent = aiInsight;

    container.appendChild(title);
    container.appendChild(paragraph);
}

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        displayPracticeReportAiInsight
    };
}