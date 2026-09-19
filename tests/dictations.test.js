document.body.innerHTML = `
    <input id="dictation-date">
    <input id="dictation-name">
    <input id="youtube-link">

    <button id="save-button">Salva</button>
    <div id="saved-dictations-container"></div>

    <select id="dictation-type">
        <option value=""></option>
        <option value="1">Ritmico</option>
        <option value="2">Melodico</option>
        <option value="3">Armonico</option>
        <option value="4">Contrappunto</option>
    </select>

    <div id="categories-container"></div>

    <select id="dictation-collection">
        <option value=""></option>
        <option value="Esame">Esame</option>
        <option value="Lezione">Lezione</option>
    </select>

    <select id="saved-collection-filter">
        <option value=""></option>
        <option value="Esame">Esame</option>
        <option value="Lezione">Lezione</option>
    </select>
`;

const dictationDate = document.getElementById("dictation-date");
const dictationName = document.getElementById("dictation-name");
const youtubeLink = document.getElementById("youtube-link");
const saveButton = document.getElementById("save-button");

const savedDictationsContainer = document.getElementById(
    "saved-dictations-container"
);

const savedDictationsSection = document.getElementById(
    "saved-dictations-section"
);

const dictationTypeElement = document.getElementById("dictation-type");
const categoriesContainerElement = document.getElementById("categories-container");
const dictationCollectionElement = document.getElementById("dictation-collection");

const savedCollectionFilterElement = document.getElementById(
    "saved-collection-filter"
);

const getDictationsFromServerMock = jest.fn();
const saveDictationToServerMock = jest.fn();
const deleteDictationFromServerMock = jest.fn();
const alertMock = jest.fn();
const confirmMock = jest.fn();
const typeChangeMock = jest.fn();
const dictationsChangedMock = jest.fn();

const mocksToReset = [
    getDictationsFromServerMock,
    saveDictationToServerMock,
    deleteDictationFromServerMock,
    alertMock,
    confirmMock,
    typeChangeMock,
    dictationsChangedMock
];

global.getDictationsFromServer = getDictationsFromServerMock;
global.saveDictationToServer = saveDictationToServerMock;
global.deleteDictationFromServer = deleteDictationFromServerMock;
global.alert = alertMock;
global.confirm = confirmMock;
global.dictationTypeSelect = dictationTypeElement;
global.categoriesContainer = categoriesContainerElement;
global.dictationCollection = dictationCollectionElement;
global.savedCollectionFilter = savedCollectionFilterElement;

global.categories = {
    "1": [
        { id: 1, name: "Metrica", dictationTypeId: 1 },
        { id: 2, name: "Pause", dictationTypeId: 1 }
    ],
    "2": [
        { id: 3, name: "Tonalità", dictationTypeId: 2 }
    ],
    "3": [
        { id: 4, name: "Accordi", dictationTypeId: 3 }
    ],
    "4": [
        { id: 5, name: "Voci", dictationTypeId: 4 }
    ]
};

dictationTypeElement.addEventListener("change", typeChangeMock);
window.addEventListener("dictations-changed", dictationsChangedMock);

const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => { });

const {
    displaySavedDictations
} = require("../dictations.js");

async function waitForAsyncCode() {
    await Promise.resolve();
    await Promise.resolve();
}

function setValidForm() {
    dictationDate.value = "2026-08-24";
    dictationName.value = "Dettato prova";
    youtubeLink.value = "https://youtube.com/watch?v=test";
    dictationTypeElement.value = "1";
    dictationCollectionElement.value = "Esame";
}

function setCategoryCheckboxes() {
    categoriesContainerElement.innerHTML = `
        <input type="checkbox" value="Metrica" checked>
        <input type="checkbox" value="Pause">
    `;
}

function makeDictation(overrides = {}) {
    return {
        id: 1,
        date: "2026-08-24",
        name: "Dettato prova",
        youtube_link: "https://youtube.com/watch?v=test",
        type: "rhythmic",
        dictation_type_id: 1,
        dictation_type_name: "Ritmico",
        collection: "Esame",
        available_categories: ["Metrica", "Pause"],
        correct_categories: ["Metrica"],
        ...overrides
    };
}

function getDeleteButtons() {
    return Array.from(
        savedDictationsContainer.querySelectorAll(".delete-button")
    );
}

async function showSavedDictations(dictations) {
    getDictationsFromServerMock.mockResolvedValueOnce(dictations);

    await displaySavedDictations();
}

beforeEach(() => {
    mocksToReset.forEach(mock => mock.mockReset());

    getDictationsFromServerMock.mockResolvedValue([]);
    consoleErrorSpy.mockClear();

    dictationDate.value = "";
    dictationName.value = "";
    youtubeLink.value = "";
    dictationTypeElement.value = "";
    dictationCollectionElement.value = "";
    savedCollectionFilterElement.value = "";

    categoriesContainerElement.innerHTML = "";
    savedDictationsContainer.innerHTML = "";
});

afterAll(() => {
    consoleErrorSpy.mockRestore();
});

test.each([
    ["date", dictationDate, ""],
    ["name", dictationName, "   "],
    ["YouTube link", youtubeLink, "   "],
    ["dictation type", dictationTypeElement, ""]
])(
    "does not save when %s is missing",
    async (_fieldName, field, value) => {
        setValidForm();
        field.value = value;

        saveButton.click();
        await waitForAsyncCode();

        expect(saveDictationToServerMock).not.toHaveBeenCalled();

        expect(alertMock).toHaveBeenCalledWith(
            "Compila tutti i campi prima di salvare."
        );

        expect(dictationsChangedMock).not.toHaveBeenCalled();
    }
);

test("saves a valid dictation using the selected type ID", async () => {
    setValidForm();
    setCategoryCheckboxes();

    dictationName.value = "  dettato nuovo  ";
    saveDictationToServerMock.mockResolvedValueOnce({ id: 10 });

    saveButton.click();
    await waitForAsyncCode();

    expect(saveDictationToServerMock).toHaveBeenCalledWith({
        date: "2026-08-24",
        name: "Dettato nuovo",
        youtubeLink: "https://youtube.com/watch?v=test",
        dictationTypeId: 1,
        collection: "Esame",
        availableCategories: ["Metrica", "Pause"],
        correctCategories: ["Metrica"]
    });

    expect(dictationDate.value).toBe("");
    expect(dictationName.value).toBe("");
    expect(youtubeLink.value).toBe("");
    expect(dictationCollectionElement.value).toBe("");
    expect(dictationTypeElement.value).toBe("");
    expect(typeChangeMock).toHaveBeenCalledTimes(1);
    expect(dictationsChangedMock).toHaveBeenCalledTimes(1);
});

test("saves a custom dictation type", async () => {
    setValidForm();
    dictationTypeElement.value = "4";

    categoriesContainerElement.innerHTML = `
        <input type="checkbox" value="Voci" checked>
    `;

    saveDictationToServerMock.mockResolvedValueOnce({ id: 11 });

    saveButton.click();
    await waitForAsyncCode();

    expect(saveDictationToServerMock).toHaveBeenCalledWith(
        expect.objectContaining({
            dictationTypeId: 4,
            availableCategories: ["Voci"],
            correctCategories: ["Voci"]
        })
    );

    expect(dictationsChangedMock).toHaveBeenCalledTimes(1);
});

test("uses an empty category list when the selected type has no categories", async () => {
    setValidForm();
    dictationTypeElement.value = "4";

    const originalCategories = global.categories["4"];
    delete global.categories["4"];

    saveDictationToServerMock.mockResolvedValueOnce({ id: 12 });

    saveButton.click();
    await waitForAsyncCode();

    expect(
        saveDictationToServerMock.mock.calls[0][0].availableCategories
    ).toEqual([]);

    global.categories["4"] = originalCategories;
});

test("saves with no correct categories", async () => {
    setValidForm();

    categoriesContainerElement.innerHTML = `
        <input type="checkbox" value="Metrica">
        <input type="checkbox" value="Pause">
    `;

    saveDictationToServerMock.mockResolvedValueOnce({ id: 10 });

    saveButton.click();
    await waitForAsyncCode();

    expect(
        saveDictationToServerMock.mock.calls[0][0].correctCategories
    ).toEqual([]);
});

test("shows the server error when saving fails", async () => {
    setValidForm();
    setCategoryCheckboxes();

    saveDictationToServerMock.mockRejectedValueOnce(
        new Error("Save failed")
    );

    saveButton.click();
    await waitForAsyncCode();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith("Save failed");
    expect(dictationDate.value).toBe("2026-08-24");
    expect(typeChangeMock).not.toHaveBeenCalled();
    expect(dictationsChangedMock).not.toHaveBeenCalled();
});

test("shows a message when there are no saved dictations", async () => {
    await showSavedDictations([]);

    expect(savedDictationsContainer.textContent).toBe(
        "Non ci sono ancora dettati salvati."
    );
});

test("displays saved dictations in descending date order", async () => {
    await showSavedDictations([
        makeDictation({
            id: 1,
            date: "2026-08-20",
            name: "Vecchio",
            dictation_type_name: "Ritmico",
            collection: "Esame"
        }),
        makeDictation({
            id: 2,
            date: "2026-08-24",
            name: "Nuovo",
            type: "melodic",
            dictation_type_id: 2,
            dictation_type_name: "Melodico",
            collection: null
        }),
        makeDictation({
            id: 3,
            date: "2026-08-22",
            name: "Medio",
            type: "harmonic",
            dictation_type_id: 3,
            dictation_type_name: "Armonico",
            collection: "Lezione"
        }),
        makeDictation({
            id: 4,
            date: "2026-08-21",
            name: "Personalizzato",
            type: "contrappunto",
            dictation_type_id: 4,
            dictation_type_name: "Contrappunto",
            collection: "Lezione"
        })
    ]);

    const summaries = Array.from(
        savedDictationsContainer.querySelectorAll("summary")
    ).map(summary => summary.textContent);

    expect(summaries).toEqual([
        "2026-08-24 - Nuovo",
        "2026-08-22 - Medio",
        "2026-08-21 - Personalizzato",
        "2026-08-20 - Vecchio"
    ]);

    [
        "Tipo: Ritmico",
        "Tipo: Melodico",
        "Tipo: Armonico",
        "Tipo: Contrappunto",
        "Raccolta: Esame",
        "Raccolta: Lezione",
        "Raccolta: Nessuna",
        "Categorie corrette: Metrica"
    ].forEach(expectedText => {
        expect(savedDictationsContainer.textContent).toContain(expectedText);
    });

    const links = Array.from(
        savedDictationsContainer.querySelectorAll("a")
    );

    links.forEach(link => {
        expect(link.textContent).toBe("Apri video");
        expect(link.target).toBe("_blank");
        expect(link.rel).toBe("noopener noreferrer");
    });

    expect(getDeleteButtons()).toHaveLength(4);
});

test("uses the legacy default type name when the joined name is missing", async () => {
    await showSavedDictations([
        makeDictation({
            dictation_type_name: null,
            type: "rhythmic"
        })
    ]);

    expect(savedDictationsContainer.textContent).toContain(
        "Tipo: Ritmico"
    );
});

test("uses the stored legacy type when no mapped name exists", async () => {
    await showSavedDictations([
        makeDictation({
            dictation_type_name: null,
            type: "Contrappunto"
        })
    ]);

    expect(savedDictationsContainer.textContent).toContain(
        "Tipo: Contrappunto"
    );
});

test("uses empty category arrays when database values are missing", async () => {
    await showSavedDictations([
        makeDictation({
            available_categories: null,
            correct_categories: null
        })
    ]);

    expect(savedDictationsContainer.textContent).toContain(
        "Categorie corrette: "
    );
});

test("filters saved dictations by collection", async () => {
    getDictationsFromServerMock.mockResolvedValueOnce([
        makeDictation({
            id: 1,
            name: "Esame uno",
            collection: "Esame"
        }),
        makeDictation({
            id: 2,
            name: "Lezione uno",
            collection: "Lezione"
        })
    ]);

    savedCollectionFilterElement.value = "Esame";

    savedCollectionFilterElement.dispatchEvent(
        new Event("change")
    );

    await waitForAsyncCode();

    expect(savedDictationsContainer.textContent).toContain(
        "Esame uno"
    );

    expect(savedDictationsContainer.textContent).not.toContain(
        "Lezione uno"
    );
});

test("shows an empty message when the filter has no results", async () => {
    getDictationsFromServerMock.mockResolvedValueOnce([
        makeDictation({
            collection: "Lezione"
        })
    ]);

    savedCollectionFilterElement.value = "Esame";

    savedCollectionFilterElement.dispatchEvent(
        new Event("change")
    );

    await waitForAsyncCode();

    expect(savedDictationsContainer.textContent).toBe(
        "Non ci sono ancora dettati salvati."
    );
});

test("shows an error when saved dictations cannot be loaded", async () => {
    getDictationsFromServerMock.mockRejectedValueOnce(
        new Error("Database error")
    );

    await displaySavedDictations();

    expect(consoleErrorSpy).toHaveBeenCalled();

    expect(alertMock).toHaveBeenCalledWith(
        "Non è stato possibile recuperare i dettati dal database."
    );
});

test("does not delete when confirmation is cancelled", async () => {
    await showSavedDictations([makeDictation()]);

    confirmMock.mockReturnValueOnce(false);

    getDeleteButtons()[0].click();
    await waitForAsyncCode();

    expect(confirmMock).toHaveBeenCalledWith(
        "Vuoi davvero eliminare questo dettato?"
    );

    expect(deleteDictationFromServerMock).not.toHaveBeenCalled();
    expect(dictationsChangedMock).not.toHaveBeenCalled();
});

test("deletes a dictation after confirmation", async () => {
    await showSavedDictations([
        makeDictation({ id: 25 })
    ]);

    confirmMock.mockReturnValueOnce(true);
    deleteDictationFromServerMock.mockResolvedValueOnce({});

    getDeleteButtons()[0].click();
    await waitForAsyncCode();

    expect(deleteDictationFromServerMock).toHaveBeenCalledWith(25);
    expect(dictationsChangedMock).toHaveBeenCalledTimes(1);

    expect(savedDictationsContainer.textContent).toBe(
        "Non ci sono ancora dettati salvati."
    );
});

test("shows an error when deletion fails", async () => {
    await showSavedDictations([
        makeDictation({ id: 25 })
    ]);

    confirmMock.mockReturnValueOnce(true);

    deleteDictationFromServerMock.mockRejectedValueOnce(
        new Error("Delete failed")
    );

    getDeleteButtons()[0].click();
    await waitForAsyncCode();

    expect(consoleErrorSpy).toHaveBeenCalled();

    expect(alertMock).toHaveBeenCalledWith(
        "Non è stato possibile eliminare il dettato."
    );

    expect(savedDictationsContainer.textContent).toContain(
        "Dettato prova"
    );

    expect(dictationsChangedMock).not.toHaveBeenCalled();
});