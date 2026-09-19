const {
    setupPracticeReportDom
} = require("./helpers/practice-report-test-utils");

const {
    displayPracticeReportMonths
} = require("../practice-report-months.js");

let elements;

function makeReport({
    period = "6-months",
    from = "2026-04-01",
    to = "2026-09-16",
    months = [],
    days = []
} = {}) {
    return {
        period: {
            type: period,
            from,
            to
        },
        months,
        days
    };
}

function makeMonth(month, accuracy = 70) {
    return {
        month,
        totalDictations: 5,
        evaluatedCategories: 10,
        correctCategories: 7,
        accuracy,
        differenceFromPreviousMonth: null,
        isPartial: false
    };
}

function makeDay(date, accuracy = 70) {
    return {
        date,
        totalDictations: 2,
        evaluatedCategories: 5,
        correctCategories: 3,
        accuracy
    };
}

beforeEach(() => {
    elements = setupPracticeReportDom();
});

test("renders monthly chart with one data point", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [makeMonth("2026-08")]
        })
    );

    expect(
        elements.practiceReportMonths.querySelector(".practice-report-chart")
    ).not.toBeNull();

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-point")
    ).toHaveLength(1);

    expect(elements.practiceReportMonths.textContent).toContain(
        "Andamento mensile"
    );

    expect(elements.practiceReportMonths.textContent).toContain("ago");
});

test("uses daily data for current month", () => {
    displayPracticeReportMonths(
        makeReport({
            period: "current-month",
            from: "2026-09-01",
            to: "2026-09-16",
            days: [
                makeDay("2026-09-02", 40),
                makeDay("2026-09-05", 60)
            ]
        })
    );

    expect(elements.practiceReportMonths.textContent).toContain(
        "Andamento giornaliero"
    );

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-point")
    ).toHaveLength(2);

    expect(elements.practiceReportMonths.textContent).toContain("2 set");
});

test("uses daily data for previous month", () => {
    displayPracticeReportMonths(
        makeReport({
            period: "previous-month",
            from: "2026-08-01",
            to: "2026-08-31",
            days: [makeDay("2026-08-03")]
        })
    );

    expect(elements.practiceReportMonths.textContent).toContain(
        "Andamento giornaliero"
    );

    expect(elements.practiceReportMonths.textContent).toContain("3 ago");
});

test("uses daily data for custom periods up to 45 days", () => {
    displayPracticeReportMonths(
        makeReport({
            period: "custom",
            from: "2026-08-01",
            to: "2026-09-14",
            days: [makeDay("2026-08-10")]
        })
    );

    expect(elements.practiceReportMonths.textContent).toContain(
        "Andamento giornaliero"
    );
});

test("uses monthly data for custom periods longer than 45 days", () => {
    displayPracticeReportMonths(
        makeReport({
            period: "custom",
            from: "2026-07-01",
            to: "2026-09-01",
            months: [makeMonth("2026-07")]
        })
    );

    expect(elements.practiceReportMonths.textContent).toContain(
        "Andamento mensile"
    );
});

test("does not create a point when accuracy is null", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [makeMonth("2026-08", null)]
        })
    );

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-point")
    ).toHaveLength(0);
});

test("renders five horizontal grid lines", () => {
    displayPracticeReportMonths(makeReport());

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-grid")
    ).toHaveLength(5);
});

test("connects consecutive data points with a line", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [
                makeMonth("2026-07", 50),
                makeMonth("2026-08", 70)
            ]
        })
    );

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-line")
    ).toHaveLength(1);
});

test("does not connect points separated by missing data", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [
                makeMonth("2026-06", 50),
                makeMonth("2026-07", null),
                makeMonth("2026-08", 70)
            ]
        })
    );

    expect(
        elements.practiceReportMonths.querySelectorAll(".practice-report-chart-line")
    ).toHaveLength(0);
});

test("shows monthly popup on mouse enter", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [makeMonth("2026-08", 70)]
        })
    );

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

test("shows daily popup with full date", () => {
    displayPracticeReportMonths(
        makeReport({
            period: "previous-month",
            from: "2026-08-01",
            to: "2026-08-31",
            days: [makeDay("2026-08-03", 60)]
        })
    );

    const point = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-point"
    );

    const popup = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    point.dispatchEvent(new Event("mouseenter"));

    expect(popup.textContent).toContain("3 agosto 2026");
    expect(popup.textContent).toContain("Accuratezza: 60%");
});

test("hides popup on mouse leave when it is not pinned", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [makeMonth("2026-08")]
        })
    );

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

test("keeps popup open after clicking a point", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [makeMonth("2026-08")]
        })
    );

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

test("closes pinned popup when clicking the same point again", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [makeMonth("2026-08")]
        })
    );

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

test("moves pinned popup when clicking another point", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [
                makeMonth("2026-07", 50),
                makeMonth("2026-08", 70)
            ]
        })
    );

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

test("does not change pinned popup when hovering another point", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [
                makeMonth("2026-07", 50),
                makeMonth("2026-08", 70)
            ]
        })
    );

    const points = elements.practiceReportMonths.querySelectorAll(
        ".practice-report-chart-point"
    );

    const popup = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    points[0].dispatchEvent(new Event("click"));
    points[1].dispatchEvent(new Event("mouseenter"));

    expect(popup.textContent).toContain("Luglio 2026");
});

test("moves popup below a point when there is no space above", () => {
    displayPracticeReportMonths(
        makeReport({
            months: [makeMonth("2026-08", 100)]
        })
    );

    const point = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-point"
    );

    const popup = elements.practiceReportMonths.querySelector(
        ".practice-report-chart-popup"
    );

    point.dispatchEvent(new Event("mouseenter"));

    expect(popup.getAttribute("transform")).toContain("translate");
});