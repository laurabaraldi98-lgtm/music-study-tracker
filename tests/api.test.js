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
    deleteCollectionFromServer,
    getDictationTypesFromServer,
    saveDictationTypeToServer,
    deleteDictationTypeFromServer,
    getStatisticsReportFromServer
} = require("../api.js");


const API_BASE_URL =
    "http://localhost:3000";


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

describe("dictation type API requests", () => {
    test("gets dictation types from the server", async () => {
        const types = [
            {
                id: 1,
                name: "Ritmico"
            }
        ];

        fetchMock.mockResolvedValueOnce(
            makeResponse(true, types)
        );

        await expect(
            getDictationTypesFromServer()
        ).resolves.toEqual(types);

        expect(fetchMock).toHaveBeenCalledWith(
            `${API_BASE_URL}/dictation-types`,
            {
                headers: {
                    Authorization:
                        "Bearer test-token"
                }
            }
        );
    });

    test("uses the server error when dictation types cannot be loaded", async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false, {
                error: "Errore specifico"
            })
        );

        await expect(
            getDictationTypesFromServer()
        ).rejects.toThrow("Errore specifico");
    });

    test("uses the fallback error when dictation types cannot be loaded", async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false, {})
        );

        await expect(
            getDictationTypesFromServer()
        ).rejects.toThrow(
            "Errore durante il recupero dei tipi di dettato"
        );
    });

    test("saves a dictation type", async () => {
        const newType = {
            name: "Contrappunto"
        };

        const savedType = {
            id: 4,
            name: "Contrappunto"
        };

        fetchMock.mockResolvedValueOnce(
            makeResponse(true, savedType)
        );

        await expect(
            saveDictationTypeToServer(newType)
        ).resolves.toEqual(savedType);

        expect(fetchMock).toHaveBeenCalledWith(
            `${API_BASE_URL}/dictation-types`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization:
                        "Bearer test-token"
                },
                body: JSON.stringify(newType)
            }
        );
    });

    test("uses the server error when a dictation type cannot be saved", async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false, {
                error: "Errore specifico"
            })
        );

        await expect(
            saveDictationTypeToServer({
                name: "Contrappunto"
            })
        ).rejects.toThrow("Errore specifico");
    });

    test("uses the fallback error when a dictation type cannot be saved", async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false, {})
        );

        await expect(
            saveDictationTypeToServer({
                name: "Contrappunto"
            })
        ).rejects.toThrow(
            "Errore durante il salvataggio del tipo di dettato"
        );
    });

    test("deletes a dictation type", async () => {
        const deletedType = {
            id: 4,
            name: "Contrappunto"
        };

        fetchMock.mockResolvedValueOnce(
            makeResponse(true, deletedType)
        );

        await expect(
            deleteDictationTypeFromServer(4)
        ).resolves.toEqual(deletedType);

        expect(fetchMock).toHaveBeenCalledWith(
            `${API_BASE_URL}/dictation-types/4`,
            {
                method: "DELETE",
                headers: {
                    Authorization:
                        "Bearer test-token"
                }
            }
        );
    });

    test("uses the server error when a dictation type cannot be deleted", async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false, {
                error: "Errore specifico"
            })
        );

        await expect(
            deleteDictationTypeFromServer(4)
        ).rejects.toThrow("Errore specifico");
    });

    test("uses the fallback error when a dictation type cannot be deleted", async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false, {})
        );

        await expect(
            deleteDictationTypeFromServer(4)
        ).rejects.toThrow(
            "Errore durante la cancellazione del tipo di dettato"
        );
    });
});

describe("statistics report API requests", () => {
    test("gets the report using the backend default period", async () => {
        const report = {
            summary: {
                totalDictations: 5,
                accuracy: 75
            }
        };

        fetchMock.mockResolvedValueOnce(
            makeResponse(true, report)
        );

        await expect(
            getStatisticsReportFromServer()
        ).resolves.toEqual(report);

        expect(fetchMock).toHaveBeenCalledWith(
            `${API_BASE_URL}/statistics/report`,
            {
                headers: {
                    Authorization: "Bearer test-token"
                }
            }
        );
    });

    test("adds report filters to the URL", async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(true, {})
        );

        await getStatisticsReportFromServer({
            period: "custom",
            from: "2026-04-15",
            to: "2026-09-10",
            collection: "Esame & prova",
            dictationTypeId: 4
        });

        expect(fetchMock).toHaveBeenCalledWith(
            `${API_BASE_URL}/statistics/report` +
            "?period=custom" +
            "&from=2026-04-15" +
            "&to=2026-09-10" +
            "&collection=Esame+%26+prova" +
            "&dictationTypeId=4",
            {
                headers: {
                    Authorization: "Bearer test-token"
                }
            }
        );
    });

    test("ignores null report filters", async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(true, {})
        );

        await getStatisticsReportFromServer({
            period: "6-months",
            collection: null,
            dictationTypeId: null
        });

        expect(fetchMock).toHaveBeenCalledWith(
            `${API_BASE_URL}/statistics/report?period=6-months`,
            {
                headers: {
                    Authorization: "Bearer test-token"
                }
            }
        );
    });

    test("uses the server error when the report cannot be loaded", async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false, {
                error: "Periodo non valido"
            })
        );

        await expect(
            getStatisticsReportFromServer({
                period: "invalid"
            })
        ).rejects.toThrow("Periodo non valido");
    });

    test("uses the fallback error when the report has no error message", async () => {
        fetchMock.mockResolvedValueOnce(
            makeResponse(false, {})
        );

        await expect(
            getStatisticsReportFromServer()
        ).rejects.toThrow(
            "Errore durante il recupero del report"
        );
    });
});