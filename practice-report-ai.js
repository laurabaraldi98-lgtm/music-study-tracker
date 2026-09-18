function displayPracticeReportAiInsight(aiInsight) {
    const container = document.getElementById("practice-report-ai-insight");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!aiInsight) {
        return;
    }

    const paragraph = document.createElement("p");
    paragraph.textContent = aiInsight;

    container.appendChild(paragraph);
}

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        displayPracticeReportAiInsight
    };
}