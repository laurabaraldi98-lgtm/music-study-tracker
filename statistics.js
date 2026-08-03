const showStatisticsButton = document.getElementById(
    "show-statistics-button"
);

const statisticsSection = document.getElementById(
    "statistics-section"
);

const statisticsContainer = document.getElementById(
    "statistics-container"
);

const statisticsCollectionFilter =
    document.getElementById("statistics-collection-filter");

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

    const selectedCollection =
        statisticsCollectionFilter.value;

    if (selectedCollection !== "") {
        savedDictations = savedDictations.filter(
            function (dictation) {
                return dictation.collection === selectedCollection;
            }
        );
    }

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

statisticsCollectionFilter.addEventListener(
    "change",
    displayStatistics
);