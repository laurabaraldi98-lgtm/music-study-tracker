const dictationDate = document.getElementById("dictation-date");
const dictationName = document.getElementById("dictation-name");
const youtubeLink = document.getElementById("youtube-link");

const dictationType = document.getElementById("dictation-type");

const categoriesContainer = document.getElementById(
    "categories-container"
);

const saveButton = document.getElementById("save-button");

const savedDictationsContainer = document.getElementById(
    "saved-dictations-container"
);

const showSavedButton = document.getElementById(
    "show-saved-button"
);

const savedDictationsSection = document.getElementById(
    "saved-dictations-section"
);

const manageCategoriesButton = document.getElementById(
    "manage-categories-button"
);

const categoryManager = document.getElementById(
    "category-manager"
);

const newCategoryInput = document.getElementById(
    "new-category"
);

const editableCategoriesContainer = document.getElementById(
    "editable-categories-container"
);

const addCategoryButton = document.getElementById(
    "add-category-button"
);

const defaultCategories = {
    rhythmic: [
        { id: null, name: "Metrica" },
        { id: null, name: "Pause" },
        { id: null, name: "Gruppi irregolari" }
    ],
    melodic: [
        { id: null, name: "Tonalità" },
        { id: null, name: "Ritmo" },
        { id: null, name: "Intervalli" },
        { id: null, name: "Modulazioni" }
    ],
    harmonic: [
        { id: null, name: "Basso" },
        { id: null, name: "Soprano" },
        { id: null, name: "Accordi" }
    ]
};

const categoriesQuestion = document.getElementById(
    "categories-question"
);

let categories = defaultCategories;

dictationType.addEventListener("change", function () {
    const selectedType = dictationType.value;
    categoriesQuestion.hidden = selectedType === "";
    manageCategoriesButton.hidden = selectedType === "";

    categoriesContainer.innerHTML = "";

    if (selectedType === "") {
        return;
    }

    const selectedCategories = categories[selectedType];

    for (const category of selectedCategories) {
        const categoryRow = document.createElement("div");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = category.name;

        const label = document.createElement("label");
        label.textContent = category.name;

        categoryRow.appendChild(checkbox);
        categoryRow.appendChild(label);

        if (!categoryManager.hidden) {
            const removeCategoryButton =
                document.createElement("button");

            removeCategoryButton.textContent = "Rimuovi";
            removeCategoryButton.classList.add(
                "remove-category-button"
            );

            removeCategoryButton.addEventListener(
                "click",
                async function () {
                    const confirmed = confirm(
                        `Vuoi davvero rimuovere la categoria "${category.name}"?`
                    );

                    if (!confirmed) {
                        return;
                    }

                    try {
                        await deleteCategoryFromServer(category.id);
                    } catch (error) {
                        console.error(error);

                        alert(
                            "Non è stato possibile eliminare la categoria."
                        );

                        return;
                    }

                    const categoryIndex =
                        categories[selectedType].findIndex(
                            function (savedCategory) {
                                return savedCategory.id === category.id;
                            }
                        );

                    categories[selectedType].splice(categoryIndex, 1);

                    dictationType.dispatchEvent(new Event("change"));
                }
            );

            categoryRow.appendChild(removeCategoryButton);
        }

        categoriesContainer.appendChild(categoryRow);
    }
});

saveButton.addEventListener("click", async function () {

    if (
        dictationDate.value === "" ||
        dictationName.value.trim() === "" ||
        youtubeLink.value.trim() === "" ||
        dictationType.value === ""
    ) {
        alert("Compila tutti i campi prima di salvare.");
        return;
    }

    const checkedBoxes = categoriesContainer.querySelectorAll(
        'input[type="checkbox"]:checked'
    );

    const correctCategories = [];

    for (const checkbox of checkedBoxes) {
        correctCategories.push(checkbox.value);
    }

    const typedName = dictationName.value.trim();

    const formattedName =
        typedName.charAt(0).toUpperCase() +
        typedName.slice(1);

    const dictation = {
        date: dictationDate.value,
        name: formattedName,
        youtubeLink: youtubeLink.value,
        type: dictationType.value,
        collection: dictationCollection.value,
        availableCategories: categories[
            dictationType.value
        ].map(function (category) {
            return category.name;
        }),
        correctCategories: correctCategories
    };

    try {
        await saveDictationToServer(dictation);
    } catch (error) {
        console.error(error);
        alert("Non è stato possibile salvare il dettato nel database.");
        return;
    }

    displaySavedDictations();

    dictationDate.value = "";
    dictationName.value = "";
    youtubeLink.value = "";
    dictationCollection.value = "";
    dictationType.value = "";

    categoriesContainer.innerHTML = "";

    manageCategoriesButton.hidden = true;
    manageCategoriesButton.textContent =
        "Gestisci categorie";

    categoryManager.hidden = true;
});

async function displaySavedDictations() {
    let savedDictations;

    try {
        savedDictations = await getDictationsFromServer();
    } catch (error) {
        console.error(error);
        alert("Non è stato possibile recuperare i dettati dal database.");
        return;
    }

    savedDictations = savedDictations.map(
        formatDictationFromDatabase
    );

    const selectedCollection =
        savedCollectionFilter.value;

    if (selectedCollection !== "") {
        savedDictations = savedDictations.filter(
            function (dictation) {
                return dictation.collection === selectedCollection;
            }
        );
    }

    if (savedDictations.length === 0) {
        savedDictationsContainer.textContent =
            "Non ci sono ancora dettati salvati.";

        return;
    }

    savedDictations.sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    savedDictationsContainer.innerHTML = "";

    savedDictations.forEach(function (dictation, index) {
        const details = document.createElement("details");

        const summary = document.createElement("summary");

        summary.textContent =
            `${dictation.date} - ${dictation.name}`;

        const typeParagraph = document.createElement("p");

        const typeNames = {
            rhythmic: "Ritmico",
            melodic: "Melodico",
            harmonic: "Armonico"
        };

        typeParagraph.textContent =
            `Tipo: ${typeNames[dictation.type]}`;

        const collectionParagraph = document.createElement("p");

        collectionParagraph.textContent =
            dictation.collection
                ? `Raccolta: ${dictation.collection}`
                : "Raccolta: Nessuna";

        const categoriesParagraph = document.createElement("p");

        categoriesParagraph.textContent =
            `Categorie corrette: ${dictation.correctCategories.join(", ")}`;

        const linkParagraph = document.createElement("p");

        const link = document.createElement("a");

        link.href = dictation.youtubeLink;
        link.textContent = "Apri video";
        link.target = "_blank";

        linkParagraph.textContent = "Link: ";
        linkParagraph.appendChild(link);

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Elimina";
        deleteButton.classList.add("delete-button");

        deleteButton.addEventListener("click", async function () {

            const confirmed = confirm(
                "Vuoi davvero eliminare questo dettato?"
            );

            if (!confirmed) {
                return;
            }
            try {
                await deleteDictationFromServer(dictation.id);
                displaySavedDictations();
            } catch (error) {
                console.error(error);
                alert("Non è stato possibile eliminare il dettato.");
            }

        });

        details.appendChild(summary);
        details.appendChild(typeParagraph);
        details.appendChild(collectionParagraph);
        details.appendChild(categoriesParagraph);
        details.appendChild(linkParagraph);
        details.appendChild(deleteButton);

        savedDictationsContainer.appendChild(details);
    })
}

savedCollectionFilter.addEventListener(
    "change",
    displaySavedDictations
);

showSavedButton.addEventListener("click", function () {
    savedDictationsSection.hidden =
        !savedDictationsSection.hidden;

    if (savedDictationsSection.hidden) {
        showSavedButton.textContent =
            "Vedi dettati salvati";
    } else {
        showSavedButton.textContent =
            "Nascondi dettati salvati";

        displaySavedDictations();
    }
});

manageCategoriesButton.addEventListener("click", function () {
    categoryManager.hidden = !categoryManager.hidden;

    if (categoryManager.hidden) {
        manageCategoriesButton.textContent =
            "Gestisci categorie";
    } else {
        manageCategoriesButton.textContent =
            "Nascondi gestione categorie";
    }

    dictationType.dispatchEvent(new Event("change"));
});

addCategoryButton.addEventListener("click", async function () {
    const typedCategory = newCategoryInput.value.trim();

    const newCategory =
        typedCategory.charAt(0).toUpperCase() +
        typedCategory.slice(1);

    if (newCategory === "") {
        return;
    }

    const selectedType = dictationType.value;

    const category = {
        type: selectedType,
        name: newCategory
    };

    let savedCategory;

    try {
        savedCategory =
            await saveCategoryToServer(category);
    } catch (error) {
        console.error(error);
        alert("Non è stato possibile salvare la categoria.");
        return;
    }

    categories[selectedType].push(savedCategory);

    dictationType.dispatchEvent(new Event("change"));

    newCategoryInput.value = "";
});

function formatCategoriesFromDatabase(categoryRows) {
    const formattedCategories = {
        rhythmic: [],
        melodic: [],
        harmonic: []
    };

    for (const category of categoryRows) {
        formattedCategories[category.type].push({
            id: category.id,
            name: category.name
        });
    }

    return formattedCategories;
}

async function loadCategories() {
    try {
        const categoryRows =
            await getCategoriesFromServer();

        categories =
            formatCategoriesFromDatabase(
                categoryRows
            );
    } catch (error) {
        console.error(error);

        categories = defaultCategories;

        alert(
            "Non è stato possibile caricare le categorie dal database."
        );
    }
}

loadCategories()

function formatDictationFromDatabase(dictation) {
    return {
        id: dictation.id,
        date: dictation.date,
        name: dictation.name,
        youtubeLink: dictation.youtube_link,
        type: dictation.type,
        collection: dictation.collection,
        availableCategories: dictation.available_categories || [],
        correctCategories: dictation.correct_categories || []
    };
}
