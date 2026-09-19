function displayPracticeReportTypes(types) {
    const practiceReportTypes = document.getElementById(
        "practice-report-types"
    );

    practiceReportTypes.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Dettaglio per tipo";
    practiceReportTypes.appendChild(title);

    if (types.length === 0) {
        const noData = document.createElement("p");
        noData.textContent = "Nessun dato";
        practiceReportTypes.appendChild(noData);
        return;
    }

    for (const type of types) {
        const row = document.createElement("div");
        row.className = "practice-report-type-row";

        const header = document.createElement("div");
        header.className = "practice-report-type-header";

        const name = document.createElement("span");
        name.textContent = type.name;

        const value = document.createElement("span");
        value.textContent =
            type.accuracy == null
                ? "Nessun dato"
                : `${type.accuracy}%`;

        header.appendChild(name);
        header.appendChild(value);

        const bar = document.createElement("div");
        bar.className = "practice-report-type-bar";

        const fill = document.createElement("div");
        fill.className = "practice-report-type-bar-fill";

        fill.style.width =
            type.accuracy == null
                ? "0%"
                : `${type.accuracy}%`;

        const popup = document.createElement("div");
        popup.className = "practice-report-type-popup";
        popup.hidden = true;

        const popupTitle = document.createElement("strong");
        popupTitle.textContent = type.name;

        popup.appendChild(popupTitle);
        popup.appendChild(document.createElement("br"));

        popup.append(
            `Accuratezza: ${type.accuracy == null
                ? "Nessun dato"
                : `${type.accuracy}%`
            }`
        );

        popup.appendChild(document.createElement("br"));
        popup.append(`Dettati: ${type.totalDictations}`);

        popup.appendChild(document.createElement("br"));
        popup.append(
            `Categorie valutate: ${type.evaluatedCategories}`
        );

        popup.appendChild(document.createElement("br"));
        popup.append(
            `Categorie corrette: ${type.correctCategories}`
        );

        fill.addEventListener(
            "mouseenter",
            function () {
                popup.hidden = false;
            }
        );

        fill.addEventListener(
            "mouseleave",
            function () {
                if (!fill.classList.contains("pinned")) {
                    popup.hidden = true;
                }
            }
        );

        fill.addEventListener(
            "click",
            function () {
                const isPinned =
                    fill.classList.contains("pinned");

                document
                    .querySelectorAll(
                        ".practice-report-type-bar-fill.pinned"
                    )
                    .forEach(element => {
                        element.classList.remove("pinned");
                    });

                document
                    .querySelectorAll(
                        ".practice-report-type-popup"
                    )
                    .forEach(element => {
                        element.hidden = true;
                    });

                if (isPinned) {
                    return;
                }

                fill.classList.add("pinned");
                popup.hidden = false;
            }
        );

        bar.appendChild(fill);

        row.appendChild(header);
        row.appendChild(bar);
        row.appendChild(popup);

        practiceReportTypes.appendChild(row);
    }
}

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        displayPracticeReportTypes
    };
}