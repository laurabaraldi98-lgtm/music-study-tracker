document.body.innerHTML = `
    <select id="dictation-type">
        <option value=""></option>
        <option value="1">Ritmico</option>
        <option value="2">Melodico</option>
        <option value="3">Armonico</option>
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

global.dictationTypeSelect =
    document.getElementById("dictation-type");

global.dictationTypes = [
    {
        id: 1,
        name: "Ritmico",
        is_default: true
    },
    {
        id: 2,
        name: "Melodico",
        is_default: true
    },
    {
        id: 3,
        name: "Armonico",
        is_default: true
    }
];

const categoriesContainer =
    document.getElementById(
        "categories-container"
    );

const manageCategoriesButton =
    document.getElementById(
        "manage-categories-button"
    );

const categoryManager =
    document.getElementById(
        "category-manager"
    );

const newCategoryInput =
    document.getElementById(
        "new-category"
    );

const addCategoryButton =
    document.getElementById(
        "add-category-button"
    );

const categoriesQuestion =
    document.getElementById(
        "categories-question"
    );

const getCategoriesFromServerMock =
    jest.fn();

const saveCategoryToServerMock =
    jest.fn();

const deleteCategoryFromServerMock =
    jest.fn();

const alertMock = jest.fn();
const confirmMock = jest.fn();

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
        name: "Metrica",
        user_id: "user_test",
        dictation_type_id: 1
    },
    {
        id: 2,
        name: "Pause",
        user_id: "user_test",
        dictation_type_id: 1
    },
    {
        id: 3,
        name: "Gruppi irregolari",
        user_id: "user_test",
        dictation_type_id: 1
    },
    {
        id: 4,
        name: "Tonalità",
        user_id: "user_test",
        dictation_type_id: 2
    },
    {
        id: 5,
        name: "Ritmo",
        user_id: "user_test",
        dictation_type_id: 2
    },
    {
        id: 6,
        name: "Intervalli",
        user_id: "user_test",
        dictation_type_id: 2
    },
    {
        id: 7,
        name: "Modulazioni",
        user_id: "user_test",
        dictation_type_id: 2
    },
    {
        id: 8,
        name: "Basso",
        user_id: "user_test",
        dictation_type_id: 3
    },
    {
        id: 9,
        name: "Soprano",
        user_id: "user_test",
        dictation_type_id: 3
    },
    {
        id: 10,
        name: "Accordi",
        user_id: "user_test",
        dictation_type_id: 3
    }
];

async function waitForAsyncCode() {
    await Promise.resolve();
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
        new Event("dictation-types-loaded")
    );

    await waitForAsyncCode();
}

function selectType(typeId) {
    dictationTypeSelect.value =
        String(typeId);

    dictationTypeSelect.dispatchEvent(
        new Event("change")
    );
}

function getCategoryNames() {
    return Array.from(
        categoriesContainer.querySelectorAll(
            "label"
        )
    ).map(
        function (label) {
            return label.textContent;
        }
    );
}

function getRemoveButton() {
    return categoriesContainer.querySelector(
        ".remove-category-button"
    );
}

beforeEach(async function () {
    [
        getCategoriesFromServerMock,
        saveCategoryToServerMock,
        deleteCategoryFromServerMock,
        alertMock,
        confirmMock
    ].forEach(
        function (mock) {
            mock.mockReset();
        }
    );

    consoleErrorSpy.mockClear();

    dictationTypeSelect.value = "";
    newCategoryInput.value = "";

    categoriesContainer.innerHTML = "";

    categoriesQuestion.hidden = true;
    manageCategoriesButton.hidden = true;
    categoryManager.hidden = true;

    manageCategoriesButton.textContent =
        "Gestisci categorie";

    await loadCategories();

    getCategoriesFromServerMock.mockClear();
    alertMock.mockClear();
    consoleErrorSpy.mockClear();
});

afterAll(function () {
    consoleErrorSpy.mockRestore();
});

test(
    "hides categories when no dictation type is selected",
    function () {
        selectType("");

        expect(categoriesQuestion.hidden)
            .toBe(true);

        expect(manageCategoriesButton.hidden)
            .toBe(true);

        expect(categoriesContainer.innerHTML)
            .toBe("");
    }
);

test(
    "displays categories linked to the selected type",
    function () {
        selectType(1);

        expect(categoriesQuestion.hidden)
            .toBe(false);

        expect(manageCategoriesButton.hidden)
            .toBe(false);

        expect(getCategoryNames()).toEqual([
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
    }
);

test(
    "shows remove buttons when management is open",
    function () {
        selectType(1);

        manageCategoriesButton.click();

        expect(categoryManager.hidden)
            .toBe(false);

        expect(
            manageCategoriesButton.textContent
        ).toBe(
            "Nascondi gestione categorie"
        );

        expect(
            categoriesContainer.querySelectorAll(
                ".remove-category-button"
            )
        ).toHaveLength(3);
    }
);

test(
    "hides category management when clicked again",
    function () {
        selectType(1);

        manageCategoriesButton.click();
        manageCategoriesButton.click();

        expect(categoryManager.hidden)
            .toBe(true);

        expect(
            manageCategoriesButton.textContent
        ).toBe("Gestisci categorie");

        expect(
            categoriesContainer.querySelectorAll(
                ".remove-category-button"
            )
        ).toHaveLength(0);
    }
);

test(
    "does not save an empty category",
    async function () {
        selectType(1);

        newCategoryInput.value = "   ";

        addCategoryButton.click();

        await waitForAsyncCode();

        expect(saveCategoryToServerMock)
            .not.toHaveBeenCalled();
    }
);

test(
    "saves a category linked to the selected type",
    async function () {
        selectType(1);

        saveCategoryToServerMock
            .mockResolvedValueOnce({
                id: 11,
                name: "Accenti",
                user_id: "user_test",
                dictation_type_id: 1
            });

        newCategoryInput.value =
            "  accenti  ";

        addCategoryButton.click();

        await waitForAsyncCode();

        expect(saveCategoryToServerMock)
            .toHaveBeenCalledWith({
                dictationTypeId: 1,
                name: "Accenti"
            });

        expect(getCategoryNames())
            .toContain("Accenti");

        expect(newCategoryInput.value)
            .toBe("");
    }
);

test(
    "shows an error when saving fails",
    async function () {
        selectType(1);

        saveCategoryToServerMock
            .mockRejectedValueOnce(
                new Error("Save error")
            );

        newCategoryInput.value =
            "Accenti";

        addCategoryButton.click();

        await waitForAsyncCode();

        expect(consoleErrorSpy)
            .toHaveBeenCalled();

        expect(alertMock)
            .toHaveBeenCalledWith(
                "Non è stato possibile salvare la categoria."
            );

        expect(getCategoryNames())
            .not.toContain("Accenti");
    }
);

test(
    "does not delete when confirmation is cancelled",
    async function () {
        selectType(1);

        manageCategoriesButton.click();

        confirmMock.mockReturnValueOnce(false);

        getRemoveButton().click();

        await waitForAsyncCode();

        expect(confirmMock)
            .toHaveBeenCalledWith(
                'Vuoi davvero rimuovere la categoria "Metrica"?'
            );

        expect(deleteCategoryFromServerMock)
            .not.toHaveBeenCalled();

        expect(getCategoryNames())
            .toContain("Metrica");
    }
);

test(
    "deletes a category after confirmation",
    async function () {
        selectType(1);

        manageCategoriesButton.click();

        confirmMock.mockReturnValueOnce(true);

        deleteCategoryFromServerMock
            .mockResolvedValueOnce({});

        getRemoveButton().click();

        await waitForAsyncCode();

        expect(deleteCategoryFromServerMock)
            .toHaveBeenCalledWith(1);

        expect(getCategoryNames())
            .not.toContain("Metrica");
    }
);

test(
    "keeps the category when deletion fails",
    async function () {
        selectType(1);

        manageCategoriesButton.click();

        confirmMock.mockReturnValueOnce(true);

        deleteCategoryFromServerMock
            .mockRejectedValueOnce(
                new Error("Delete error")
            );

        getRemoveButton().click();

        await waitForAsyncCode();

        expect(consoleErrorSpy)
            .toHaveBeenCalled();

        expect(alertMock)
            .toHaveBeenCalledWith(
                "Non è stato possibile eliminare la categoria."
            );

        expect(getCategoryNames())
            .toContain("Metrica");
    }
);

test(
    "groups loaded categories by dictation type ID",
    async function () {
        await loadCategories([
            {
                id: 20,
                name: "Nuova melodica",
                user_id: "user_test",
                dictation_type_id: 2
            }
        ]);

        selectType(2);

        expect(getCategoryNames()).toEqual([
            "Nuova melodica"
        ]);
    }
);

test(
    "shows an error when loading categories fails",
    async function () {
        getCategoriesFromServerMock
            .mockRejectedValueOnce(
                new Error("Database error")
            );

        window.dispatchEvent(
            new Event(
                "dictation-types-loaded"
            )
        );

        await waitForAsyncCode();

        expect(consoleErrorSpy)
            .toHaveBeenCalled();

        expect(alertMock)
            .toHaveBeenCalledWith(
                "Non è stato possibile caricare le categorie dal database."
            );
    }
);

test(
    "does not load categories without a logged user",
    async function () {
        Clerk.user = null;

        window.dispatchEvent(
            new Event(
                "dictation-types-loaded"
            )
        );

        await waitForAsyncCode();

        expect(getCategoriesFromServerMock)
            .not.toHaveBeenCalled();
    }
);

test(
    "pressing Enter triggers Add exactly once",
    function () {
        const clickSpy = jest
            .spyOn(
                addCategoryButton,
                "click"
            )
            .mockImplementation(() => { });

        newCategoryInput.dispatchEvent(
            new KeyboardEvent(
                "keydown",
                {
                    key: "A",
                    bubbles: true,
                    cancelable: true
                }
            )
        );

        expect(clickSpy)
            .not.toHaveBeenCalled();

        const enterEvent =
            new KeyboardEvent(
                "keydown",
                {
                    key: "Enter",
                    bubbles: true,
                    cancelable: true
                }
            );

        newCategoryInput.dispatchEvent(
            enterEvent
        );

        expect(clickSpy)
            .toHaveBeenCalledTimes(1);

        expect(enterEvent.defaultPrevented)
            .toBe(true);

        clickSpy.mockRestore();
    }
);

test(
    "creates a category for a newly available type",
    async function () {
        const option =
            document.createElement("option");

        option.value = "99";
        option.textContent = "Personalizzato";

        dictationTypeSelect.appendChild(option);

        selectType(99);

        saveCategoryToServerMock
            .mockResolvedValueOnce({
                id: 50,
                name: "Nuova categoria",
                user_id: "user_test",
                dictation_type_id: 99
            });

        newCategoryInput.value =
            "nuova categoria";

        addCategoryButton.click();

        await waitForAsyncCode();

        expect(saveCategoryToServerMock)
            .toHaveBeenCalledWith({
                dictationTypeId: 99,
                name: "Nuova categoria"
            });

        expect(getCategoryNames())
            .toContain("Nuova categoria");
    }
);

test(
    "groups a category whose type was not preloaded",
    async function () {
        const option =
            document.createElement("option");

        option.value = "99";
        option.textContent = "Personalizzato";

        dictationTypeSelect.appendChild(option);

        await loadCategories([
            {
                id: 50,
                name: "Categoria personalizzata",
                user_id: "user_test",
                dictation_type_id: 99
            }
        ]);

        selectType(99);

        expect(getCategoryNames()).toEqual([
            "Categoria personalizzata"
        ]);
    }
);