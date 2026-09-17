const {
    setupPracticeReportDom,
    makeReport,
    waitForAsyncCode,
    setupGlobals
} = require("./helpers/practice-report-test-utils");

const getStatisticsReportFromServerMock = jest.fn();

let elements;

beforeAll(() => {
    elements = setupPracticeReportDom();
    setupGlobals(getStatisticsReportFromServerMock);

    require("../practice-report.js");
});

beforeEach(() => {
    getStatisticsReportFromServerMock.mockReset();
    getStatisticsReportFromServerMock.mockResolvedValue(makeReport());

    elements.practiceReportSection.hidden = true;
    elements.showPracticeReportButton.textContent = "Vedi report progressi";
    elements.practiceReportSummary.innerHTML = "";
    elements.practiceReportMonths.innerHTML = "";
    elements.practiceReportTypes.innerHTML = "";
});

test("renders monthly chart with one data point", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            summary: {
                totalDictations: 5,
                evaluatedCategories: 10,
                correctCategories: 7,
                accuracy: 70
            },
            months: [
                {
                    month: "2026-08",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 7,
                    accuracy: 70,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                }
            ]
        })
    );

    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(
        elements.practiceReportMonths.querySelector(".practice-report-chart")
    ).not.toBeNull();

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-point")
    ).toHaveLength(1);

    expect(elements.practiceReportMonths.textContent).toContain("ago");
});

test("does not create a point when monthly accuracy is null", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            summary: {
                totalDictations: 2,
                evaluatedCategories: 0,
                correctCategories: 0,
                accuracy: null
            },
            months: [
                {
                    month: "2026-08",
                    totalDictations: 2,
                    evaluatedCategories: 0,
                    correctCategories: 0,
                    accuracy: null,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                }
            ]
        })
    );

    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-point")
    ).toHaveLength(0);
});

test("renders five horizontal grid lines", async () => {
    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-grid")
    ).toHaveLength(5);
});

test("connects consecutive months with a line", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            summary: {
                totalDictations: 10,
                evaluatedCategories: 20,
                correctCategories: 12,
                accuracy: 60
            },
            months: [
                {
                    month: "2026-07",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 5,
                    accuracy: 50,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                },
                {
                    month: "2026-08",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 7,
                    accuracy: 70,
                    differenceFromPreviousMonth: 20,
                    isPartial: false
                }
            ]
        })
    );

    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-line")
    ).toHaveLength(1);
});

test("does not connect points separated by a month without data", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            summary: {
                totalDictations: 10,
                evaluatedCategories: 20,
                correctCategories: 12,
                accuracy: 60
            },
            months: [
                {
                    month: "2026-06",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 5,
                    accuracy: 50,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                },
                {
                    month: "2026-07",
                    totalDictations: 0,
                    evaluatedCategories: 0,
                    correctCategories: 0,
                    accuracy: null,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                },
                {
                    month: "2026-08",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 7,
                    accuracy: 70,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                }
            ]
        })
    );

    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-line")
    ).toHaveLength(0);
});

test("shows popup on mouse enter", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            months: [
                {
                    month: "2026-08",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 7,
                    accuracy: 70,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                }
            ]
        })
    );

    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    const point = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-point"
    );

    const popup = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    point.dispatchEvent(new Event("mouseenter"));

    expect(popup.style.display).toBe("");
    expect(popup.textContent).toContain("Agosto 2026");
    expect(popup.textContent).toContain("Accuratezza: 70%");
    expect(popup.textContent).toContain("Dettati: 5");
    expect(popup.textContent).toContain("Categorie valutate: 10");
});

test("hides popup on mouse leave when it is not pinned", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            months: [
                {
                    month: "2026-08",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 7,
                    accuracy: 70,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                }
            ]
        })
    );

    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    const point = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-point"
    );

    const popup = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    point.dispatchEvent(new Event("mouseenter"));
    point.dispatchEvent(new Event("mouseleave"));

    expect(popup.style.display).toBe("none");
});

test("keeps popup open after clicking a point", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            months: [
                {
                    month: "2026-08",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 7,
                    accuracy: 70,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                }
            ]
        })
    );

    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    const point = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-point"
    );

    const popup = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    point.dispatchEvent(new Event("click"));
    point.dispatchEvent(new Event("mouseleave"));

    expect(popup.style.display).toBe("");
});

test("closes pinned popup when clicking the same point again", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            months: [
                {
                    month: "2026-08",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 7,
                    accuracy: 70,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                }
            ]
        })
    );

    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    const point = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-point"
    );

    const popup = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    point.dispatchEvent(new Event("click"));

    expect(popup.style.display).toBe("");

    point.dispatchEvent(new Event("click"));

    expect(popup.style.display).toBe("none");
});

test("moves pinned popup when clicking another point", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            months: [
                {
                    month: "2026-07",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 5,
                    accuracy: 50,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                },
                {
                    month: "2026-08",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 7,
                    accuracy: 70,
                    differenceFromPreviousMonth: 20,
                    isPartial: false
                }
            ]
        })
    );

    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    const points = elements.practiceReportMonths.querySelectorAll(
        ".practice-report-chart-point"
    );

    const popup = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    points[0].dispatchEvent(new Event("click"));

    expect(popup.textContent).toContain("Luglio 2026");

    points[1].dispatchEvent(new Event("click"));

    expect(popup.textContent).toContain("Agosto 2026");
});

test("does not change pinned popup when hovering another point", async () => {
    getStatisticsReportFromServerMock.mockResolvedValueOnce(
        makeReport({
            months: [
                {
                    month: "2026-07",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 5,
                    accuracy: 50,
                    differenceFromPreviousMonth: null,
                    isPartial: false
                },
                {
                    month: "2026-08",
                    totalDictations: 5,
                    evaluatedCategories: 10,
                    correctCategories: 7,
                    accuracy: 70,
                    differenceFromPreviousMonth: 20,
                    isPartial: false
                }
            ]
        })
    );

    elements.showPracticeReportButton.click();
    await waitForAsyncCode();

    const points = elements.practiceReportMonths.querySelectorAll(
        ".practice-report-chart-point"
    );

    const popup = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    points[0].dispatchEvent(new Event("click"));

    expect(popup.textContent).toContain("Luglio 2026");

    points[1].dispatchEvent(new Event("mouseenter"));

    expect(popup.textContent).toContain("Luglio 2026");
});