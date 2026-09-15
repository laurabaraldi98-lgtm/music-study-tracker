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

const addCategoryButton = document.getElementById(
    "add-category-button"
);

const categoriesQuestion = document.getElementById(
    "categories-question"
);

let categories = {};

function renderCategories() {
    const selectedTypeId =
        dictationTypeSelect.value;

    categoriesQuestion.hidden =
        selectedTypeId === "";

    manageCategoriesButton.hidden =
        selectedTypeId === "";

    categoriesContainer.innerHTML = "";

    if (selectedTypeId === "") {
        categoryManager.hidden = true;

        manageCategoriesButton.textContent =
            "Gestisci categorie";

        return;
    }

    const selectedCategories =
        categories[selectedTypeId] || [];

    for (const category of selectedCategories) {
        const categoryRow =
            document.createElement("div");

        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.value = category.name;

        const label =
            document.createElement("label");

        label.textContent = category.name;

        categoryRow.appendChild(checkbox);
        categoryRow.appendChild(label);

        if (!categoryManager.hidden) {
            const removeCategoryButton =
                document.createElement("button");

            removeCategoryButton.type = "button";
            removeCategoryButton.textContent =
                "Rimuovi";

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
                        await deleteCategoryFromServer(
                            category.id
                        );
                    } catch (error) {
                        console.error(error);

                        alert(
                            "Non è stato possibile eliminare la categoria."
                        );

                        return;
                    }

                    categories[selectedTypeId] =
                        categories[
                            selectedTypeId
                        ].filter(
                            function (savedCategory) {
                                return (
                                    savedCategory.id !==
                                    category.id
                                );
                            }
                        );

                    renderCategories();
                }
            );

            categoryRow.appendChild(
                removeCategoryButton
            );
        }

        categoriesContainer.appendChild(
            categoryRow
        );
    }
}

dictationTypeSelect.addEventListener(
    "change",
    renderCategories
);

manageCategoriesButton.addEventListener(
    "click",
    function () {
        categoryManager.hidden =
            !categoryManager.hidden;

        if (categoryManager.hidden) {
            manageCategoriesButton.textContent =
                "Gestisci categorie";
        } else {
            manageCategoriesButton.textContent =
                "Nascondi gestione categorie";
        }

        renderCategories();
    }
);

addCategoryButton.addEventListener(
    "click",
    async function () {
        const selectedTypeId =
            dictationTypeSelect.value;

        const typedCategory =
            newCategoryInput.value.trim();

        if (
            selectedTypeId === "" ||
            typedCategory === ""
        ) {
            return;
        }

        const formattedName =
            typedCategory.charAt(0).toUpperCase() +
            typedCategory.slice(1);

        let savedCategory;

        try {
            savedCategory =
                await saveCategoryToServer({
                    dictationTypeId:
                        Number(selectedTypeId),
                    name: formattedName
                });
        } catch (error) {
            console.error(error);

            alert(
                "Non è stato possibile salvare la categoria."
            );

            return;
        }

        if (!categories[selectedTypeId]) {
            categories[selectedTypeId] = [];
        }

        categories[selectedTypeId].push(
            savedCategory
        );

        newCategoryInput.value = "";

        renderCategories();
    }
);

newCategoryInput.addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addCategoryButton.click();
        }
    }
);

function formatCategoriesFromDatabase(
    categoryRows
) {
    const formattedCategories = {};

    for (const type of dictationTypes) {
        formattedCategories[String(type.id)] = [];
    }

    for (const category of categoryRows) {
        const typeId =
            String(category.dictation_type_id);

        if (!formattedCategories[typeId]) {
            formattedCategories[typeId] = [];
        }

        formattedCategories[typeId].push({
            id: category.id,
            name: category.name,
            dictationTypeId:
                category.dictation_type_id
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

        renderCategories();
    } catch (error) {
        console.error(error);

        alert(
            "Non è stato possibile caricare le categorie dal database."
        );
    }
}

window.addEventListener(
    "dictation-types-loaded",
    function () {
        if (Clerk.user) {
            loadCategories();
        }
    }
);