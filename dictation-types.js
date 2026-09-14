const dictationTypeSelect = document.getElementById(
    "dictation-type"
);

const manageDictationTypesButton = document.getElementById(
    "manage-dictation-types-button"
);

const dictationTypeManager = document.getElementById(
    "dictation-type-manager"
);

const newDictationTypeInput = document.getElementById(
    "new-dictation-type"
);

const addDictationTypeButton = document.getElementById(
    "add-dictation-type-button"
);

const dictationTypesList = document.getElementById(
    "dictation-types-list"
);

let dictationTypes = [];

function renderDictationTypeSelect() {
    const selectedTypeId = dictationTypeSelect.value;

    dictationTypeSelect.innerHTML = "";

    const placeholderOption = document.createElement("option");

    placeholderOption.value = "";
    placeholderOption.textContent = "Seleziona un tipo";

    dictationTypeSelect.appendChild(placeholderOption);

    for (const type of dictationTypes) {
        const option = document.createElement("option");

        option.value = String(type.id);
        option.textContent = type.name;

        dictationTypeSelect.appendChild(option);
    }

    const selectedTypeStillExists = dictationTypes.some(
        function (type) {
            return String(type.id) === selectedTypeId;
        }
    );

    if (selectedTypeStillExists) {
        dictationTypeSelect.value = selectedTypeId;
    }
}

function renderDictationTypesList() {
    dictationTypesList.innerHTML = "";

    if (dictationTypes.length === 0) {
        dictationTypesList.textContent =
            "Non ci sono tipi di dettato.";

        return;
    }

    for (const type of dictationTypes) {
        const typeRow = document.createElement("div");

        const typeName = document.createElement("span");

        typeName.textContent = type.name;

        const removeButton = document.createElement("button");

        removeButton.type = "button";
        removeButton.textContent = "Rimuovi";
        removeButton.classList.add(
            "remove-dictation-type-button"
        );

        removeButton.addEventListener(
            "click",
            async function () {
                const confirmed = confirm(
                    `Vuoi davvero rimuovere il tipo "${type.name}"?`
                );

                if (!confirmed) {
                    return;
                }

                try {
                    await deleteDictationTypeFromServer(type.id);
                } catch (error) {
                    console.error(error);
                    alert(error.message);
                    return;
                }

                dictationTypes = dictationTypes.filter(
                    function (savedType) {
                        return savedType.id !== type.id;
                    }
                );

                renderDictationTypeSelect();
                renderDictationTypesList();

                dictationTypeSelect.dispatchEvent(
                    new Event("change")
                );
            }
        );

        typeRow.appendChild(typeName);
        typeRow.appendChild(removeButton);

        dictationTypesList.appendChild(typeRow);
    }
}

async function loadDictationTypes() {
    try {
        dictationTypes =
            await getDictationTypesFromServer();

        renderDictationTypeSelect();
        renderDictationTypesList();

        dictationTypeSelect.dispatchEvent(
            new Event("change")
        );

        window.dispatchEvent(
            new Event("dictation-types-loaded")
        );
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

manageDictationTypesButton.addEventListener(
    "click",
    function () {
        dictationTypeManager.hidden =
            !dictationTypeManager.hidden;

        if (dictationTypeManager.hidden) {
            manageDictationTypesButton.textContent =
                "Gestisci tipi di dettato";
        } else {
            manageDictationTypesButton.textContent =
                "Nascondi gestione tipi di dettato";

            renderDictationTypesList();
        }
    }
);

addDictationTypeButton.addEventListener(
    "click",
    async function () {
        const typedName =
            newDictationTypeInput.value.trim();

        if (typedName === "") {
            return;
        }

        const formattedName =
            typedName.charAt(0).toUpperCase() +
            typedName.slice(1);

        let savedType;

        try {
            savedType =
                await saveDictationTypeToServer({
                    name: formattedName
                });
        } catch (error) {
            console.error(error);
            alert(error.message);
            return;
        }

        dictationTypes.push(savedType);

        renderDictationTypeSelect();
        renderDictationTypesList();

        dictationTypeSelect.value = String(savedType.id);

        dictationTypeSelect.dispatchEvent(
            new Event("change")
        );

        newDictationTypeInput.value = "";
    }
);

newDictationTypeInput.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addDictationTypeButton.click();
        }
    }
);

window.addEventListener(
    "clerk-ready",
    function () {
        if (Clerk.user) {
            loadDictationTypes();
        }
    }
);