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

const collectionsList = document.getElementById(
    "collections-list"
);

const savedCollectionFilter =
    document.getElementById("saved-collection-filter");

let collections = [];

async function loadCollections() {
    try {
        collections =
            await getCollectionsFromServer();

        displayCollections();
    } catch (error) {
        console.error(error);

        alert(
            "Non è stato possibile caricare le raccolte dal database."
        );
    }
}

function displayCollections() {
    dictationCollection.innerHTML = `
        <option value="">
            Nessuna raccolta
        </option>
    `;

    collectionsList.innerHTML = "";

    const collectionFilters = [
        savedCollectionFilter,
        document.getElementById(
            "calendar-collection-filter"
        ),
        document.getElementById(
            "statistics-collection-filter"
        )
    ];

    for (const filter of collectionFilters) {
        filter.innerHTML = `
        <option value="">
            Tutte le raccolte
        </option>
    `;
    }

    for (const collection of collections) {
        const option = document.createElement("option");

        option.value = collection.name;
        option.textContent = collection.name;

        dictationCollection.appendChild(option);

        for (const filter of collectionFilters) {
            const filterOption = document.createElement("option");

            filterOption.value = collection.name;
            filterOption.textContent = collection.name;

            filter.appendChild(filterOption);
        }

        const collectionRow = document.createElement("div");

        const collectionName = document.createElement("span");
        collectionName.textContent = collection.name;

        const removeCollectionButton =
            document.createElement("button");

        removeCollectionButton.textContent = "Rimuovi";
        removeCollectionButton.classList.add(
            "remove-collection-button"
        );

        removeCollectionButton.addEventListener(
            "click",
            async function () {
                const confirmed = confirm(
                    `Vuoi davvero rimuovere la raccolta "${collection.name}"?`
                );

                if (!confirmed) {
                    return;
                }

                try {
                    await deleteCollectionFromServer(collection.id);
                } catch (error) {
                    console.error(error);

                    alert(
                        "Non è stato possibile eliminare la raccolta."
                    );

                    return;
                }

                const collectionIndex =
                    collections.findIndex(
                        function (savedCollection) {
                            return savedCollection.id === collection.id;
                        }
                    );

                collections.splice(collectionIndex, 1);

                displayCollections();
            }
        );

        collectionRow.appendChild(collectionName);
        collectionRow.appendChild(removeCollectionButton);

        collectionsList.appendChild(collectionRow);
    }
}
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

addCollectionButton.addEventListener(
    "click",
    async function () {
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
                collection.name.toLowerCase() ===
                newCollection.toLowerCase()
        );

        if (collectionAlreadyExists) {
            alert("Questa raccolta esiste già.");
            return;
        }

        const collectionToSave = {
            name: newCollection
        };

        let savedCollection;

        try {
            savedCollection =
                await saveCollectionToServer(
                    collectionToSave
                );
        } catch (error) {
            console.error(error);

            alert(
                "Non è stato possibile salvare la raccolta."
            );

            return;
        }

        collections.push(savedCollection);

        displayCollections();

        dictationCollection.value =
            savedCollection.name;

        newCollectionInput.value = "";
    }
);

newCollectionInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addCollectionButton.click();
    }
});

window.addEventListener(
    "clerk-ready",
    function () {
        if (Clerk.user) {
            loadCollections();
        }
    }
);