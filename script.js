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

const showStatisticsButton = document.getElementById(
    "show-statistics-button"
);

const statisticsSection = document.getElementById(
    "statistics-section"
);

const statisticsContainer = document.getElementById(
    "statistics-container"
);

const defaultCategories = {
    rhythmic: ["Metrica", "Pause", "Gruppi irregolari"],
    melodic: ["Tonalità", "Ritmo", "Intervalli", "Modulazioni"],
    harmonic: ["Basso", "Soprano", "Accordi"]
};

const categoriesQuestion = document.getElementById(
    "categories-question"
);

const dictationCollection = document.getElementById(
    "dictation-collection"
);

const manageCollectionsButton = document.getElementById(
    "manage-collections-button"
);

const collectionManager = document.getElementById(
    "collection-manager"
);

const newCollectionInput = document.getElementById(
    "new-collection"
);

const addCollectionButton = document.getElementById(
    "add-collection-button"
);

const savedCollectionsJSON =
    localStorage.getItem("collections");

const collectionsList = document.getElementById(
    "collections-list"
);

const showCalendarButton = document.getElementById(
    "show-calendar-button"
);

const calendarSection = document.getElementById(
    "calendar-section"
);

const calendarContainer = document.getElementById(
    "calendar-container"
);

const calendarModal = document.getElementById(
    "calendar-modal"
);

const closeCalendarModalButton = document.getElementById(
    "close-calendar-modal"
);

const calendarModalTitle = document.getElementById(
    "calendar-modal-title"
);

const calendarModalDictations = document.getElementById(
    "calendar-modal-dictations"
);

closeCalendarModalButton.addEventListener("click", function () {
    calendarModal.hidden = true;
});

let collections;

if (savedCollectionsJSON === null) {
    collections = [];
} else {
    collections = JSON.parse(savedCollectionsJSON);
}

function displayCollections() {
    dictationCollection.innerHTML = `
        <option value="">
            Nessuna raccolta
        </option>
    `;

    collectionsList.innerHTML = "";

    for (const collection of collections) {
        const option = document.createElement("option");

        option.value = collection;
        option.textContent = collection;

        dictationCollection.appendChild(option);

        const collectionRow = document.createElement("div");

        const collectionName = document.createElement("span");
        collectionName.textContent = collection;

        const removeCollectionButton =
            document.createElement("button");

        removeCollectionButton.textContent = "Rimuovi";
        removeCollectionButton.classList.add(
            "remove-collection-button"
        );

        removeCollectionButton.addEventListener("click", function () {
            const confirmed = confirm(
                `Vuoi davvero rimuovere la raccolta "${collection}"?`
            );

            if (!confirmed) {
                return;
            }

            const collectionIndex =
                collections.indexOf(collection);

            collections.splice(collectionIndex, 1);

            localStorage.setItem(
                "collections",
                JSON.stringify(collections)
            );

            displayCollections();
        });

        collectionRow.appendChild(collectionName);
        collectionRow.appendChild(removeCollectionButton);

        collectionsList.appendChild(collectionRow);
    }
}

displayCollections();

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
        checkbox.value = category;

        const label = document.createElement("label");
        label.textContent = category;

        categoryRow.appendChild(checkbox);
        categoryRow.appendChild(label);

        if (!categoryManager.hidden) {
            const removeCategoryButton =
                document.createElement("button");

            removeCategoryButton.textContent = "Rimuovi";
            removeCategoryButton.classList.add(
                "remove-category-button"
            );

            removeCategoryButton.addEventListener("click", function () {
                const confirmed = confirm(
                    `Vuoi davvero rimuovere la categoria "${category}"?`
                );

                if (!confirmed) {
                    return;
                }

                const categoryIndex =
                    categories[selectedType].indexOf(category);

                categories[selectedType].splice(categoryIndex, 1);

                localStorage.setItem(
                    "categories",
                    JSON.stringify(categories)
                );

                dictationType.dispatchEvent(new Event("change"));
            });

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
        availableCategories: [...categories[dictationType.value]],
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

    console.log(savedDictations);
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

manageCollectionsButton.addEventListener("click", function () {
    collectionManager.hidden = !collectionManager.hidden;

    if (collectionManager.hidden) {
        manageCollectionsButton.textContent =
            "Gestisci raccolte";
    } else {
        manageCollectionsButton.textContent =
            "Nascondi gestione raccolte";
    }
});

addCollectionButton.addEventListener("click", function () {
    const typedCollection =
        newCollectionInput.value.trim();

    const newCollection =
        typedCollection.charAt(0).toUpperCase() +
        typedCollection.slice(1);

    if (newCollection === "") {
        return;
    }

    const collectionAlreadyExists = collections.some(
        collection =>
            collection.toLowerCase() ===
            newCollection.toLowerCase()
    );

    if (collectionAlreadyExists) {
        alert("Questa raccolta esiste già.");
        return;
    }

    collections.push(newCollection);

    localStorage.setItem(
        "collections",
        JSON.stringify(collections)
    );

    displayCollections();

    dictationCollection.value = newCollection;

    newCollectionInput.value = "";
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

    try {
        await saveCategoryToServer(category);
    } catch (error) {
        console.error(error);
        alert("Non è stato possibile salvare la categoria.");
        return;
    }

    categories[selectedType].push(newCategory);

    dictationType.dispatchEvent(new Event("change"));

    newCategoryInput.value = "";
});

async function saveDictationToServer(dictation) {
    const response = await fetch(
        "http://localhost:3000/dictations",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dictation)
        }
    );

    if (!response.ok) {
        throw new Error("Errore durante il salvataggio");
    }

    return response.json();
}

async function getCategoriesFromServer() {
    const response = await fetch(
        "http://localhost:3000/categories"
    );

    if (!response.ok) {
        throw new Error(
            "Errore durante il recupero delle categorie"
        );
    }

    return response.json();
}

function formatCategoriesFromDatabase(categoryRows) {
    const formattedCategories = {
        rhythmic: [],
        melodic: [],
        harmonic: []
    };

    for (const category of categoryRows) {
        formattedCategories[category.type].push(category.name);
    }

    return formattedCategories;
}

async function loadCategories() {
    try {
        const categoryRows = await getCategoriesFromServer();

        categories = formatCategoriesFromDatabase(categoryRows);
    } catch (error) {
        console.error(error);

        categories = defaultCategories;

        alert(
            "Non è stato possibile caricare le categorie dal database."
        );
    }
}

loadCategories()

async function getDictationsFromServer() {
    const response = await fetch(
        "http://localhost:3000/dictations"
    );

    if (!response.ok) {
        throw new Error("Errore durante il recupero dei dettati");
    }

    return response.json();
}

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

async function deleteDictationFromServer(id) {
    const response = await fetch(
        `http://localhost:3000/dictations/${id}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        throw new Error("Errore durante l'eliminazione");
    }

    return response.json();
}

async function saveCategoryToServer(category) {
    const response = await fetch(
        "http://localhost:3000/categories",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(category)
        }
    );

    if (!response.ok) {
        throw new Error("Errore durante il salvataggio della categoria");
    }

    return response.json();
}

let displayedMonth = new Date().getMonth();
let displayedYear = new Date().getFullYear();

async function displayCalendar() {
    const year = displayedYear;
    const month = displayedMonth;

    let savedDictations;

    try {
        savedDictations = await getDictationsFromServer();
    } catch (error) {
        console.error(error);
        alert("Non è stato possibile caricare il calendario.");
        return;
    }

    savedDictations = savedDictations.map(
        formatDictationFromDatabase
    );

    const monthNames = [
        "Gennaio",
        "Febbraio",
        "Marzo",
        "Aprile",
        "Maggio",
        "Giugno",
        "Luglio",
        "Agosto",
        "Settembre",
        "Ottobre",
        "Novembre",
        "Dicembre"
    ];

    const firstDayOfMonth = new Date(year, month, 1);

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    let startingDay = firstDayOfMonth.getDay();

    if (startingDay === 0) {
        startingDay = 6;
    } else {
        startingDay--;
    }

    calendarContainer.innerHTML = "";

    const calendarHeader = document.createElement("div");
    calendarHeader.classList.add("calendar-header");

    const previousMonthButton = document.createElement("button");
    previousMonthButton.textContent = "←";
    previousMonthButton.classList.add("calendar-navigation-button");

    const monthTitle = document.createElement("h3");

    monthTitle.textContent =
        `${monthNames[month]} ${year}`;

    const nextMonthButton = document.createElement("button");
    nextMonthButton.textContent = "→";
    nextMonthButton.classList.add("calendar-navigation-button");

    calendarHeader.appendChild(previousMonthButton);
    calendarHeader.appendChild(monthTitle);
    calendarHeader.appendChild(nextMonthButton);

    calendarContainer.appendChild(calendarHeader);

    const calendarGrid = document.createElement("div");
    calendarGrid.classList.add("calendar-grid");

    const weekdays = [
        "Lun",
        "Mar",
        "Mer",
        "Gio",
        "Ven",
        "Sab",
        "Dom"
    ];

    for (const weekday of weekdays) {
        const weekdayElement =
            document.createElement("div");

        weekdayElement.textContent = weekday;
        weekdayElement.classList.add("calendar-weekday");

        calendarGrid.appendChild(weekdayElement);
    }

    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement("div");

        emptyDay.classList.add("calendar-day", "empty");

        calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement("div");

        dayElement.textContent = day;
        dayElement.classList.add("calendar-day");

        const monthNumber = String(month + 1).padStart(2, "0");
        const dayNumber = String(day).padStart(2, "0");

        const fullDate =
            `${year}-${monthNumber}-${dayNumber}`;

        const hasDictation = savedDictations.some(
            dictation => dictation.date === fullDate
        );

        if (hasDictation) {
            dayElement.classList.add("has-dictation");

            dayElement.addEventListener("click", function () {
                const dictationsForDay = savedDictations.filter(
                    dictation => dictation.date === fullDate
                );

                calendarModalTitle.textContent =
                    `Dettati del ${dayNumber}/${monthNumber}/${year}`;

                calendarModalDictations.innerHTML = "";

                for (const dictation of dictationsForDay) {
                    const dictationBlock = document.createElement("div");

                    dictationBlock.classList.add("calendar-modal-dictation");

                    const typeNames = {
                        rhythmic: "Ritmico",
                        melodic: "Melodico",
                        harmonic: "Armonico"
                    };

                    dictationBlock.innerHTML = `
                <h4>${dictation.name}</h4>
                <p>Tipo: ${typeNames[dictation.type]}</p>
                <p>
                    Raccolta:
                    ${dictation.collection || "Nessuna"}
                </p>
                <p>
                    Sentito correttamente:
                    ${dictation.correctCategories.length > 0
                            ? dictation.correctCategories.join(", ")
                            : "Nessuna categoria"
                        }
                </p>
                <a
                    href="${dictation.youtubeLink}"
                    target="_blank"
                >
                    Apri video
                </a>
            `;

                    calendarModalDictations.appendChild(dictationBlock);
                }

                calendarModal.hidden = false;
            });
        }

        calendarGrid.appendChild(dayElement);
    }

    calendarContainer.appendChild(calendarGrid);

    previousMonthButton.addEventListener("click", function () {
        displayedMonth--;

        if (displayedMonth < 0) {
            displayedMonth = 11;
            displayedYear--;
        }

        displayCalendar();
    });

    nextMonthButton.addEventListener("click", function () {
        displayedMonth++;

        if (displayedMonth > 11) {
            displayedMonth = 0;
            displayedYear++;
        }

        displayCalendar();
    });
}

showCalendarButton.addEventListener("click", function () {
    calendarSection.hidden = !calendarSection.hidden;

    if (calendarSection.hidden) {
        showCalendarButton.textContent =
            "Vedi calendario";
    } else {
        showCalendarButton.textContent =
            "Nascondi calendario";

        displayCalendar();
    }
});

showStatisticsButton.addEventListener("click", function () {
    statisticsSection.hidden =
        !statisticsSection.hidden;

    if (statisticsSection.hidden) {
        showStatisticsButton.textContent =
            "Vedi statistiche";
    } else {
        showStatisticsButton.textContent =
            "Nascondi statistiche";

        displayStatistics();
    }
});

async function displayStatistics() {
    let savedDictations;

    try {
        savedDictations = await getDictationsFromServer();
    } catch (error) {
        console.error(error);
        alert("Non è stato possibile caricare le statistiche.");
        return;
    }

    savedDictations = savedDictations.map(
        formatDictationFromDatabase
    );

    let rhythmicCount = 0;
    let melodicCount = 0;
    let harmonicCount = 0;

    const categoryStats = {
        rhythmic: {},
        melodic: {},
        harmonic: {}
    };

    for (const dictation of savedDictations) {
        if (dictation.type === "rhythmic") {
            rhythmicCount++;
        } else if (dictation.type === "melodic") {
            melodicCount++;
        } else if (dictation.type === "harmonic") {
            harmonicCount++;
        }

        const availableCategories =
            dictation.availableCategories || [];

        for (const category of availableCategories) {
            const typeStats = categoryStats[dictation.type];

            if (!typeStats[category]) {
                typeStats[category] = {
                    total: 0,
                    correct: 0
                };
            }

            typeStats[category].total++;

            if (dictation.correctCategories.includes(category)) {
                typeStats[category].correct++;
            }
        }
    }

    statisticsContainer.innerHTML = `
        <p>Dettati totali: ${savedDictations.length}</p>
        <p>Ritmici: ${rhythmicCount}</p>
        <p>Melodici: ${melodicCount}</p>
        <p>Armonici: ${harmonicCount}</p>
    `;

    const categoryTitle = document.createElement("h3");

    categoryTitle.textContent =
        "Statistiche per categoria";

    statisticsContainer.appendChild(categoryTitle);

    const typeNames = {
        rhythmic: "Ritmico",
        melodic: "Melodico",
        harmonic: "Armonico"
    };

    for (const type in categoryStats) {
        const typeTitle = document.createElement("h4");

        typeTitle.textContent = typeNames[type];

        statisticsContainer.appendChild(typeTitle);

        const typeStats = categoryStats[type];

        for (const category in typeStats) {
            const total = typeStats[category].total;
            const correct = typeStats[category].correct;

            const percentage = Math.round(
                (correct / total) * 100
            );

            const categoryStat = document.createElement("div");
            categoryStat.classList.add("category-stat");

            const paragraph = document.createElement("p");

            const correctLabel =
                correct === 1
                    ? "sentito correttamente"
                    : "sentiti correttamente";

            paragraph.textContent =
                `${category}: ${correct}/${total} ${correctLabel} (${percentage}%)`;

            const barContainer = document.createElement("div");
            barContainer.classList.add("statistics-bar");

            const barFill = document.createElement("div");
            barFill.classList.add("statistics-bar-fill");
            barFill.style.width = `${percentage}%`;

            if (percentage > 0) {
                barFill.textContent = `${percentage}%`;
            } else {
                barFill.textContent = "";
            }

            barContainer.appendChild(barFill);

            categoryStat.appendChild(paragraph);
            categoryStat.appendChild(barContainer);

            statisticsContainer.appendChild(categoryStat);
        }
    }
}