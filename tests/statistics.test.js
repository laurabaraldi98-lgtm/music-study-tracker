document.body.innerHTML = `
    <button id="show-statistics-button">
        Vedi statistiche
    </button>

    <section id="statistics-section" hidden>
        <select id="statistics-collection-filter">
            <option value=""></option>
            <option value="Esame">Esame</option>
            <option value="Lezione">Lezione</option>
        </select>

        <div id="statistics-container"></div>
    </section>
`;

const showStatisticsButton =
    document.getElementById(
        "show-statistics-button"
    );

const statisticsSection =
    document.getElementById(
        "statistics-section"
    );

const statisticsContainer =
    document.getElementById(
        "statistics-container"
    );

const statisticsCollectionFilter =
    document.getElementById(
        "statistics-collection-filter"
    );


const getDictationsFromServerMock =
    jest.fn();

const formatDictationFromDatabaseMock =
    jest.fn(dictation => dictation);

const alertMock = jest.fn();


global.getDictationsFromServer =
    getDictationsFromServerMock;

global.formatDictationFromDatabase =
    formatDictationFromDatabaseMock;

global.alert = alertMock;


const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => { });


require("../statistics.js");


async function waitForAsyncCode() {
    await Promise.resolve();
    await Promise.resolve();
}


function makeDictation(overrides = {}) {
    return {
        id: 1,
        type: "rhythmic",
        collection: "Esame",
        availableCategories: [
            "Metrica"
        ],
        correctCategories: [
            "Metrica"
        ],
        ...overrides
    };
}


async function showStatistics(
    dictations = []
) {
    getDictationsFromServerMock
        .mockResolvedValueOnce(dictations);

    showStatisticsButton.click();

    await waitForAsyncCode();
}


function getCategoryStat(text) {
    return Array.from(
        statisticsContainer.querySelectorAll(
            ".category-stat"
        )
    ).find(
        stat =>
            stat.textContent.includes(text)
    );
}


beforeEach(() => {
    [
        getDictationsFromServerMock,
        alertMock
    ].forEach(
        mock => mock.mockReset()
    );

    getDictationsFromServerMock
        .mockResolvedValue([]);

    formatDictationFromDatabaseMock
        .mockClear();

    consoleErrorSpy.mockClear();

    statisticsSection.hidden = true;

    showStatisticsButton.textContent =
        "Vedi statistiche";

    statisticsCollectionFilter.value = "";

    statisticsContainer.innerHTML = "";
});


afterAll(() => {
    consoleErrorSpy.mockRestore();
});


test("shows and hides the statistics section", async () => {
    expect(statisticsSection.hidden)
        .toBe(true);

    showStatisticsButton.click();

    await waitForAsyncCode();

    expect(statisticsSection.hidden)
        .toBe(false);

    expect(showStatisticsButton.textContent)
        .toBe(
            "Nascondi statistiche"
        );

    expect(getDictationsFromServerMock)
        .toHaveBeenCalledTimes(1);

    showStatisticsButton.click();

    await waitForAsyncCode();

    expect(statisticsSection.hidden)
        .toBe(true);

    expect(showStatisticsButton.textContent)
        .toBe(
            "Vedi statistiche"
        );

    expect(getDictationsFromServerMock)
        .toHaveBeenCalledTimes(1);
});


test("shows an error when statistics cannot be loaded", async () => {
    getDictationsFromServerMock
        .mockRejectedValueOnce(
            new Error("Database error")
        );

    showStatisticsButton.click();

    await waitForAsyncCode();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Non è stato possibile caricare le statistiche."
        );
});


test("calculates dictation and category statistics", async () => {
    await showStatistics([
        makeDictation({
            id: 1,
            type: "rhythmic",
            availableCategories: [
                "Metrica",
                "Pause",
                "Zero"
            ],
            correctCategories: [
                "Metrica",
                "Pause"
            ]
        }),

        makeDictation({
            id: 2,
            type: "rhythmic",
            availableCategories: [
                "Metrica",
                "Pause",
                "Zero"
            ],
            correctCategories: [
                "Metrica"
            ]
        }),

        makeDictation({
            id: 3,
            type: "melodic",
            collection: "Lezione",
            availableCategories: [
                "Tonalità"
            ],
            correctCategories: [
                "Tonalità"
            ]
        }),

        makeDictation({
            id: 4,
            type: "harmonic",
            collection: null,
            availableCategories: null,
            correctCategories: []
        }),

        makeDictation({
            id: 5,
            type: "other",
            collection: null,
            availableCategories: [],
            correctCategories: []
        })
    ]);

    const text =
        statisticsContainer.textContent;

    [
        "Dettati totali: 5",
        "Ritmici: 2",
        "Melodici: 1",
        "Armonici: 1",
        "Statistiche per categoria",
        "Ritmico",
        "Melodico",
        "Armonico",
        "Metrica: 2/2 sentiti correttamente (100%)",
        "Pause: 1/2 sentito correttamente (50%)",
        "Zero: 0/2 sentiti correttamente (0%)",
        "Tonalità: 1/1 sentito correttamente (100%)"
    ].forEach(expectedText => {
        expect(text)
            .toContain(expectedText);
    });

    expect(
        formatDictationFromDatabaseMock
    ).toHaveBeenCalledTimes(5);

    const expectedBars = [
        ["Metrica", "100%", "100%"],
        ["Pause", "50%", "50%"],
        ["Zero", "0%", ""],
        ["Tonalità", "100%", "100%"]
    ];

    expectedBars.forEach(
        ([
            category,
            width,
            textContent
        ]) => {
            const bar =
                getCategoryStat(category)
                    .querySelector(
                        ".statistics-bar-fill"
                    );

            expect(bar.style.width)
                .toBe(width);

            expect(bar.textContent)
                .toBe(textContent);
        }
    );
});


test("filters statistics by collection", async () => {
    getDictationsFromServerMock
        .mockResolvedValueOnce([
            makeDictation({
                id: 1,
                type: "rhythmic",
                collection: "Esame"
            }),

            makeDictation({
                id: 2,
                type: "melodic",
                collection: "Lezione",
                availableCategories: [
                    "Tonalità"
                ],
                correctCategories: [
                    "Tonalità"
                ]
            })
        ]);

    statisticsCollectionFilter.value =
        "Esame";

    statisticsCollectionFilter
        .dispatchEvent(
            new Event("change")
        );

    await waitForAsyncCode();

    [
        "Dettati totali: 1",
        "Ritmici: 1",
        "Melodici: 0",
        "Armonici: 0"
    ].forEach(expectedText => {
        expect(
            statisticsContainer.textContent
        ).toContain(expectedText);
    });

    expect(
        statisticsContainer.textContent
    ).not.toContain("Tonalità");
});


test("displays zero totals when there are no dictations", async () => {
    await showStatistics([]);

    [
        "Dettati totali: 0",
        "Ritmici: 0",
        "Melodici: 0",
        "Armonici: 0"
    ].forEach(expectedText => {
        expect(
            statisticsContainer.textContent
        ).toContain(expectedText);
    });

    expect(
        statisticsContainer.querySelectorAll(
            ".category-stat"
        )
    ).toHaveLength(0);
});