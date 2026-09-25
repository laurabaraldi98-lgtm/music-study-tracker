const dictationDate = document.getElementById("dictation-date");
const dictationName = document.getElementById("dictation-name");
const youtubeLink = document.getElementById("youtube-link");
const saveButton = document.getElementById("save-button");
const savedDictationsContainer = document.getElementById("saved-dictations-container");
const savedDictationsSection = document.getElementById("saved-dictations-section");

saveButton.addEventListener("click", async function () {
    if (dictationDate.value === "" || dictationName.value.trim() === "" || youtubeLink.value.trim() === "" || dictationTypeSelect.value === "") {
        alert("Compila tutti i campi prima di salvare.");
        return;
    }

    const checkedBoxes = categoriesContainer.querySelectorAll('input[type="checkbox"]:checked');
    const correctCategories = [];

    for (const checkbox of checkedBoxes) {
        correctCategories.push(checkbox.value);
    }

    const typedName = dictationName.value.trim();
    const formattedName = typedName.charAt(0).toUpperCase() + typedName.slice(1);
    const selectedTypeId = dictationTypeSelect.value;
    const selectedCategories = categories[selectedTypeId] || [];

    const dictation = {
        date: dictationDate.value,
        name: formattedName,
        youtubeLink: youtubeLink.value,
        dictationTypeId: Number(selectedTypeId),
        collection: dictationCollection.value,
        availableCategories: selectedCategories.map(function (category) {
            return category.name;
        }),
        correctCategories: correctCategories
    };

    try {
        await saveDictationToServer(dictation);
        window.dispatchEvent(new Event("dictations-changed"));
    } catch (error) {
        console.error(error);
        alert(error.message);
        return;
    }

    dictationDate.value = "";
    dictationName.value = "";
    youtubeLink.value = "";
    dictationCollection.value = "";
    dictationTypeSelect.value = "";
    dictationTypeSelect.dispatchEvent(new Event("change"));
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

    savedDictations = savedDictations.map(formatDictationFromDatabase);

    const selectedCollection = savedCollectionFilter.value;

    if (selectedCollection !== "") {
        savedDictations = savedDictations.filter(function (dictation) {
            return dictation.collection === selectedCollection;
        });
    }

    if (savedDictations.length === 0) {
        savedDictationsContainer.textContent = "Non ci sono ancora dettati salvati.";
        return;
    }

    savedDictations.sort(function (firstDictation, secondDictation) {
        return new Date(secondDictation.date) - new Date(firstDictation.date);
    });

    savedDictationsContainer.innerHTML = "";

    savedDictations.forEach(function (dictation) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = `${dictation.date} - ${dictation.name}`;

        const typeParagraph = document.createElement("p");
        typeParagraph.textContent = `Tipo: ${dictation.dictationTypeName}`;

        const collectionParagraph = document.createElement("p");
        collectionParagraph.textContent = dictation.collection ? `Raccolta: ${dictation.collection}` : "Raccolta: Nessuna";

        const categoriesParagraph = document.createElement("p");
        categoriesParagraph.textContent = "Categorie corrette: " + dictation.correctCategories.join(", ");

        const linkParagraph = document.createElement("p");
        const link = document.createElement("a");
        link.href = dictation.youtubeLink;
        link.textContent = "Apri video";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        linkParagraph.textContent = "Link: ";
        linkParagraph.appendChild(link);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Elimina";
        deleteButton.classList.add("delete-button");

        deleteButton.addEventListener("click", async function () {
            const confirmed = confirm("Vuoi davvero eliminare questo dettato?");

            if (!confirmed) {
                return;
            }

            try {
                await deleteDictationFromServer(dictation.id);
                window.dispatchEvent(new Event("dictations-changed"));
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
    });
}

savedCollectionFilter.addEventListener("change", displaySavedDictations);

function formatDictationFromDatabase(dictation) {
    const legacyTypeNames = {
        rhythmic: "Ritmico",
        melodic: "Melodico",
        harmonic: "Armonico"
    };

    const dictationTypeName = dictation.dictation_type_name || legacyTypeNames[dictation.type] || dictation.type;

    return {
        id: dictation.id,
        date: dictation.date,
        name: dictation.name,
        youtubeLink: dictation.youtube_link,
        dictationTypeId: dictation.dictation_type_id,
        dictationTypeName,
        collection: dictation.collection,
        availableCategories: dictation.available_categories || [],
        correctCategories: dictation.correct_categories || []
    };
}

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        displaySavedDictations,
        formatDictationFromDatabase
    };
}