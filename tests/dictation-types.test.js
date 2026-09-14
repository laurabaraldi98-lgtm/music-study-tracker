document.body.innerHTML = `
    <select id="dictation-type">
        <option value="">
            Seleziona un tipo
        </option>
    </select>

    <button id="manage-dictation-types-button">
        Gestisci tipi di dettato
    </button>

    <div id="dictation-type-manager" hidden>
        <input id="new-dictation-type">

        <button id="add-dictation-type-button">
            Aggiungi
        </button>

        <div id="dictation-types-list"></div>
    </div>
`;

const dictationTypeSelect =
    document.getElementById(
        "dictation-type"
    );

const manageDictationTypesButton =
    document.getElementById(
        "manage-dictation-types-button"
    );

const dictationTypeManager =
    document.getElementById(
        "dictation-type-manager"
    );

const newDictationTypeInput =
    document.getElementById(
        "new-dictation-type"
    );

const addDictationTypeButton =
    document.getElementById(
        "add-dictation-type-button"
    );

const dictationTypesList =
    document.getElementById(
        "dictation-types-list"
    );

const getDictationTypesFromServerMock =
    jest.fn();

const saveDictationTypeToServerMock =
    jest.fn();

const deleteDictationTypeFromServerMock =
    jest.fn();

const alertMock = jest.fn();
const confirmMock = jest.fn();

global.getDictationTypesFromServer =
    getDictationTypesFromServerMock;

global.saveDictationTypeToServer =
    saveDictationTypeToServerMock;

global.deleteDictationTypeFromServer =
    deleteDictationTypeFromServerMock;

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

const defaultTypes = [
    {
        id: 1,
        name: "Ritmico",
        user_id: "user_test",
        is_default: true
    },
    {
        id: 2,
        name: "Melodico",
        user_id: "user_test",
        is_default: true
    },
    {
        id: 3,
        name: "Armonico",
        user_id: "user_test",
        is_default: true
    }
];

require("../dictation-types.js");

async function waitForAsyncCode() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

async function loadDictationTypes(
    types = defaultTypes
) {
    getDictationTypesFromServerMock
        .mockResolvedValueOnce(
            types.map(function (type) {
                return { ...type };
            })
        );

    Clerk.user = {
        id: "user_test"
    };

    window.dispatchEvent(
        new Event("clerk-ready")
    );

    await waitForAsyncCode();
}

function getSelectOptions() {
    return Array.from(
        dictationTypeSelect.options
    ).map(
        function (option) {
            return {
                value: option.value,
                text: option.textContent
            };
        }
    );
}

function getTypeNames() {
    return Array.from(
        dictationTypesList.querySelectorAll(
            "span"
        )
    ).map(
        function (element) {
            return element.textContent;
        }
    );
}

function getRemoveButtons() {
    return dictationTypesList.querySelectorAll(
        ".remove-dictation-type-button"
    );
}

beforeEach(async function () {
    [
        getDictationTypesFromServerMock,
        saveDictationTypeToServerMock,
        deleteDictationTypeFromServerMock,
        alertMock,
        confirmMock
    ].forEach(
        function (mock) {
            mock.mockReset();
        }
    );

    consoleErrorSpy.mockClear();

    dictationTypeSelect.innerHTML = `
        <option value="">
            Seleziona un tipo
        </option>
    `;

    dictationTypeManager.hidden = true;

    manageDictationTypesButton.textContent =
        "Gestisci tipi di dettato";

    newDictationTypeInput.value = "";
    dictationTypesList.innerHTML = "";

    await loadDictationTypes();

    getDictationTypesFromServerMock.mockClear();
    alertMock.mockClear();
    consoleErrorSpy.mockClear();
});

afterAll(function () {
    consoleErrorSpy.mockRestore();
});

test(
    "loads the user's dictation types",
    function () {
        expect(getSelectOptions()).toEqual([
            {
                value: "",
                text: "Seleziona un tipo"
            },
            {
                value: "1",
                text: "Ritmico"
            },
            {
                value: "2",
                text: "Melodico"
            },
            {
                value: "3",
                text: "Armonico"
            }
        ]);

        expect(getTypeNames()).toEqual([
            "Ritmico",
            "Melodico",
            "Armonico"
        ]);
    }
);

test(
    "opens and closes dictation type management",
    function () {
        manageDictationTypesButton.click();

        expect(dictationTypeManager.hidden)
            .toBe(false);

        expect(
            manageDictationTypesButton.textContent
        ).toBe(
            "Nascondi gestione tipi di dettato"
        );

        manageDictationTypesButton.click();

        expect(dictationTypeManager.hidden)
            .toBe(true);

        expect(
            manageDictationTypesButton.textContent
        ).toBe(
            "Gestisci tipi di dettato"
        );
    }
);

test(
    "does not save an empty dictation type",
    async function () {
        newDictationTypeInput.value = "   ";

        addDictationTypeButton.click();

        await waitForAsyncCode();

        expect(saveDictationTypeToServerMock)
            .not.toHaveBeenCalled();
    }
);

test(
    "creates and selects a custom dictation type",
    async function () {
        const savedType = {
            id: 4,
            name: "Contrappunto",
            user_id: "user_test",
            is_default: false
        };

        saveDictationTypeToServerMock
            .mockResolvedValueOnce(savedType);

        newDictationTypeInput.value =
            "  contrappunto  ";

        addDictationTypeButton.click();

        await waitForAsyncCode();

        expect(saveDictationTypeToServerMock)
            .toHaveBeenCalledWith({
                name: "Contrappunto"
            });

        expect(getTypeNames())
            .toContain("Contrappunto");

        expect(dictationTypeSelect.value)
            .toBe("4");

        expect(newDictationTypeInput.value)
            .toBe("");
    }
);

test(
    "shows the server error when creation fails",
    async function () {
        saveDictationTypeToServerMock
            .mockRejectedValueOnce(
                new Error(
                    "Esiste già un tipo di dettato con questo nome"
                )
            );

        newDictationTypeInput.value =
            "Ritmico";

        addDictationTypeButton.click();

        await waitForAsyncCode();

        expect(consoleErrorSpy)
            .toHaveBeenCalled();

        expect(alertMock)
            .toHaveBeenCalledWith(
                "Esiste già un tipo di dettato con questo nome"
            );

        expect(getTypeNames()).toEqual([
            "Ritmico",
            "Melodico",
            "Armonico"
        ]);
    }
);

test(
    "does not delete when confirmation is cancelled",
    async function () {
        confirmMock.mockReturnValueOnce(false);

        getRemoveButtons()[0].click();

        await waitForAsyncCode();

        expect(confirmMock)
            .toHaveBeenCalledWith(
                'Vuoi davvero rimuovere il tipo "Ritmico"?'
            );

        expect(deleteDictationTypeFromServerMock)
            .not.toHaveBeenCalled();

        expect(getTypeNames())
            .toContain("Ritmico");
    }
);

test(
    "deletes a dictation type after confirmation",
    async function () {
        confirmMock.mockReturnValueOnce(true);

        deleteDictationTypeFromServerMock
            .mockResolvedValueOnce({
                id: 1,
                name: "Ritmico"
            });

        getRemoveButtons()[0].click();

        await waitForAsyncCode();

        expect(deleteDictationTypeFromServerMock)
            .toHaveBeenCalledWith(1);

        expect(getTypeNames())
            .not.toContain("Ritmico");

        expect(
            getSelectOptions().map(
                function (option) {
                    return option.text;
                }
            )
        ).not.toContain("Ritmico");
    }
);

test(
    "keeps the type when deletion fails",
    async function () {
        confirmMock.mockReturnValueOnce(true);

        deleteDictationTypeFromServerMock
            .mockRejectedValueOnce(
                new Error(
                    "Non puoi eliminare un tipo utilizzato"
                )
            );

        getRemoveButtons()[0].click();

        await waitForAsyncCode();

        expect(consoleErrorSpy)
            .toHaveBeenCalled();

        expect(alertMock)
            .toHaveBeenCalledWith(
                "Non puoi eliminare un tipo utilizzato"
            );

        expect(getTypeNames())
            .toContain("Ritmico");
    }
);

test(
    "shows an error when loading types fails",
    async function () {
        getDictationTypesFromServerMock
            .mockRejectedValueOnce(
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
                "Database error"
            );
    }
);

test(
    "does not load types without a logged user",
    async function () {
        Clerk.user = null;

        window.dispatchEvent(
            new Event("clerk-ready")
        );

        await waitForAsyncCode();

        expect(getDictationTypesFromServerMock)
            .not.toHaveBeenCalled();
    }
);

test(
    "pressing Enter triggers Add exactly once",
    function () {
        const clickSpy = jest
            .spyOn(
                addDictationTypeButton,
                "click"
            )
            .mockImplementation(() => { });

        newDictationTypeInput.dispatchEvent(
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

        newDictationTypeInput.dispatchEvent(
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
    "shows an empty message when there are no types",
    async function () {
        await loadDictationTypes([]);

        expect(dictationTypesList.textContent)
            .toBe(
                "Non ci sono tipi di dettato."
            );

        expect(getSelectOptions()).toEqual([
            {
                value: "",
                text: "Seleziona un tipo"
            }
        ]);
    }
);

test(
    "preserves the selected type when reloading",
    async function () {
        dictationTypeSelect.value = "2";

        await loadDictationTypes();

        expect(dictationTypeSelect.value)
            .toBe("2");
    }
);