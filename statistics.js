const showStatisticsButton = document.getElementById(
    "show-statistics-button"
);

const statisticsSection = document.getElementById(
    "statistics-section"
);

const statisticsContainer = document.getElementById(
    "statistics-container"
);

const statisticsCollectionFilter = document.getElementById(
    "statistics-collection-filter"
);

function getTypeKey(dictation) {
    if (
        dictation.dictationTypeId !== null &&
        dictation.dictationTypeId !== undefined
    ) {
        return String(dictation.dictationTypeId);
    }

    return (
        dictation.dictationTypeName ||
        dictation.type ||
        "unknown"
    );
}

function getTypeName(dictation) {
    return (
        dictation.dictationTypeName ||
        dictation.type ||
        "Tipo sconosciuto"
    );
}

function createTypeStatistics(savedDictations) {
    const typeStatistics = {};

    for (const dictation of savedDictations) {
        const typeKey = getTypeKey(dictation);
        const typeName = getTypeName(dictation);

        if (!typeStatistics[typeKey]) {
            typeStatistics[typeKey] = {
                name: typeName,
                count: 0,
                categories: {}
            };
        }

        const currentType = typeStatistics[typeKey];
        currentType.count++;

        const availableCategories =
            dictation.availableCategories || [];

        const correctCategories =
            dictation.correctCategories || [];

        for (const category of availableCategories) {
            if (!currentType.categories[category]) {
                currentType.categories[category] = {
                    total: 0,
                    correct: 0
                };
            }

            currentType.categories[category].total++;

            if (correctCategories.includes(category)) {
                currentType.categories[category].correct++;
            }
        }
    }

    return typeStatistics;
}

function createSummary(savedDictations, typeStatistics) {
    const summary = document.createElement("div");
    summary.classList.add("statistics-summary");

    const total = document.createElement("p");
    total.textContent =
        `Dettati totali: ${savedDictations.length}`;

    summary.appendChild(total);

    for (const typeKey in typeStatistics) {
        const type = typeStatistics[typeKey];
        const typeCount = document.createElement("p");

        typeCount.textContent =
            `${type.name}: ${type.count}`;

        summary.appendChild(typeCount);
    }

    statisticsContainer.appendChild(summary);
}

function createCategoryBar(categoryName, categoryData) {
    const percentage = Math.round(
        (
            categoryData.correct /
            categoryData.total
        ) * 100
    );

    const categoryStat = document.createElement("div");
    categoryStat.classList.add("category-stat");

    const paragraph = document.createElement("p");

    const correctLabel =
        categoryData.correct === 1
            ? "sentito correttamente"
            : "sentiti correttamente";

    paragraph.textContent =
        `${categoryName}: ` +
        `${categoryData.correct}/${categoryData.total} ` +
        `${correctLabel} (${percentage}%)`;

    const barContainer = document.createElement("div");
    barContainer.classList.add("statistics-bar");
    barContainer.setAttribute("role", "progressbar");
    barContainer.setAttribute("aria-valuemin", "0");
    barContainer.setAttribute("aria-valuemax", "100");
    barContainer.setAttribute(
        "aria-valuenow",
        String(percentage)
    );

    const barFill = document.createElement("div");
    barFill.classList.add("statistics-bar-fill");
    barFill.style.width = `${percentage}%`;

    if (percentage > 0) {
        barFill.textContent = `${percentage}%`;
    }

    barContainer.appendChild(barFill);
    categoryStat.appendChild(paragraph);
    categoryStat.appendChild(barContainer);

    return categoryStat;
}

function createCategoryStatistics(typeStatistics) {
    const categoryTitle = document.createElement("h3");
    categoryTitle.textContent =
        "Statistiche per categoria";

    statisticsContainer.appendChild(categoryTitle);

    const typeKeys = Object.keys(typeStatistics);

    if (typeKeys.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent =
            "Non ci sono ancora statistiche disponibili.";

        statisticsContainer.appendChild(emptyMessage);
        return;
    }

    for (const typeKey of typeKeys) {
        const type = typeStatistics[typeKey];
        const typeTitle = document.createElement("h4");

        typeTitle.textContent = type.name;
        statisticsContainer.appendChild(typeTitle);

        const categoryNames = Object.keys(
            type.categories
        );

        if (categoryNames.length === 0) {
            const emptyTypeMessage =
                document.createElement("p");

            emptyTypeMessage.classList.add(
                "statistics-empty-message"
            );

            emptyTypeMessage.textContent =
                "Nessuna categoria disponibile.";

            statisticsContainer.appendChild(
                emptyTypeMessage
            );

            continue;
        }

        for (const categoryName of categoryNames) {
            const categoryStat = createCategoryBar(
                categoryName,
                type.categories[categoryName]
            );

            statisticsContainer.appendChild(
                categoryStat
            );
        }
    }
}

async function displayStatistics() {
    let savedDictations;

    try {
        savedDictations =
            await getDictationsFromServer();
    } catch (error) {
        console.error(error);

        alert(
            "Non è stato possibile caricare le statistiche."
        );

        return;
    }

    savedDictations = savedDictations.map(
        formatDictationFromDatabase
    );

    const selectedCollection =
        statisticsCollectionFilter.value;

    if (selectedCollection !== "") {
        savedDictations = savedDictations.filter(
            function (dictation) {
                return (
                    dictation.collection ===
                    selectedCollection
                );
            }
        );
    }

    const typeStatistics =
        createTypeStatistics(savedDictations);

    statisticsContainer.innerHTML = "";

    createSummary(
        savedDictations,
        typeStatistics
    );

    createCategoryStatistics(
        typeStatistics
    );
}

showStatisticsButton.addEventListener(
    "click",
    function () {
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
    }
);

statisticsCollectionFilter.addEventListener(
    "change",
    displayStatistics
);

window.addEventListener(
    "dictations-changed",
    function () {
        if (!statisticsSection.hidden) {
            displayStatistics();
        }
    }
);