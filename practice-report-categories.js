function displayPracticeReportCategories(categories) {
    const practiceReportCategories = document.getElementById(
        "practice-report-categories"
    );

    practiceReportCategories.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "Dettaglio per categoria";
    practiceReportCategories.appendChild(title);

    if (categories.length === 0) {
        const noData = document.createElement("p");
        noData.textContent = "Nessun dato";
        practiceReportCategories.appendChild(noData);
        return;
    }

    for (const category of categories) {
        const row = document.createElement("div");
        row.className = "practice-report-category-row";

        const header = document.createElement("div");
        header.className = "practice-report-category-header";

        const name = document.createElement("span");
        name.textContent = category.name;

        const value = document.createElement("span");

        value.textContent =
            category.hasEnoughData
                ? `${category.accuracy}%`
                : "Dati insufficienti";

        header.appendChild(name);
        header.appendChild(value);

        const bar = document.createElement("div");
        bar.className = "practice-report-category-bar";

        const fill = document.createElement("div");
        fill.className = "practice-report-category-bar-fill";
        fill.style.width =
            category.hasEnoughData
                ? `${category.accuracy}%`
                : "0%";

        const popup = document.createElement("div");
        popup.className = "practice-report-category-popup";
        popup.hidden = true;

        const popupTitle = document.createElement("strong");
        popupTitle.textContent = category.name;

        popup.appendChild(popupTitle);
        popup.appendChild(document.createElement("br"));

        popup.append(
            `Tentativi: ${category.attempts}`
        );

        popup.appendChild(document.createElement("br"));

        popup.append(
            `Corrette: ${category.correct}`
        );

        popup.appendChild(document.createElement("br"));

        popup.append(
            `Accuratezza: ${category.accuracy}%`
        );

        if (!category.hasEnoughData) {
            popup.appendChild(document.createElement("br"));
            popup.append("Dati insufficienti");
        }

        bar.addEventListener(
            "mouseenter",
            function () {
                popup.hidden = false;
            }
        );

        bar.addEventListener(
            "mouseleave",
            function () {
                if (!bar.classList.contains("pinned")) {
                    popup.hidden = true;
                }
            }
        );

        bar.addEventListener(
            "click",
            function () {
                const isPinned =
                    bar.classList.contains("pinned");

                document
                    .querySelectorAll(
                        ".practice-report-category-bar.pinned"
                    )
                    .forEach(element => {
                        element.classList.remove("pinned");
                    });

                document
                    .querySelectorAll(
                        ".practice-report-category-popup"
                    )
                    .forEach(element => {
                        element.hidden = true;
                    });

                if (isPinned) {
                    return;
                }

                bar.classList.add("pinned");
                popup.hidden = false;
            }
        );

        bar.appendChild(fill);

        row.appendChild(header);
        row.appendChild(bar);
        row.appendChild(popup);

        practiceReportCategories.appendChild(row);
    }
}

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        displayPracticeReportCategories
    };
}