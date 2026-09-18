const {
    displayPracticeReportAiInsight
} = require("../practice-report-ai.js");

beforeEach(() => {
    document.body.innerHTML = `
        <div id="practice-report-ai-insight"></div>
    `;
});

test("shows the AI insight", () => {
    displayPracticeReportAiInsight(
        "Il rendimento è in miglioramento."
    );

    const container = document.getElementById(
        "practice-report-ai-insight"
    );

    expect(container.textContent).toBe(
        "Il rendimento è in miglioramento."
    );

    expect(container.querySelector("p")).not.toBeNull();
});

test("replaces the previous AI insight", () => {
    const container = document.getElementById(
        "practice-report-ai-insight"
    );

    container.innerHTML = "<p>Vecchio commento</p>";

    displayPracticeReportAiInsight(
        "Nuovo commento"
    );

    expect(container.textContent).toBe(
        "Nuovo commento"
    );

    expect(container.querySelectorAll("p")).toHaveLength(1);
});

test("leaves the container empty when AI insight is missing", () => {
    const container = document.getElementById(
        "practice-report-ai-insight"
    );

    container.innerHTML = "<p>Vecchio commento</p>";

    displayPracticeReportAiInsight(null);

    expect(container.innerHTML).toBe("");
});

test("does nothing when the container does not exist", () => {
    document.body.innerHTML = "";

    expect(() => {
        displayPracticeReportAiInsight(
            "Commento AI"
        );
    }).not.toThrow();
});