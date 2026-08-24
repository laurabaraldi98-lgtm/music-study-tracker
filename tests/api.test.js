const fetchMock = jest.fn();
const getTokenMock = jest.fn();

global.fetch = fetchMock;

global.Clerk = {
    session: {
        getToken: getTokenMock
    }
};


const {
    authenticatedFetch,
    getDictationsFromServer,
    saveDictationToServer,
    deleteDictationFromServer,
    getCategoriesFromServer,
    saveCategoryToServer,
    deleteCategoryFromServer,
    getCollectionsFromServer,
    saveCollectionToServer,
    deleteCollectionFromServer
} = require("../api.js");


const API_BASE_URL =
    "https://music-study-tracker-backend.vercel.app";


function makeResponse(
    ok = true,
    data = {}
) {
    return {
        ok,
        json: jest.fn().mockResolvedValue(data)
    };
}


beforeEach(() => {
    [
        fetchMock,
        getTokenMock
    ].forEach(
        mock => mock.mockReset()
    );

    getTokenMock.mockResolvedValue(
        "test-token"
    );
});


test("adds the authentication token to requests", async () => {
    fetchMock.mockResolvedValueOnce(
        makeResponse()
    );

    await authenticatedFetch(
        "https://example.com"
    );

    expect(getTokenMock)
        .toHaveBeenCalledTimes(1);

    expect(fetchMock)
        .toHaveBeenCalledWith(
            "https://example.com",
            {
                headers: {
                    Authorization:
                        "Bearer test-token"
                }
            }
        );
});


test("preserves request options and headers", async () => {
    fetchMock.mockResolvedValueOnce(
        makeResponse()
    );

    await authenticatedFetch(
        "https://example.com",
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
                "X-Test": "value",
                Authorization:
                    "old-token"
            },
            body: "test"
        }
    );

    expect(fetchMock)
        .toHaveBeenCalledWith(
            "https://example.com",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    "X-Test": "value",
                    Authorization:
                        "Bearer test-token"
                },
                body: "test"
            }
        );
});


test.each([
    [
        "dictations",
        getDictationsFromServer,
        "/dictations"
    ],
    [
        "categories",
        getCategoriesFromServer,
        "/categories"
    ],
    [
        "collections",
        getCollectionsFromServer,
        "/collections"
    ]
])(
    "gets %s from the server",
    async (
        _resource,
        request,
        path
    ) => {
        const data = [
            {
                id: 1
            }
        ];

        fetchMock.mockResolvedValueOnce(
            makeResponse(
                true,
                data
            )
        );

        await expect(
            request()
        ).resolves.toEqual(data);

        expect(fetchMock)
            .toHaveBeenCalledWith(
                `${API_BASE_URL}${path}`,
                {
                    headers: {
                        Authorization:
                            "Bearer test-token"
                    }
                }
            );
    }
);


test.each([
    [
        "dictations",
        getDictationsFromServer,
        "Errore durante il recupero dei dettati"
    ],
    [
        "categories",
        getCategoriesFromServer,
        "Errore durante il recupero delle categorie"
    ],
    [
        "collections",
        getCollectionsFromServer,
        "Errore durante il recupero delle raccolte"
    ]
])(
    "throws when %s cannot be loaded",
    async (
        _resource,
        request,
        errorMessage
    ) => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false)
        );

        await expect(
            request()
        ).rejects.toThrow(
            errorMessage
        );
    }
);


test("saves a dictation", async () => {
    const dictation = {
        date: "2026-08-24",
        name: "Dettato prova",
        youtubeLink:
            "https://youtube.com/test",
        type: "rhythmic",
        collection: "Esame",
        availableCategories: [
            "Metrica"
        ],
        correctCategories: [
            "Metrica"
        ]
    };

    const savedDictation = {
        id: 1,
        ...dictation
    };

    fetchMock.mockResolvedValueOnce(
        makeResponse(
            true,
            savedDictation
        )
    );

    await expect(
        saveDictationToServer(
            dictation
        )
    ).resolves.toEqual(
        savedDictation
    );

    expect(fetchMock)
        .toHaveBeenCalledWith(
            `${API_BASE_URL}/dictations`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization:
                        "Bearer test-token"
                },
                body:
                    JSON.stringify(
                        dictation
                    )
            }
        );
});


test("uses the server error when saving a dictation fails", async () => {
    fetchMock.mockResolvedValueOnce(
        makeResponse(
            false,
            {
                error:
                    "Errore specifico"
            }
        )
    );

    await expect(
        saveDictationToServer({})
    ).rejects.toThrow(
        "Errore specifico"
    );
});


test("uses the fallback error when the server provides no error message", async () => {
    fetchMock.mockResolvedValueOnce(
        makeResponse(
            false,
            {}
        )
    );

    await expect(
        saveDictationToServer({})
    ).rejects.toThrow(
        "Errore durante il salvataggio"
    );
});


test.each([
    [
        "category",
        saveCategoryToServer,
        "/categories",
        {
            type: "rhythmic",
            name: "Accenti"
        }
    ],
    [
        "collection",
        saveCollectionToServer,
        "/collections",
        {
            name: "Esame"
        }
    ]
])(
    "saves a %s",
    async (
        _resource,
        request,
        path,
        data
    ) => {
        const savedData = {
            id: 1,
            ...data
        };

        fetchMock.mockResolvedValueOnce(
            makeResponse(
                true,
                savedData
            )
        );

        await expect(
            request(data)
        ).resolves.toEqual(
            savedData
        );

        expect(fetchMock)
            .toHaveBeenCalledWith(
                `${API_BASE_URL}${path}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            "Bearer test-token"
                    },
                    body:
                        JSON.stringify(
                            data
                        )
                }
            );
    }
);


test.each([
    [
        "category",
        saveCategoryToServer,
        {
            type: "rhythmic",
            name: "Accenti"
        },
        "Errore durante il salvataggio della categoria"
    ],
    [
        "collection",
        saveCollectionToServer,
        {
            name: "Esame"
        },
        "Errore durante il salvataggio della raccolta"
    ]
])(
    "throws when a %s cannot be saved",
    async (
        _resource,
        request,
        data,
        errorMessage
    ) => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false)
        );

        await expect(
            request(data)
        ).rejects.toThrow(
            errorMessage
        );
    }
);


test.each([
    [
        "dictation",
        deleteDictationFromServer,
        "/dictations/10"
    ],
    [
        "category",
        deleteCategoryFromServer,
        "/categories/10"
    ],
    [
        "collection",
        deleteCollectionFromServer,
        "/collections/10"
    ]
])(
    "deletes a %s",
    async (
        _resource,
        request,
        path
    ) => {
        const deletedData = {
            id: 10
        };

        fetchMock.mockResolvedValueOnce(
            makeResponse(
                true,
                deletedData
            )
        );

        await expect(
            request(10)
        ).resolves.toEqual(
            deletedData
        );

        expect(fetchMock)
            .toHaveBeenCalledWith(
                `${API_BASE_URL}${path}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization:
                            "Bearer test-token"
                    }
                }
            );
    }
);


test.each([
    [
        "dictation",
        deleteDictationFromServer,
        "Errore durante l'eliminazione"
    ],
    [
        "category",
        deleteCategoryFromServer,
        "Errore durante la cancellazione della categoria"
    ],
    [
        "collection",
        deleteCollectionFromServer,
        "Errore durante la cancellazione della raccolta"
    ]
])(
    "throws when a %s cannot be deleted",
    async (
        _resource,
        request,
        errorMessage
    ) => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false)
        );

        await expect(
            request(10)
        ).rejects.toThrow(
            errorMessage
        );
    }
);