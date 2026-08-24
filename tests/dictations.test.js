document.body.innerHTML = `
    <input id="dictation-date">
    <input id="dictation-name">
    <input id="youtube-link">

    <button id="save-button">
        Salva
    </button>

    <div id="saved-dictations-container"></div>

    <button id="show-saved-button">
        Vedi dettati salvati
    </button>

    <section id="saved-dictations-section" hidden></section>

    <select id="dictation-type">
        <option value=""></option>
        <option value="rhythmic">Ritmico</option>
        <option value="melodic">Melodico</option>
        <option value="harmonic">Armonico</option>
    </select>

    <div id="categories-container"></div>

    <select id="dictation-collection">
        <option value=""></option>
        <option value="Esame">Esame</option>
        <option value="Lezione">Lezione</option>
    </select>

    <button id="manage-categories-button">
        Gestisci categorie
    </button>

    <div id="category-manager"></div>

    <select id="saved-collection-filter">
        <option value=""></option>
        <option value="Esame">Esame</option>
        <option value="Lezione">Lezione</option>
    </select>
`;

const dictationDate =
    document.getElementById("dictation-date");

const dictationName =
    document.getElementById("dictation-name");

const youtubeLink =
    document.getElementById("youtube-link");

const saveButton =
    document.getElementById("save-button");

const savedDictationsContainer =
    document.getElementById(
        "saved-dictations-container"
    );

const showSavedButton =
    document.getElementById(
        "show-saved-button"
    );

const savedDictationsSection =
    document.getElementById(
        "saved-dictations-section"
    );

const dictationTypeElement =
    document.getElementById(
        "dictation-type"
    );

const categoriesContainerElement =
    document.getElementById(
        "categories-container"
    );

const dictationCollectionElement =
    document.getElementById(
        "dictation-collection"
    );

const manageCategoriesButtonElement =
    document.getElementById(
        "manage-categories-button"
    );

const categoryManagerElement =
    document.getElementById(
        "category-manager"
    );

const savedCollectionFilterElement =
    document.getElementById(
        "saved-collection-filter"
    );


const getDictationsFromServerMock = jest.fn();
const saveDictationToServerMock = jest.fn();
const deleteDictationFromServerMock = jest.fn();

const alertMock = jest.fn();
const confirmMock = jest.fn();


const mocksToReset = [
    getDictationsFromServerMock,
    saveDictationToServerMock,
    deleteDictationFromServerMock,
    alertMock,
    confirmMock
];


global.getDictationsFromServer =
    getDictationsFromServerMock;

global.saveDictationToServer =
    saveDictationToServerMock;

global.deleteDictationFromServer =
    deleteDictationFromServerMock;

global.alert = alertMock;
global.confirm = confirmMock;


global.dictationType =
    dictationTypeElement;

global.categoriesContainer =
    categoriesContainerElement;

global.dictationCollection =
    dictationCollectionElement;

global.manageCategoriesButton =
    manageCategoriesButtonElement;

global.categoryManager =
    categoryManagerElement;

global.savedCollectionFilter =
    savedCollectionFilterElement;


global.categories = {
    rhythmic: [
        {
            id: 1,
            name: "Metrica"
        },
        {
            id: 2,
            name: "Pause"
        }
    ],
    melodic: [
        {
            id: 3,
            name: "Tonalità"
        }
    ],
    harmonic: [
        {
            id: 4,
            name: "Accordi"
        }
    ]
};


const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});


require("../dictations.js");


async function waitForAsyncCode() {
    await Promise.resolve();
    await Promise.resolve();
}


function setValidForm() {
    dictationDate.value = "2026-08-24";
    dictationName.value = "Dettato prova";

    youtubeLink.value =
        "https://youtube.com/watch?v=test";

    dictationTypeElement.value =
        "rhythmic";

    dictationCollectionElement.value =
        "Esame";
}


function setCategoryCheckboxes() {
    categoriesContainerElement.innerHTML = `
        <input
            type="checkbox"
            value="Metrica"
            checked
        >

        <input
            type="checkbox"
            value="Pause"
        >
    `;
}


function makeDictation(overrides = {}) {
    return {
        id: 1,
        date: "2026-08-24",
        name: "Dettato prova",
        youtube_link:
            "https://youtube.com/watch?v=test",
        type: "rhythmic",
        collection: "Esame",
        available_categories: [
            "Metrica",
            "Pause"
        ],
        correct_categories: [
            "Metrica"
        ],
        ...overrides
    };
}


function getDeleteButtons() {
    return Array.from(
        savedDictationsContainer.querySelectorAll(
            ".delete-button"
        )
    );
}


async function showSavedDictations(
    dictations
) {
    getDictationsFromServerMock
        .mockResolvedValueOnce(dictations);

    showSavedButton.click();

    await waitForAsyncCode();
}


beforeEach(() => {
    mocksToReset.forEach(
        mock => mock.mockReset()
    );

    getDictationsFromServerMock
        .mockResolvedValue([]);

    consoleErrorSpy.mockClear();

    [
        dictationDate,
        dictationName,
        youtubeLink
    ].forEach(input => {
        input.value = "";
    });

    dictationTypeElement.value = "";
    dictationCollectionElement.value = "";
    savedCollectionFilterElement.value = "";

    categoriesContainerElement.innerHTML = "";
    savedDictationsContainer.innerHTML = "";

    manageCategoriesButtonElement.hidden =
        false;

    manageCategoriesButtonElement.textContent =
        "Gestisci categorie";

    categoryManagerElement.hidden = false;

    savedDictationsSection.hidden = true;

    showSavedButton.textContent =
        "Vedi dettati salvati";
});


afterAll(() => {
    consoleErrorSpy.mockRestore();
});


test.each([
    [
        "date",
        dictationDate,
        ""
    ],
    [
        "name",
        dictationName,
        "   "
    ],
    [
        "YouTube link",
        youtubeLink,
        "   "
    ],
    [
        "dictation type",
        dictationTypeElement,
        ""
    ]
])(
    "does not save when %s is missing",
    async (
        _fieldName,
        field,
        value
    ) => {
        setValidForm();

        field.value = value;

        saveButton.click();

        await waitForAsyncCode();

        expect(saveDictationToServerMock)
            .not.toHaveBeenCalled();

        expect(alertMock)
            .toHaveBeenCalledWith(
                "Compila tutti i campi prima di salvare."
            );
    }
);


test("saves a valid dictation", async () => {
    setValidForm();
    setCategoryCheckboxes();

    dictationName.value =
        "  dettato nuovo  ";

    saveDictationToServerMock
        .mockResolvedValueOnce({
            id: 10
        });

    saveButton.click();

    await waitForAsyncCode();

    expect(saveDictationToServerMock)
        .toHaveBeenCalledWith({
            date: "2026-08-24",
            name: "Dettato nuovo",
            youtubeLink:
                "https://youtube.com/watch?v=test",
            type: "rhythmic",
            collection: "Esame",
            availableCategories: [
                "Metrica",
                "Pause"
            ],
            correctCategories: [
                "Metrica"
            ]
        });

    [
        dictationDate,
        dictationName,
        youtubeLink
    ].forEach(input => {
        expect(input.value)
            .toBe("");
    });

    [
        dictationCollectionElement,
        dictationTypeElement
    ].forEach(select => {
        expect(select.value)
            .toBe("");
    });

    expect(categoriesContainerElement.innerHTML)
        .toBe("");

    expect(manageCategoriesButtonElement.hidden)
        .toBe(true);

    expect(manageCategoriesButtonElement.textContent)
        .toBe("Gestisci categorie");

    expect(categoryManagerElement.hidden)
        .toBe(true);
});


test("saves with no correct categories", async () => {
    setValidForm();

    categoriesContainerElement.innerHTML = `
        <input
            type="checkbox"
            value="Metrica"
        >

        <input
            type="checkbox"
            value="Pause"
        >
    `;

    saveDictationToServerMock
        .mockResolvedValueOnce({
            id: 10
        });

    saveButton.click();

    await waitForAsyncCode();

    expect(
        saveDictationToServerMock
            .mock.calls[0][0]
            .correctCategories
    ).toEqual([]);
});


test("shows the server error when saving fails", async () => {
    setValidForm();
    setCategoryCheckboxes();

    saveDictationToServerMock
        .mockRejectedValueOnce(
            new Error("Save failed")
        );

    saveButton.click();

    await waitForAsyncCode();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Save failed"
        );

    expect(dictationDate.value)
        .toBe("2026-08-24");
});


test("shows a message when there are no saved dictations", async () => {
    await showSavedDictations([]);

    expect(savedDictationsContainer.textContent)
        .toBe(
            "Non ci sono ancora dettati salvati."
        );
});


test("displays saved dictations in descending date order", async () => {
    await showSavedDictations([
        makeDictation({
            id: 1,
            date: "2026-08-20",
            name: "Vecchio",
            type: "rhythmic",
            collection: "Esame"
        }),
        makeDictation({
            id: 2,
            date: "2026-08-24",
            name: "Nuovo",
            type: "melodic",
            collection: null
        }),
        makeDictation({
            id: 3,
            date: "2026-08-22",
            name: "Medio",
            type: "harmonic",
            collection: "Lezione"
        })
    ]);

    const summaries = Array.from(
        savedDictationsContainer.querySelectorAll(
            "summary"
        )
    ).map(
        summary => summary.textContent
    );

    expect(summaries).toEqual([
        "2026-08-24 - Nuovo",
        "2026-08-22 - Medio",
        "2026-08-20 - Vecchio"
    ]);

    [
        "Tipo: Ritmico",
        "Tipo: Melodico",
        "Tipo: Armonico",
        "Raccolta: Esame",
        "Raccolta: Lezione",
        "Raccolta: Nessuna",
        "Categorie corrette: Metrica"
    ].forEach(expectedText => {
        expect(
            savedDictationsContainer.textContent
        ).toContain(expectedText);
    });

    const links = Array.from(
        savedDictationsContainer.querySelectorAll(
            "a"
        )
    );

    links.forEach(link => {
        expect(link.textContent)
            .toBe("Apri video");

        expect(link.target)
            .toBe("_blank");

        expect(link.rel)
            .toBe("noopener noreferrer");
    });

    expect(getDeleteButtons())
        .toHaveLength(3);
});


test("uses empty category arrays when database values are missing", async () => {
    await showSavedDictations([
        makeDictation({
            available_categories: null,
            correct_categories: null
        })
    ]);

    expect(savedDictationsContainer.textContent)
        .toContain(
            "Categorie corrette: "
        );
});


test("filters saved dictations by collection", async () => {
    getDictationsFromServerMock
        .mockResolvedValueOnce([
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

    savedCollectionFilterElement.value =
        "Esame";

    savedCollectionFilterElement.dispatchEvent(
        new Event("change")
    );

    await waitForAsyncCode();

    expect(savedDictationsContainer.textContent)
        .toContain("Esame uno");

    expect(savedDictationsContainer.textContent)
        .not.toContain("Lezione uno");
});


test("shows an empty message when the filter has no results", async () => {
    getDictationsFromServerMock
        .mockResolvedValueOnce([
            makeDictation({
                collection: "Lezione"
            })
        ]);

    savedCollectionFilterElement.value =
        "Esame";

    savedCollectionFilterElement.dispatchEvent(
        new Event("change")
    );

    await waitForAsyncCode();

    expect(savedDictationsContainer.textContent)
        .toBe(
            "Non ci sono ancora dettati salvati."
        );
});


test("shows an error when saved dictations cannot be loaded", async () => {
    getDictationsFromServerMock
        .mockRejectedValueOnce(
            new Error("Database error")
        );

    showSavedButton.click();

    await waitForAsyncCode();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Non è stato possibile recuperare i dettati dal database."
        );
});


test("shows and hides the saved dictations section", async () => {
    expect(savedDictationsSection.hidden)
        .toBe(true);

    showSavedButton.click();

    await waitForAsyncCode();

    expect(savedDictationsSection.hidden)
        .toBe(false);

    expect(showSavedButton.textContent)
        .toBe(
            "Nascondi dettati salvati"
        );

    expect(getDictationsFromServerMock)
        .toHaveBeenCalledTimes(1);

    showSavedButton.click();

    await waitForAsyncCode();

    expect(savedDictationsSection.hidden)
        .toBe(true);

    expect(showSavedButton.textContent)
        .toBe(
            "Vedi dettati salvati"
        );

    expect(getDictationsFromServerMock)
        .toHaveBeenCalledTimes(1);
});


test("does not delete when confirmation is cancelled", async () => {
    await showSavedDictations([
        makeDictation()
    ]);

    confirmMock.mockReturnValueOnce(false);

    getDeleteButtons()[0].click();

    await waitForAsyncCode();

    expect(confirmMock)
        .toHaveBeenCalledWith(
            "Vuoi davvero eliminare questo dettato?"
        );

    expect(deleteDictationFromServerMock)
        .not.toHaveBeenCalled();
});


test("deletes a dictation after confirmation", async () => {
    await showSavedDictations([
        makeDictation({
            id: 25
        })
    ]);

    confirmMock.mockReturnValueOnce(true);

    deleteDictationFromServerMock
        .mockResolvedValueOnce({});

    getDeleteButtons()[0].click();

    await waitForAsyncCode();

    expect(deleteDictationFromServerMock)
        .toHaveBeenCalledWith(25);

    expect(savedDictationsContainer.textContent)
        .toBe(
            "Non ci sono ancora dettati salvati."
        );
});


test("shows an error when deletion fails", async () => {
    await showSavedDictations([
        makeDictation({
            id: 25
        })
    ]);

    confirmMock.mockReturnValueOnce(true);

    deleteDictationFromServerMock
        .mockRejectedValueOnce(
            new Error("Delete failed")
        );

    getDeleteButtons()[0].click();

    await waitForAsyncCode();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Non è stato possibile eliminare il dettato."
        );

    expect(savedDictationsContainer.textContent)
        .toContain("Dettato prova");
});