const dictationDate = document.getElementById("dictation-date");
const dictationName = document.getElementById("dictation-name");
const youtubeLink = document.getElementById("youtube-link");

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
