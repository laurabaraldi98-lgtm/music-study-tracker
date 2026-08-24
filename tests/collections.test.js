document.body.innerHTML = `
    <select id="dictation-collection"></select>

    <button id="manage-collections-button">
        Gestisci raccolte
    </button>

    <div id="collection-manager" hidden></div>

    <input id="new-collection">

    <button id="add-collection-button">
        Aggiungi
    </button>

    <div id="collections-list"></div>

    <select id="saved-collection-filter"></select>
    <select id="calendar-collection-filter"></select>
    <select id="statistics-collection-filter"></select>
`;

const dictationCollection =
    document.getElementById("dictation-collection");

const manageCollectionsButton =
    document.getElementById("manage-collections-button");

const collectionManager =
    document.getElementById("collection-manager");

const newCollectionInput =
    document.getElementById("new-collection");

const addCollectionButton =
    document.getElementById("add-collection-button");

const collectionsList =
    document.getElementById("collections-list");

const savedCollectionFilter =
    document.getElementById("saved-collection-filter");

const calendarCollectionFilter =
    document.getElementById("calendar-collection-filter");

const statisticsCollectionFilter =
    document.getElementById("statistics-collection-filter");


const collectionFilters = [
    savedCollectionFilter,
    calendarCollectionFilter,
    statisticsCollectionFilter
];


const getCollectionsFromServerMock = jest.fn();
const saveCollectionToServerMock = jest.fn();
const deleteCollectionFromServerMock = jest.fn();

const alertMock = jest.fn();
const confirmMock = jest.fn();


const mocksToReset = [
    getCollectionsFromServerMock,
    saveCollectionToServerMock,
    deleteCollectionFromServerMock,
    alertMock,
    confirmMock
];


global.getCollectionsFromServer =
    getCollectionsFromServerMock;

global.saveCollectionToServer =
    saveCollectionToServerMock;

global.deleteCollectionFromServer =
    deleteCollectionFromServerMock;

global.alert = alertMock;
global.confirm = confirmMock;

global.Clerk = {
    user: {
        id: "user_test"
    }
};


const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => { });


require("../collections.js");


async function waitForAsyncCode() {
    await Promise.resolve();
    await Promise.resolve();
}


function getOptionValues(select) {
    return Array.from(select.options)
        .map(option => option.value);
}


function getRemoveButton() {
    return collectionsList.querySelector(
        ".remove-collection-button"
    );
}


async function loadCollections(collections = []) {
    getCollectionsFromServerMock.mockResolvedValueOnce(
        collections
    );

    Clerk.user = {
        id: "user_test"
    };

    window.dispatchEvent(
        new Event("clerk-ready")
    );

    await waitForAsyncCode();
}


beforeEach(async () => {
    mocksToReset.forEach(
        mock => mock.mockReset()
    );

    consoleErrorSpy.mockClear();

    newCollectionInput.value = "";

    collectionManager.hidden = true;

    manageCollectionsButton.textContent =
        "Gestisci raccolte";

    await loadCollections([]);

    [
        getCollectionsFromServerMock,
        alertMock
    ].forEach(
        mock => mock.mockClear()
    );

    consoleErrorSpy.mockClear();
});


afterAll(() => {
    consoleErrorSpy.mockRestore();
});


test("loads and displays collections", async () => {
    await loadCollections([
        {
            id: 1,
            name: "Esame"
        },
        {
            id: 2,
            name: "Lezione"
        }
    ]);

    expect(
        getOptionValues(dictationCollection)
    ).toEqual([
        "",
        "Esame",
        "Lezione"
    ]);

    collectionFilters.forEach(filter => {
        expect(
            getOptionValues(filter)
        ).toEqual([
            "",
            "Esame",
            "Lezione"
        ]);
    });

    [
        "Esame",
        "Lezione"
    ].forEach(collectionName => {
        expect(
            collectionsList.textContent
        ).toContain(collectionName);
    });

    expect(
        collectionsList.querySelectorAll(
            ".remove-collection-button"
        )
    ).toHaveLength(2);
});


test("shows an error when collections cannot be loaded", async () => {
    getCollectionsFromServerMock.mockRejectedValueOnce(
        new Error("Database error")
    );

    window.dispatchEvent(
        new Event("clerk-ready")
    );

    await waitForAsyncCode();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Non è stato possibile caricare le raccolte dal database."
        );
});


test("does not load collections when there is no logged user", async () => {
    Clerk.user = null;

    window.dispatchEvent(
        new Event("clerk-ready")
    );

    await waitForAsyncCode();

    expect(getCollectionsFromServerMock)
        .not.toHaveBeenCalled();
});


test("shows and hides the collection manager", () => {
    expect(collectionManager.hidden)
        .toBe(true);

    manageCollectionsButton.click();

    expect(collectionManager.hidden)
        .toBe(false);

    expect(manageCollectionsButton.textContent)
        .toBe("Nascondi gestione raccolte");

    manageCollectionsButton.click();

    expect(collectionManager.hidden)
        .toBe(true);

    expect(manageCollectionsButton.textContent)
        .toBe("Gestisci raccolte");
});


test("does not save an empty collection", async () => {
    newCollectionInput.value = "   ";

    addCollectionButton.click();

    await waitForAsyncCode();

    expect(saveCollectionToServerMock)
        .not.toHaveBeenCalled();
});


test("does not save a duplicate collection", async () => {
    await loadCollections([
        {
            id: 1,
            name: "Esame"
        }
    ]);

    newCollectionInput.value = "esame";

    addCollectionButton.click();

    await waitForAsyncCode();

    expect(saveCollectionToServerMock)
        .not.toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Questa raccolta esiste già."
        );
});


test("saves a new collection and updates the interface", async () => {
    saveCollectionToServerMock.mockResolvedValueOnce({
        id: 3,
        name: "Studio"
    });

    newCollectionInput.value = "  studio  ";

    addCollectionButton.click();

    await waitForAsyncCode();

    expect(saveCollectionToServerMock)
        .toHaveBeenCalledWith({
            name: "Studio"
        });

    expect(
        getOptionValues(dictationCollection)
    ).toEqual([
        "",
        "Studio"
    ]);

    expect(dictationCollection.value)
        .toBe("Studio");

    expect(newCollectionInput.value)
        .toBe("");

    expect(collectionsList.textContent)
        .toContain("Studio");

    collectionFilters.forEach(filter => {
        expect(
            getOptionValues(filter)
        ).toEqual([
            "",
            "Studio"
        ]);
    });
});


test("shows an error when a collection cannot be saved", async () => {
    saveCollectionToServerMock.mockRejectedValueOnce(
        new Error("Save error")
    );

    newCollectionInput.value = "Studio";

    addCollectionButton.click();

    await waitForAsyncCode();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Non è stato possibile salvare la raccolta."
        );

    expect(collectionsList.textContent)
        .not.toContain("Studio");
});


test("does not delete a collection when confirmation is cancelled", async () => {
    await loadCollections([
        {
            id: 1,
            name: "Esame"
        }
    ]);

    confirmMock.mockReturnValueOnce(false);

    getRemoveButton().click();

    await waitForAsyncCode();

    expect(confirmMock)
        .toHaveBeenCalledWith(
            'Vuoi davvero rimuovere la raccolta "Esame"?'
        );

    expect(deleteCollectionFromServerMock)
        .not.toHaveBeenCalled();

    expect(collectionsList.textContent)
        .toContain("Esame");
});


test("deletes a collection after confirmation", async () => {
    await loadCollections([
        {
            id: 1,
            name: "Esame"
        }
    ]);

    confirmMock.mockReturnValueOnce(true);

    deleteCollectionFromServerMock
        .mockResolvedValueOnce({});

    getRemoveButton().click();

    await waitForAsyncCode();

    expect(deleteCollectionFromServerMock)
        .toHaveBeenCalledWith(1);

    expect(collectionsList.textContent)
        .not.toContain("Esame");

    expect(
        getOptionValues(dictationCollection)
    ).toEqual([
        ""
    ]);
});


test("keeps the collection when deletion fails", async () => {
    await loadCollections([
        {
            id: 1,
            name: "Esame"
        }
    ]);

    confirmMock.mockReturnValueOnce(true);

    deleteCollectionFromServerMock
        .mockRejectedValueOnce(
            new Error("Delete error")
        );

    getRemoveButton().click();

    await waitForAsyncCode();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Non è stato possibile eliminare la raccolta."
        );

    expect(collectionsList.textContent)
        .toContain("Esame");
});


test("pressing Enter triggers Add exactly once", () => {
    const clickSpy = jest
        .spyOn(addCollectionButton, "click")
        .mockImplementation(() => { });

    newCollectionInput.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "A",
            bubbles: true,
            cancelable: true
        })
    );

    expect(clickSpy)
        .not.toHaveBeenCalled();

    const enterEvent =
        new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true
        });

    newCollectionInput.dispatchEvent(
        enterEvent
    );

    expect(clickSpy)
        .toHaveBeenCalledTimes(1);

    expect(enterEvent.defaultPrevented)
        .toBe(true);

    clickSpy.mockRestore();
});