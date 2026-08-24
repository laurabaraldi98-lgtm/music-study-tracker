const showCalendarButton = document.getElementById(
    "show-calendar-button"
);

const calendarSection = document.getElementById(
    "calendar-section"
);

const calendarContainer = document.getElementById(
    "calendar-container"
);

const calendarModal = document.getElementById(
    "calendar-modal"
);

const closeCalendarModalButton = document.getElementById(
    "close-calendar-modal"
);

const calendarModalTitle = document.getElementById(
    "calendar-modal-title"
);

const calendarModalDictations = document.getElementById(
    "calendar-modal-dictations"
);

let elementBeforeModal = null;

function closeCalendarModal() {
    calendarModal.hidden = true;

    if (elementBeforeModal) {
        elementBeforeModal.focus();
        elementBeforeModal = null;
    }
}

closeCalendarModalButton.addEventListener(
    "click",
    closeCalendarModal
);

document.addEventListener("keydown", function (event) {
    if (calendarModal.hidden) {
        return;
    }

    if (event.key === "Escape") {
        closeCalendarModal();
        return;
    }

    if (event.key !== "Tab") {
        return;
    }

    const focusableElements = calendarModal.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement =
        focusableElements[focusableElements.length - 1];

    if (
        event.shiftKey &&
        document.activeElement === firstElement
    ) {
        event.preventDefault();
        lastElement.focus();
    } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
    ) {
        event.preventDefault();
        firstElement.focus();
    }
});

const calendarCollectionFilter =
    document.getElementById("calendar-collection-filter");

let displayedMonth = new Date().getMonth();
let displayedYear = new Date().getFullYear();

async function displayCalendar() {
    const year = displayedYear;
    const month = displayedMonth;

    let savedDictations;

    try {
        savedDictations = await getDictationsFromServer();
    } catch (error) {
        console.error(error);
        alert("Non è stato possibile caricare il calendario.");
        return;
    }

    savedDictations = savedDictations.map(
        formatDictationFromDatabase
    );

    const selectedCollection =
        calendarCollectionFilter.value;

    if (selectedCollection !== "") {
        savedDictations = savedDictations.filter(
            function (dictation) {
                return dictation.collection === selectedCollection;
            }
        );
    }

    const monthNames = [
        "Gennaio",
        "Febbraio",
        "Marzo",
        "Aprile",
        "Maggio",
        "Giugno",
        "Luglio",
        "Agosto",
        "Settembre",
        "Ottobre",
        "Novembre",
        "Dicembre"
    ];

    const firstDayOfMonth = new Date(year, month, 1);

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    let startingDay = firstDayOfMonth.getDay();

    if (startingDay === 0) {
        startingDay = 6;
    } else {
        startingDay--;
    }

    calendarContainer.innerHTML = "";

    const calendarHeader = document.createElement("div");
    calendarHeader.classList.add("calendar-header");

    const previousMonthButton = document.createElement("button");
    previousMonthButton.textContent = "←";
    previousMonthButton.classList.add("calendar-navigation-button");

    const monthTitle = document.createElement("h3");

    monthTitle.textContent =
        `${monthNames[month]} ${year}`;

    const nextMonthButton = document.createElement("button");
    nextMonthButton.textContent = "→";
    nextMonthButton.classList.add("calendar-navigation-button");

    calendarHeader.appendChild(previousMonthButton);
    calendarHeader.appendChild(monthTitle);
    calendarHeader.appendChild(nextMonthButton);

    calendarContainer.appendChild(calendarHeader);

    const calendarGrid = document.createElement("div");
    calendarGrid.classList.add("calendar-grid");

    const weekdays = [
        "Lun",
        "Mar",
        "Mer",
        "Gio",
        "Ven",
        "Sab",
        "Dom"
    ];

    for (const weekday of weekdays) {
        const weekdayElement =
            document.createElement("div");

        weekdayElement.textContent = weekday;
        weekdayElement.classList.add("calendar-weekday");

        calendarGrid.appendChild(weekdayElement);
    }

    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement("div");

        emptyDay.classList.add("calendar-day", "empty");

        calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement("div");

        dayElement.textContent = day;
        dayElement.classList.add("calendar-day");

        const monthNumber = String(month + 1).padStart(2, "0");
        const dayNumber = String(day).padStart(2, "0");

        const fullDate =
            `${year}-${monthNumber}-${dayNumber}`;

        const hasDictation = savedDictations.some(
            dictation => dictation.date === fullDate
        );

        if (hasDictation) {
            dayElement.classList.add("has-dictation");
            dayElement.tabIndex = 0;

            function openDayModal() {
                const dictationsForDay = savedDictations.filter(
                    dictation => dictation.date === fullDate
                );

                calendarModalTitle.textContent =
                    `Dettati del ${dayNumber}/${monthNumber}/${year}`;

                calendarModalDictations.innerHTML = "";

                for (const dictation of dictationsForDay) {
                    const dictationBlock = document.createElement("div");

                    dictationBlock.classList.add("calendar-modal-dictation");

                    const typeNames = {
                        rhythmic: "Ritmico",
                        melodic: "Melodico",
                        harmonic: "Armonico"
                    };

                    const dictationTitle = document.createElement("h4");
                    dictationTitle.textContent = dictation.name;

                    const typeParagraph = document.createElement("p");
                    typeParagraph.textContent =
                        `Tipo: ${typeNames[dictation.type]}`;

                    const collectionParagraph = document.createElement("p");
                    collectionParagraph.textContent =
                        `Raccolta: ${dictation.collection || "Nessuna"}`;

                    const correctCategoriesParagraph =
                        document.createElement("p");

                    correctCategoriesParagraph.textContent =
                        `Sentito correttamente: ${dictation.correctCategories.length > 0
                            ? dictation.correctCategories.join(", ")
                            : "Nessuna categoria"
                        }`;

                    const videoLink = document.createElement("a");
                    videoLink.href = dictation.youtubeLink;
                    videoLink.target = "_blank";
                    videoLink.rel = "noopener noreferrer";
                    videoLink.textContent = "Apri video";

                    dictationBlock.appendChild(dictationTitle);
                    dictationBlock.appendChild(typeParagraph);
                    dictationBlock.appendChild(collectionParagraph);
                    dictationBlock.appendChild(
                        correctCategoriesParagraph
                    );
                    dictationBlock.appendChild(videoLink);

                    calendarModalDictations.appendChild(dictationBlock);
                }

                elementBeforeModal = document.activeElement;

                calendarModal.hidden = false;
                closeCalendarModalButton.focus();
            }

            dayElement.addEventListener("click", openDayModal);

            dayElement.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openDayModal();
                }
            });
        }

        calendarGrid.appendChild(dayElement);
    }

    calendarContainer.appendChild(calendarGrid);

    previousMonthButton.addEventListener("click", function () {
        displayedMonth--;

        if (displayedMonth < 0) {
            displayedMonth = 11;
            displayedYear--;
        }

        displayCalendar();
    });

    nextMonthButton.addEventListener("click", function () {
        displayedMonth++;

        if (displayedMonth > 11) {
            displayedMonth = 0;
            displayedYear++;
        }

        displayCalendar();
    });
}

calendarCollectionFilter.addEventListener(
    "change",
    displayCalendar
);

showCalendarButton.addEventListener("click", function () {
    calendarSection.hidden = !calendarSection.hidden;

    if (calendarSection.hidden) {
        showCalendarButton.textContent =
            "Vedi calendario";
    } else {
        showCalendarButton.textContent =
            "Nascondi calendario";

        displayCalendar();
    }
});