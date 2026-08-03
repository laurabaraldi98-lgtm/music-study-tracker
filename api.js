async function getDictationsFromServer() {
    const response = await fetch(
        "http://localhost:3000/dictations"
    );

    if (!response.ok) {
        throw new Error("Errore durante il recupero dei dettati");
    }

    return response.json();
}

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
        throw new Error(
            "Errore durante il salvataggio della categoria"
        );
    }

    return response.json();
}

async function deleteCategoryFromServer(categoryId) {
    const response = await fetch(
        `http://localhost:3000/categories/${categoryId}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        throw new Error(
            "Errore durante la cancellazione della categoria"
        );
    }

    return response.json();
}

async function getCollectionsFromServer() {
    const response = await fetch(
        "http://localhost:3000/collections"
    );

    if (!response.ok) {
        throw new Error(
            "Errore durante il recupero delle raccolte"
        );
    }

    return response.json();
}

async function saveCollectionToServer(collection) {
    const response = await fetch(
        "http://localhost:3000/collections",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(collection)
        }
    );

    if (!response.ok) {
        throw new Error(
            "Errore durante il salvataggio della raccolta"
        );
    }

    return response.json();
}

async function deleteCollectionFromServer(collectionId) {
    const response = await fetch(
        `http://localhost:3000/collections/${collectionId}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        throw new Error(
            "Errore durante la cancellazione della raccolta"
        );
    }

    return response.json();
}