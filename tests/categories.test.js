document.body.innerHTML = `
    <select id="dictation-type">
        <option value=""></option>
        <option value="rhythmic">Ritmico</option>
        <option value="melodic">Melodico</option>
        <option value="harmonic">Armonico</option>
    </select>

    <div id="categories-container"></div>

    <button id="manage-categories-button" hidden>
        Gestisci categorie
    </button>

    <div id="category-manager" hidden></div>

    <input id="new-category">

    <button id="add-category-button">
        Aggiungi
    </button>

    <div id="categories-question" hidden></div>
`;

const dictationType =
    document.getElementById("dictation-type");

const categoriesContainer =
    document.getElementById("categories-container");

const manageCategoriesButton =
    document.getElementById("manage-categories-button");

const categoryManager =
    document.getElementById("category-manager");

const newCategoryInput =
    document.getElementById("new-category");

const addCategoryButton =
    document.getElementById("add-category-button");

const categoriesQuestion =
    document.getElementById("categories-question");


const getCategoriesFromServerMock = jest.fn();
const saveCategoryToServerMock = jest.fn();
const deleteCategoryFromServerMock = jest.fn();

const alertMock = jest.fn();
const confirmMock = jest.fn();


const mocksToReset = [
    getCategoriesFromServerMock,
    saveCategoryToServerMock,
    deleteCategoryFromServerMock,
    alertMock,
    confirmMock
];


global.getCategoriesFromServer =
    getCategoriesFromServerMock;

global.saveCategoryToServer =
    saveCategoryToServerMock;

global.deleteCategoryFromServer =
    deleteCategoryFromServerMock;

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


require("../categories.js");


const defaultCategoryRows = [
    {
        id: 1,
        type: "rhythmic",
        name: "Metrica"
    },
    {
        id: 2,
        type: "rhythmic",
        name: "Pause"
    },
    {
        id: 3,
        type: "rhythmic",
        name: "Gruppi irregolari"
    },
    {
        id: 4,
        type: "melodic",
        name: "Tonalità"
    },
    {
        id: 5,
        type: "melodic",
        name: "Ritmo"
    },
    {
        id: 6,
        type: "melodic",
        name: "Intervalli"
    },
    {
        id: 7,
        type: "melodic",
        name: "Modulazioni"
    },
    {
        id: 8,
        type: "harmonic",
        name: "Basso"
    },
    {
        id: 9,
        type: "harmonic",
        name: "Soprano"
    },
    {
        id: 10,
        type: "harmonic",
        name: "Accordi"
    }
];


async function flushPromises() {
    await Promise.resolve();
    await Promise.resolve();
}


async function loadCategories(
    categoryRows = defaultCategoryRows
) {
    getCategoriesFromServerMock
        .mockResolvedValueOnce(categoryRows);

    Clerk.user = {
        id: "user_test"
    };

    window.dispatchEvent(
        new Event("clerk-ready")
    );

    await flushPromises();
}


function selectType(type) {
    dictationType.value = type;

    dictationType.dispatchEvent(
        new Event("change")
    );
}


function getCategoryNames() {
    return Array.from(
        categoriesContainer.querySelectorAll("label")
    ).map(label => label.textContent);
}


function getRemoveButton() {
    return categoriesContainer.querySelector(
        ".remove-category-button"
    );
}


beforeEach(async () => {
    mocksToReset.forEach(
        mock => mock.mockReset()
    );

    consoleErrorSpy.mockClear();

    dictationType.value = "";
    newCategoryInput.value = "";

    categoriesContainer.innerHTML = "";

    categoriesQuestion.hidden = true;
    manageCategoriesButton.hidden = true;

    categoryManager.hidden = true;

    manageCategoriesButton.textContent =
        "Gestisci categorie";

    await loadCategories();

    [
        getCategoriesFromServerMock,
        alertMock
    ].forEach(
        mock => mock.mockClear()
    );

    consoleErrorSpy.mockClear();
});


afterAll(() => {
    consoleErrorSpy.mockRestore();
});


test("hides categories when no dictation type is selected", () => {
    selectType("");

    expect(categoriesQuestion.hidden)
        .toBe(true);

    expect(manageCategoriesButton.hidden)
        .toBe(true);

    expect(categoriesContainer.innerHTML)
        .toBe("");
});


test("displays the categories for the selected type", () => {
    selectType("rhythmic");

    expect(categoriesQuestion.hidden)
        .toBe(false);

    expect(manageCategoriesButton.hidden)
        .toBe(false);

    expect(
        getCategoryNames()
    ).toEqual([
        "Metrica",
        "Pause",
        "Gruppi irregolari"
    ]);

    expect(
        categoriesContainer.querySelectorAll(
            'input[type="checkbox"]'
        )
    ).toHaveLength(3);

    expect(
        categoriesContainer.querySelectorAll(
            ".remove-category-button"
        )
    ).toHaveLength(0);
});


test("shows remove buttons when category management is open", () => {
    selectType("rhythmic");

    manageCategoriesButton.click();

    expect(categoryManager.hidden)
        .toBe(false);

    expect(manageCategoriesButton.textContent)
        .toBe("Nascondi gestione categorie");

    expect(
        categoriesContainer.querySelectorAll(
            ".remove-category-button"
        )
    ).toHaveLength(3);
});


test("hides category management when the button is clicked again", () => {
    selectType("rhythmic");

    manageCategoriesButton.click();
    manageCategoriesButton.click();

    expect(categoryManager.hidden)
        .toBe(true);

    expect(manageCategoriesButton.textContent)
        .toBe("Gestisci categorie");

    expect(
        categoriesContainer.querySelectorAll(
            ".remove-category-button"
        )
    ).toHaveLength(0);
});


test("does not save an empty category", async () => {
    selectType("rhythmic");

    newCategoryInput.value = "   ";

    addCategoryButton.click();

    await flushPromises();

    expect(saveCategoryToServerMock)
        .not.toHaveBeenCalled();
});


test("saves a new category and updates the interface", async () => {
    selectType("rhythmic");

    saveCategoryToServerMock.mockResolvedValueOnce({
        id: 11,
        type: "rhythmic",
        name: "Accenti"
    });

    newCategoryInput.value = "  accenti  ";

    addCategoryButton.click();

    await flushPromises();

    expect(saveCategoryToServerMock)
        .toHaveBeenCalledWith({
            type: "rhythmic",
            name: "Accenti"
        });

    expect(
        getCategoryNames()
    ).toContain("Accenti");

    expect(newCategoryInput.value)
        .toBe("");
});


test("shows an error when a category cannot be saved", async () => {
    selectType("rhythmic");

    saveCategoryToServerMock.mockRejectedValueOnce(
        new Error("Save error")
    );

    newCategoryInput.value = "Accenti";

    addCategoryButton.click();

    await flushPromises();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Non è stato possibile salvare la categoria."
        );

    expect(
        getCategoryNames()
    ).not.toContain("Accenti");
});


test("does not delete a category when confirmation is cancelled", async () => {
    selectType("rhythmic");

    manageCategoriesButton.click();

    confirmMock.mockReturnValueOnce(false);

    getRemoveButton().click();

    await flushPromises();

    expect(confirmMock)
        .toHaveBeenCalledWith(
            'Vuoi davvero rimuovere la categoria "Metrica"?'
        );

    expect(deleteCategoryFromServerMock)
        .not.toHaveBeenCalled();

    expect(
        getCategoryNames()
    ).toContain("Metrica");
});


test("deletes a category after confirmation", async () => {
    selectType("rhythmic");

    manageCategoriesButton.click();

    confirmMock.mockReturnValueOnce(true);

    deleteCategoryFromServerMock
        .mockResolvedValueOnce({});

    getRemoveButton().click();

    await flushPromises();

    expect(deleteCategoryFromServerMock)
        .toHaveBeenCalledWith(1);

    expect(
        getCategoryNames()
    ).not.toContain("Metrica");
});


test("keeps the category when deletion fails", async () => {
    selectType("rhythmic");

    manageCategoriesButton.click();

    confirmMock.mockReturnValueOnce(true);

    deleteCategoryFromServerMock
        .mockRejectedValueOnce(
            new Error("Delete error")
        );

    getRemoveButton().click();

    await flushPromises();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Non è stato possibile eliminare la categoria."
        );

    expect(
        getCategoryNames()
    ).toContain("Metrica");
});


test("loads categories from the database", async () => {
    await loadCategories([
        {
            id: 20,
            type: "melodic",
            name: "Nuova melodica"
        }
    ]);

    selectType("melodic");

    expect(
        getCategoryNames()
    ).toEqual([
        "Nuova melodica"
    ]);
});


test("uses default categories when loading fails", async () => {
    getCategoriesFromServerMock.mockRejectedValueOnce(
        new Error("Database error")
    );

    window.dispatchEvent(
        new Event("clerk-ready")
    );

    await flushPromises();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Non è stato possibile caricare le categorie dal database."
        );

    selectType("harmonic");

    expect(
        getCategoryNames()
    ).toEqual([
        "Basso",
        "Soprano",
        "Accordi"
    ]);
});


test("does not load categories when there is no logged user", async () => {
    Clerk.user = null;

    window.dispatchEvent(
        new Event("clerk-ready")
    );

    await flushPromises();

    expect(getCategoriesFromServerMock)
        .not.toHaveBeenCalled();
});


test("pressing Enter triggers Add exactly once", () => {
    const clickSpy = jest
        .spyOn(addCategoryButton, "click")
        .mockImplementation(() => { });

    newCategoryInput.dispatchEvent(
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

    newCategoryInput.dispatchEvent(
        enterEvent
    );

    expect(clickSpy)
        .toHaveBeenCalledTimes(1);

    expect(enterEvent.defaultPrevented)
        .toBe(true);

    clickSpy.mockRestore();
});