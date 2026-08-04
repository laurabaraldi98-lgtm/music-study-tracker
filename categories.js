const dictationType = document.getElementById("dictation-type");

const categoriesContainer = document.getElementById(
    "categories-container"
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

const categoriesQuestion = document.getElementById(
    "categories-question"
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

window.addEventListener(
    "clerk-ready",
    function () {
        if (Clerk.user) {
            loadCategories();
        }
    }
);