/* istanbul ignore next */
const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

/* istanbul ignore next */
const API_BASE_URL = isLocal
    ? "http://localhost:3000"
    : "https://music-study-tracker-backend.vercel.app";

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

async function getDictationTypesFromServer() {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/dictation-types`
    );

    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.error ||
            "Errore durante il recupero dei tipi di dettato"
        );
    }

    return response.json();
}

async function saveDictationTypeToServer(dictationType) {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/dictation-types`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dictationType)
        }
    );

    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.error ||
            "Errore durante il salvataggio del tipo di dettato"
        );
    }

    return response.json();
}

async function deleteDictationTypeFromServer(dictationTypeId) {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/dictation-types/${dictationTypeId}`,
        {
            method: "DELETE"
        }
    );

    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.error ||
            "Errore durante la cancellazione del tipo di dettato"
        );
    }

    return response.json();
}

async function getStatisticsReportFromServer(filters = {}) {
    const parameters = new URLSearchParams();
    const allowedParameters = [
        "period",
        "from",
        "to",
        "collection",
        "dictationTypeId"
    ];

    for (const key of allowedParameters) {
        const value = filters[key];

        if (value == null) {
            continue;
        }

        parameters.set(key, String(value));
    }

    const queryString = parameters.toString();
    const url = `${API_BASE_URL}/statistics/report${queryString ? `?${queryString}` : ""}`;

    const response = await authenticatedFetch(url);

    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.error ||
            "Errore durante il recupero del report"
        );
    }

    return response.json();
}

async function getStatisticsReportAiInsight(report) {
    const response = await authenticatedFetch(
        `${API_BASE_URL}/statistics/report/ai`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                period: report.period,
                summary: report.summary,
                insights: report.insights
            })
        }
    );

    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
            errorData.error ||
            "Errore durante la generazione dell'analisi"
        );
    }

    return response.json();
}

// Expose API functions for Jest tests
/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        authenticatedFetch,
        getDictationsFromServer,
        saveDictationToServer,
        deleteDictationFromServer,
        getCategoriesFromServer,
        saveCategoryToServer,
        deleteCategoryFromServer,
        getCollectionsFromServer,
        saveCollectionToServer,
        deleteCollectionFromServer,
        getDictationTypesFromServer,
        saveDictationTypeToServer,
        deleteDictationTypeFromServer,
        getStatisticsReportFromServer,
        getStatisticsReportAiInsight
    };
}