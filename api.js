const API_BASE_URL = "http://localhost:3000";

async function authenticatedFetch(url, options = {}) {
    const token = await Clerk.session.getToken();

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });
}

async function getDictationsFromServer() {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/dictations`
    );

    if (!response.ok) {
        throw new Error(
            "Errore durante il recupero dei dettati"
        );
    }

    return response.json();
}

async function saveDictationToServer(dictation) {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/dictations`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dictation)
        }
    );

    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.error ||
            "Errore durante il salvataggio"
        );
    }

    return response.json();
}

async function deleteDictationFromServer(id) {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/dictations/${id}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        throw new Error(
            "Errore durante l'eliminazione"
        );
    }

    return response.json();
}

async function getCategoriesFromServer() {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/categories`
    );

    if (!response.ok) {
        throw new Error(
            "Errore durante il recupero delle categorie"
        );
    }

    return response.json();
}

async function saveCategoryToServer(category) {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/categories`,
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
    const response = await authenticatedFetch(
        `${API_BASE_URL}/categories/${categoryId}`,
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
    const response = await authenticatedFetch(
        `${API_BASE_URL}/collections`
    );

    if (!response.ok) {
        throw new Error(
            "Errore durante il recupero delle raccolte"
        );
    }

    return response.json();
}

async function saveCollectionToServer(collection) {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/collections`,
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
    const response = await authenticatedFetch(
        `${API_BASE_URL}/collections/${collectionId}`,
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