const {
    setupPracticeReportDom,
    makeReport,
    waitForAsyncCode,
    setupGlobals
} = require(
    "./helpers/practice-report-test-utils"
);

const getStatisticsReportFromServerMock =
    jest.fn();

let elements;
let consoleErrorSpy;

beforeAll(() => {
    elements =
        setupPracticeReportDom();

    setupGlobals(
        getStatisticsReportFromServerMock
    );

    consoleErrorSpy =
        jest
            .spyOn(console, "error")
            .mockImplementation(() => { });

    require("../practice-report.js");
});

beforeEach(() => {
    getStatisticsReportFromServerMock
        .mockReset();

    getStatisticsReportFromServerMock
        .mockResolvedValue(
            makeReport()
        );

    consoleErrorSpy.mockClear();

    elements.practiceReportSection.hidden =
        true;

    elements.showPracticeReportButton.textContent =
        "Vedi report progressi";

    elements.practiceReportPeriod.value =
        "6-months";

    elements.practiceReportFrom.value =
        "";

    elements.practiceReportTo.value =
        "";

    elements.practiceReportCollection.innerHTML = `
        <option value="">
            Tutte le raccolte
        </option>
    `;

    elements.practiceReportType.innerHTML = `
        <option value="">
            Tutti i tipi
        </option>
    `;

    elements.practiceReportSummary.innerHTML =
        "";

    elements.practiceReportMonths.innerHTML =
        "";

    elements.practiceReportTypes.innerHTML =
        "";

    elements.practiceReportCategories.innerHTML =
        "";

    elements.practiceReportCustomPeriod.hidden =
        true;
});

afterAll(() => {
    consoleErrorSpy.mockRestore();
});

test(
    "shows and hides the practice report",
    async () => {
        elements.showPracticeReportButton.click();

        await waitForAsyncCode();

        expect(
            elements.practiceReportSection.hidden
        ).toBe(false);

        expect(
            elements.showPracticeReportButton.textContent
        ).toBe(
            "Nascondi report progressi"
        );

        expect(
            getStatisticsReportFromServerMock
        ).toHaveBeenCalledTimes(1);

        elements.showPracticeReportButton.click();

        expect(
            elements.practiceReportSection.hidden
        ).toBe(true);

        expect(
            elements.showPracticeReportButton.textContent
        ).toBe(
            "Vedi report progressi"
        );
    }
);

test(
    "shows custom dates only for custom period",
    async () => {
        elements.practiceReportPeriod.value =
            "custom";

        elements.practiceReportPeriod
            .dispatchEvent(
                new Event("change")
            );

        await waitForAsyncCode();

        expect(
            elements.practiceReportCustomPeriod.hidden
        ).toBe(false);

        elements.practiceReportPeriod.value =
            "6-months";

        elements.practiceReportPeriod
            .dispatchEvent(
                new Event("change")
            );

        await waitForAsyncCode();

        expect(
            elements.practiceReportCustomPeriod.hidden
        ).toBe(true);
    }
);

test(
    "populates collection filter",
    () => {
        window.dispatchEvent(
            new Event("collections-loaded")
        );

        const values =
            Array.from(
                elements
                    .practiceReportCollection
                    .options
            ).map(
                option => option.value
            );

        expect(values).toEqual([
            "",
            "Esame",
            "Lezione"
        ]);
    }
);

test(
    "populates dictation type filter",
    () => {
        window.dispatchEvent(
            new Event("dictation-types-loaded")
        );

        const values =
            Array.from(
                elements
                    .practiceReportType
                    .options
            ).map(
                option => option.value
            );

        expect(values).toEqual([
            "",
            "1",
            "2"
        ]);

        expect(
            Array.from(
                elements
                    .practiceReportType
                    .options
            ).map(
                option =>
                    option.textContent.trim()
            )
        ).toEqual([
            "Tutti i tipi",
            "Ritmico",
            "Melodico"
        ]);
    }
);

test(
    "loads report with selected filters",
    async () => {
        window.dispatchEvent(
            new Event("collections-loaded")
        );

        window.dispatchEvent(
            new Event("dictation-types-loaded")
        );

        elements.practiceReportCollection.value =
            "Esame";

        elements.practiceReportType.value =
            "2";

        elements.showPracticeReportButton.click();

        await waitForAsyncCode();

        expect(
            getStatisticsReportFromServerMock
        ).toHaveBeenCalledWith({
            period: "6-months",
            collection: "Esame",
            dictationTypeId: "2"
        });
    }
);

test(
    "adds custom dates to filters",
    async () => {
        elements.practiceReportPeriod.value =
            "custom";

        elements.practiceReportFrom.value =
            "2026-01-01";

        elements.practiceReportTo.value =
            "2026-06-30";

        elements.showPracticeReportButton.click();

        await waitForAsyncCode();

        expect(
            getStatisticsReportFromServerMock
        ).toHaveBeenCalledWith({
            period: "custom",
            collection: null,
            dictationTypeId: null,
            from: "2026-01-01",
            to: "2026-06-30"
        });
    }
);

test(
    "displays report summary",
    async () => {
        elements.showPracticeReportButton.click();

        await waitForAsyncCode();

        expect(
            elements.practiceReportSummary.textContent
        ).toContain(
            "Dettati completati: 8"
        );

        expect(
            elements.practiceReportSummary.textContent
        ).toContain(
            "Categorie valutate: 20"
        );

        expect(
            elements.practiceReportSummary.textContent
        ).toContain(
            "Categorie corrette: 15"
        );

        expect(
            elements.practiceReportSummary.textContent
        ).toContain(
            "Accuratezza: 75%"
        );
    }
);

test(
    "shows no data when summary accuracy is null",
    async () => {
        getStatisticsReportFromServerMock
            .mockResolvedValueOnce(
                makeReport({
                    summary: {
                        accuracy: null
                    }
                })
            );

        elements.showPracticeReportButton.click();

        await waitForAsyncCode();

        expect(
            elements.practiceReportSummary.textContent
        ).toContain(
            "Accuratezza: Nessun dato"
        );
    }
);

test(
    "shows an error when report cannot be loaded",
    async () => {
        getStatisticsReportFromServerMock
            .mockRejectedValueOnce(
                new Error("Backend error")
            );

        elements.showPracticeReportButton.click();

        await waitForAsyncCode();

        expect(
            consoleErrorSpy
        ).toHaveBeenCalled();

        expect(
            elements.practiceReportSummary.textContent
        ).toBe(
            "Non è stato possibile caricare il report."
        );
    }
);