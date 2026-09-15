document.body.innerHTML = `
    <button id="show-statistics-button">Vedi statistiche</button>
    <section id="statistics-section" hidden>
        <select id="statistics-collection-filter">
            <option value="">Tutte le raccolte</option>
            <option value="Esame">Esame</option>
            <option value="Lezione">Lezione</option>
        </select>
        <div id="statistics-container"></div>
    </section>
`;

const showStatisticsButton = document.getElementById("show-statistics-button");
const statisticsSection = document.getElementById("statistics-section");
const statisticsContainer = document.getElementById("statistics-container");
const statisticsCollectionFilter = document.getElementById("statistics-collection-filter");

const getDictationsFromServerMock = jest.fn();
const formatDictationFromDatabaseMock = jest.fn(dictation => dictation);
const alertMock = jest.fn();

global.getDictationsFromServer = getDictationsFromServerMock;
global.formatDictationFromDatabase = formatDictationFromDatabaseMock;
global.alert = alertMock;

const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

require("../statistics.js");

async function waitForAsyncCode() {
    await Promise.resolve();
    await Promise.resolve();
}

function makeDictation(overrides = {}) {
    return {
        id: 1,
        dictationTypeId: 1,
        dictationTypeName: "Ritmico",
        type: "rhythmic",
        collection: "Esame",
        availableCategories: ["Metrica"],
        correctCategories: ["Metrica"],
        ...overrides
    };
}

async function openStatistics(dictations = []) {
    getDictationsFromServerMock.mockResolvedValueOnce(dictations);
    showStatisticsButton.click();
    await waitForAsyncCode();
}

function getCategoryStat(categoryName) {
    return Array.from(
        statisticsContainer.querySelectorAll(".category-stat")
    ).find(element => element.textContent.includes(categoryName));
}

beforeEach(() => {
    getDictationsFromServerMock.mockReset();
    getDictationsFromServerMock.mockResolvedValue([]);
    formatDictationFromDatabaseMock.mockClear();
    alertMock.mockReset();
    consoleErrorSpy.mockClear();

    statisticsSection.hidden = true;
    showStatisticsButton.textContent = "Vedi statistiche";
    statisticsCollectionFilter.value = "";
    statisticsContainer.innerHTML = "";
});

afterAll(() => {
    consoleErrorSpy.mockRestore();
});

test("shows and hides statistics", async () => {
    showStatisticsButton.click();
    await waitForAsyncCode();

    expect(statisticsSection.hidden).toBe(false);
    expect(showStatisticsButton.textContent).toBe("Nascondi statistiche");
    expect(getDictationsFromServerMock).toHaveBeenCalledTimes(1);

    showStatisticsButton.click();

    expect(statisticsSection.hidden).toBe(true);
    expect(showStatisticsButton.textContent).toBe("Vedi statistiche");
    expect(getDictationsFromServerMock).toHaveBeenCalledTimes(1);
});

test("shows an error when statistics cannot be loaded", async () => {
    getDictationsFromServerMock.mockRejectedValueOnce(
        new Error("Database error")
    );

    showStatisticsButton.click();
    await waitForAsyncCode();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith(
        "Non è stato possibile caricare le statistiche."
    );
});

test("calculates statistics for default and custom types", async () => {
    await openStatistics([
        makeDictation({
            id: 1,
            availableCategories: ["Metrica", "Pause", "Zero"],
            correctCategories: ["Metrica", "Pause"]
        }),
        makeDictation({
            id: 2,
            availableCategories: ["Metrica", "Pause", "Zero"],
            correctCategories: ["Metrica"]
        }),
        makeDictation({
            id: 3,
            dictationTypeId: 2,
            dictationTypeName: "Melodico",
            type: "melodic",
            collection: "Lezione",
            availableCategories: ["Tonalità"],
            correctCategories: ["Tonalità"]
        }),
        makeDictation({
            id: 4,
            dictationTypeId: 10,
            dictationTypeName: "Contrappunto",
            type: "contrappunto",
            collection: null,
            availableCategories: ["Voci"],
            correctCategories: []
        })
    ]);

    const text = statisticsContainer.textContent;

    expect(text).toContain("Dettati totali: 4");
    expect(text).toContain("Ritmico: 2");
    expect(text).toContain("Melodico: 1");
    expect(text).toContain("Contrappunto: 1");
    expect(text).toContain("Metrica: 2/2 sentiti correttamente (100%)");
    expect(text).toContain("Pause: 1/2 sentito correttamente (50%)");
    expect(text).toContain("Zero: 0/2 sentiti correttamente (0%)");
    expect(text).toContain("Tonalità: 1/1 sentito correttamente (100%)");
    expect(text).toContain("Voci: 0/1 sentiti correttamente (0%)");

    expect(formatDictationFromDatabaseMock).toHaveBeenCalledTimes(4);

    const expectedBars = [
        ["Metrica", "100%", "100%"],
        ["Pause", "50%", "50%"],
        ["Zero", "0%", ""],
        ["Tonalità", "100%", "100%"],
        ["Voci", "0%", ""]
    ];

    expectedBars.forEach(([category, width, content]) => {
        const bar = getCategoryStat(category).querySelector(
            ".statistics-bar-fill"
        );

        expect(bar.style.width).toBe(width);
        expect(bar.textContent).toBe(content);
    });
});

test("uses fallback names when type information is incomplete", async () => {
    await openStatistics([
        makeDictation({
            id: 1,
            dictationTypeId: null,
            dictationTypeName: "Intervalli",
            type: undefined,
            availableCategories: [],
            correctCategories: []
        }),
        makeDictation({
            id: 2,
            dictationTypeId: undefined,
            dictationTypeName: undefined,
            type: "legacy",
            availableCategories: null,
            correctCategories: null
        }),
        makeDictation({
            id: 3,
            dictationTypeId: null,
            dictationTypeName: undefined,
            type: undefined,
            availableCategories: [],
            correctCategories: []
        })
    ]);

    const text = statisticsContainer.textContent;

    expect(text).toContain("Intervalli: 1");
    expect(text).toContain("legacy: 1");
    expect(text).toContain("Tipo sconosciuto: 1");
    expect(text).toContain("Nessuna categoria disponibile.");
});

test("groups repeated types without an ID by name", async () => {
    await openStatistics([
        makeDictation({
            id: 1,
            dictationTypeId: null,
            dictationTypeName: "Personalizzato",
            type: undefined
        }),
        makeDictation({
            id: 2,
            dictationTypeId: null,
            dictationTypeName: "Personalizzato",
            type: undefined,
            correctCategories: []
        })
    ]);

    expect(statisticsContainer.textContent).toContain(
        "Personalizzato: 2"
    );
    expect(statisticsContainer.textContent).toContain(
        "Metrica: 1/2 sentito correttamente (50%)"
    );
});

test("filters statistics by collection", async () => {
    getDictationsFromServerMock.mockResolvedValueOnce([
        makeDictation({
            id: 1,
            collection: "Esame"
        }),
        makeDictation({
            id: 2,
            dictationTypeId: 2,
            dictationTypeName: "Melodico",
            type: "melodic",
            collection: "Lezione",
            availableCategories: ["Tonalità"],
            correctCategories: ["Tonalità"]
        }),
        makeDictation({
            id: 3,
            dictationTypeId: 10,
            dictationTypeName: "Wow",
            type: "wow",
            collection: null,
            availableCategories: [],
            correctCategories: []
        })
    ]);

    statisticsCollectionFilter.value = "Esame";
    statisticsCollectionFilter.dispatchEvent(new Event("change"));

    await waitForAsyncCode();

    const text = statisticsContainer.textContent;

    expect(text).toContain("Dettati totali: 1");
    expect(text).toContain("Ritmico: 1");
    expect(text).not.toContain("Melodico");
    expect(text).not.toContain("Wow");
    expect(text).not.toContain("Tonalità");
});

test("shows an empty message when there are no dictations", async () => {
    await openStatistics([]);

    expect(statisticsContainer.textContent).toContain(
        "Dettati totali: 0"
    );
    expect(statisticsContainer.textContent).toContain(
        "Non ci sono ancora statistiche disponibili."
    );
    expect(
        statisticsContainer.querySelectorAll(".category-stat")
    ).toHaveLength(0);
});

test("refreshes open statistics when dictations change", async () => {
    getDictationsFromServerMock
        .mockResolvedValueOnce([makeDictation()])
        .mockResolvedValueOnce([
            makeDictation(),
            makeDictation({
                id: 2,
                dictationTypeId: 10,
                dictationTypeName: "Wow",
                type: "wow",
                availableCategories: [],
                correctCategories: []
            })
        ]);

    showStatisticsButton.click();
    await waitForAsyncCode();

    expect(statisticsContainer.textContent).toContain(
        "Dettati totali: 1"
    );

    window.dispatchEvent(new Event("dictations-changed"));
    await waitForAsyncCode();

    expect(getDictationsFromServerMock).toHaveBeenCalledTimes(2);
    expect(statisticsContainer.textContent).toContain(
        "Dettati totali: 2"
    );
    expect(statisticsContainer.textContent).toContain("Wow: 1");
});

test("does not refresh hidden statistics when dictations change", async () => {
    window.dispatchEvent(new Event("dictations-changed"));
    await waitForAsyncCode();

    expect(getDictationsFromServerMock).not.toHaveBeenCalled();
});