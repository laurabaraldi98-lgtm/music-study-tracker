document.body.innerHTML = `
    <button id="show-calendar-button">
        Vedi calendario
    </button>

    <section id="calendar-section" hidden>
        <select id="calendar-collection-filter">
            <option value=""></option>
            <option value="Esame">Esame</option>
            <option value="Lezione">Lezione</option>
        </select>

        <div id="calendar-container"></div>
    </section>

    <div id="calendar-modal" hidden>
        <button id="close-calendar-modal">
            ×
        </button>

        <h3 id="calendar-modal-title"></h3>

        <div id="calendar-modal-dictations"></div>
    </div>
`;

const showCalendarButton =
    document.getElementById(
        "show-calendar-button"
    );

const calendarSection =
    document.getElementById(
        "calendar-section"
    );

const calendarContainer =
    document.getElementById(
        "calendar-container"
    );

const calendarModal =
    document.getElementById(
        "calendar-modal"
    );

const closeCalendarModalButton =
    document.getElementById(
        "close-calendar-modal"
    );

const calendarModalTitle =
    document.getElementById(
        "calendar-modal-title"
    );

const calendarModalDictations =
    document.getElementById(
        "calendar-modal-dictations"
    );

const calendarCollectionFilter =
    document.getElementById(
        "calendar-collection-filter"
    );


const getDictationsFromServerMock =
    jest.fn();

const formatDictationFromDatabaseMock =
    jest.fn(dictation => ({
        id: dictation.id,
        date: dictation.date,
        name: dictation.name,
        youtubeLink: dictation.youtube_link,
        type: dictation.type,
        collection: dictation.collection,
        availableCategories:
            dictation.available_categories || [],
        correctCategories:
            dictation.correct_categories || []
    }));

const alertMock = jest.fn();


global.getDictationsFromServer =
    getDictationsFromServerMock;

global.formatDictationFromDatabase =
    formatDictationFromDatabaseMock;

global.alert = alertMock;


const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => { });


require("../calendar.js");


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


async function waitForAsyncCode() {
    await Promise.resolve();
    await Promise.resolve();
}


function makeDictation(overrides = {}) {
    return {
        id: 1,
        date: "2026-08-24",
        name: "Dettato prova",
        youtube_link:
            "https://youtube.com/watch?v=test",
        type: "rhythmic",
        collection: "Esame",
        available_categories: [
            "Metrica",
            "Pause"
        ],
        correct_categories: [
            "Metrica"
        ],
        ...overrides
    };
}


function getDisplayedYearMonth() {
    const title =
        calendarContainer.querySelector(
            ".calendar-header h3"
        ).textContent;

    const [
        monthName,
        year
    ] = title.split(" ");

    return {
        month: monthNames.indexOf(monthName),
        year: Number(year)
    };
}


function getDateForDay(day) {
    const {
        month,
        year
    } = getDisplayedYearMonth();

    const monthNumber =
        String(month + 1).padStart(2, "0");

    const dayNumber =
        String(day).padStart(2, "0");

    return (
        `${year}-${monthNumber}-${dayNumber}`
    );
}


function getDayElement(day) {
    return Array.from(
        calendarContainer.querySelectorAll(
            ".calendar-day:not(.empty)"
        )
    ).find(
        element =>
            element.textContent === String(day)
    );
}


function getNavigationButtons() {
    return Array.from(
        calendarContainer.querySelectorAll(
            ".calendar-navigation-button"
        )
    );
}


async function showCalendar(
    dictations = []
) {
    getDictationsFromServerMock
        .mockResolvedValueOnce(dictations);

    showCalendarButton.click();

    await waitForAsyncCode();
}


async function rerenderCalendar(
    dictations = []
) {
    getDictationsFromServerMock
        .mockResolvedValueOnce(dictations);

    calendarCollectionFilter.dispatchEvent(
        new Event("change")
    );

    await waitForAsyncCode();
}


async function prepareDictationDay(
    dictations
) {
    await showCalendar([]);

    const date = getDateForDay(10);

    const preparedDictations =
        dictations.map(dictation =>
            makeDictation({
                date,
                ...dictation
            })
        );

    await rerenderCalendar(
        preparedDictations
    );

    return getDayElement(10);
}


async function navigateTo(
    targetYear,
    targetMonth
) {
    await showCalendar([]);

    let current =
        getDisplayedYearMonth();

    let currentIndex =
        current.year * 12 +
        current.month;

    const targetIndex =
        targetYear * 12 +
        targetMonth;

    while (currentIndex !== targetIndex) {
        const [
            previousButton,
            nextButton
        ] = getNavigationButtons();

        if (currentIndex > targetIndex) {
            previousButton.click();
        } else {
            nextButton.click();
        }

        await waitForAsyncCode();

        current =
            getDisplayedYearMonth();

        currentIndex =
            current.year * 12 +
            current.month;
    }
}


beforeEach(() => {
    [
        getDictationsFromServerMock,
        alertMock
    ].forEach(
        mock => mock.mockReset()
    );

    getDictationsFromServerMock
        .mockResolvedValue([]);

    formatDictationFromDatabaseMock
        .mockClear();

    consoleErrorSpy.mockClear();

    calendarModal.hidden = false;

    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true
        })
    );

    calendarModal.hidden = true;

    calendarSection.hidden = true;

    showCalendarButton.textContent =
        "Vedi calendario";

    calendarCollectionFilter.value = "";

    calendarContainer.innerHTML = "";
    calendarModalTitle.textContent = "";
    calendarModalDictations.innerHTML = "";
});


afterAll(() => {
    consoleErrorSpy.mockRestore();
});


test("shows and hides the calendar", async () => {
    expect(calendarSection.hidden)
        .toBe(true);

    showCalendarButton.click();

    await waitForAsyncCode();

    expect(calendarSection.hidden)
        .toBe(false);

    expect(showCalendarButton.textContent)
        .toBe("Nascondi calendario");

    expect(getDictationsFromServerMock)
        .toHaveBeenCalledTimes(1);

    expect(
        calendarContainer.querySelector(
            ".calendar-header"
        )
    ).not.toBeNull();

    showCalendarButton.click();

    await waitForAsyncCode();

    expect(calendarSection.hidden)
        .toBe(true);

    expect(showCalendarButton.textContent)
        .toBe("Vedi calendario");

    expect(getDictationsFromServerMock)
        .toHaveBeenCalledTimes(1);
});


test("shows an error when the calendar cannot be loaded", async () => {
    getDictationsFromServerMock
        .mockRejectedValueOnce(
            new Error("Database error")
        );

    showCalendarButton.click();

    await waitForAsyncCode();

    expect(consoleErrorSpy)
        .toHaveBeenCalled();

    expect(alertMock)
        .toHaveBeenCalledWith(
            "Non è stato possibile caricare il calendario."
        );
});


test("displays weekdays and all days of the month", async () => {
    await showCalendar([]);

    const weekdays = Array.from(
        calendarContainer.querySelectorAll(
            ".calendar-weekday"
        )
    ).map(
        element => element.textContent
    );

    expect(weekdays).toEqual([
        "Lun",
        "Mar",
        "Mer",
        "Gio",
        "Ven",
        "Sab",
        "Dom"
    ]);

    expect(
        calendarContainer.querySelectorAll(
            ".calendar-day:not(.empty)"
        ).length
    ).toBeGreaterThanOrEqual(28);
});


test("marks days that contain dictations", async () => {
    await showCalendar([]);

    const date =
        getDateForDay(10);

    await rerenderCalendar([
        makeDictation({
            date
        })
    ]);

    const day =
        getDayElement(10);

    expect(
        day.classList.contains(
            "has-dictation"
        )
    ).toBe(true);

    expect(day.tabIndex)
        .toBe(0);

    expect(
        getDayElement(11).classList.contains(
            "has-dictation"
        )
    ).toBe(false);
});


test("filters calendar dictations by collection", async () => {
    await showCalendar([]);

    const examDate =
        getDateForDay(10);

    const lessonDate =
        getDateForDay(11);

    calendarCollectionFilter.value =
        "Esame";

    await rerenderCalendar([
        makeDictation({
            id: 1,
            date: examDate,
            name: "Dettato esame",
            collection: "Esame"
        }),
        makeDictation({
            id: 2,
            date: lessonDate,
            name: "Dettato lezione",
            collection: "Lezione"
        })
    ]);

    expect(
        getDayElement(10).classList.contains(
            "has-dictation"
        )
    ).toBe(true);

    expect(
        getDayElement(11).classList.contains(
            "has-dictation"
        )
    ).toBe(false);
});


test("opens the day modal and displays its dictations", async () => {
    const day =
        await prepareDictationDay([
            {
                id: 1,
                name: "Ritmico prova",
                type: "rhythmic",
                collection: "Esame",
                correct_categories: [
                    "Metrica"
                ]
            },
            {
                id: 2,
                name: "Melodico prova",
                type: "melodic",
                collection: null,
                correct_categories: []
            }
        ]);

    day.click();

    expect(calendarModal.hidden)
        .toBe(false);

    expect(calendarModalTitle.textContent)
        .toContain("Dettati del 10/");

    const modalText =
        calendarModalDictations.textContent;

    [
        "Ritmico prova",
        "Melodico prova",
        "Tipo: Ritmico",
        "Tipo: Melodico",
        "Raccolta: Esame",
        "Raccolta: Nessuna",
        "Sentito correttamente: Metrica",
        "Sentito correttamente: Nessuna categoria"
    ].forEach(text => {
        expect(modalText)
            .toContain(text);
    });

    const links = Array.from(
        calendarModalDictations
            .querySelectorAll("a")
    );

    links.forEach(link => {
        expect(link.textContent)
            .toBe("Apri video");

        expect(link.target)
            .toBe("_blank");

        expect(link.rel)
            .toBe("noopener noreferrer");
    });

    expect(document.activeElement)
        .toBe(closeCalendarModalButton);
});


test("returns focus to the day when the modal closes", async () => {
    const day =
        await prepareDictationDay([
            {}
        ]);

    day.focus();
    day.click();

    expect(document.activeElement)
        .toBe(closeCalendarModalButton);

    closeCalendarModalButton.click();

    expect(calendarModal.hidden)
        .toBe(true);

    expect(document.activeElement)
        .toBe(day);
});


test.each([
    "Enter",
    " "
])(
    "opens the day modal with the %p key",
    async key => {
        const day =
            await prepareDictationDay([
                {}
            ]);

        day.focus();

        const event =
            new KeyboardEvent("keydown", {
                key,
                bubbles: true,
                cancelable: true
            });

        day.dispatchEvent(event);

        expect(event.defaultPrevented)
            .toBe(true);

        expect(calendarModal.hidden)
            .toBe(false);

        expect(document.activeElement)
            .toBe(
                closeCalendarModalButton
            );

        closeCalendarModalButton.click();
    }
);


test("ignores unrelated keys on a calendar day", async () => {
    const day =
        await prepareDictationDay([
            {}
        ]);

    day.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "A",
            bubbles: true,
            cancelable: true
        })
    );

    expect(calendarModal.hidden)
        .toBe(true);
});


test("closes the modal with Escape and restores focus", async () => {
    const day =
        await prepareDictationDay([
            {}
        ]);

    day.focus();
    day.click();

    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true
        })
    );

    expect(calendarModal.hidden)
        .toBe(true);

    expect(document.activeElement)
        .toBe(day);
});


test("ignores document keys when the modal is closed", () => {
    calendarModal.hidden = true;

    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "Tab",
            bubbles: true,
            cancelable: true
        })
    );

    expect(calendarModal.hidden)
        .toBe(true);
});


test("ignores unrelated document keys while the modal is open", async () => {
    const day =
        await prepareDictationDay([
            {}
        ]);

    day.click();

    document.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "ArrowRight",
            bubbles: true
        })
    );

    expect(calendarModal.hidden)
        .toBe(false);

    closeCalendarModalButton.click();
});


test("traps keyboard focus inside the modal", async () => {
    const day =
        await prepareDictationDay([
            {}
        ]);

    day.click();

    const videoLink =
        calendarModalDictations.querySelector(
            "a"
        );

    closeCalendarModalButton.focus();

    const shiftTabEvent =
        new KeyboardEvent("keydown", {
            key: "Tab",
            shiftKey: true,
            bubbles: true,
            cancelable: true
        });

    document.dispatchEvent(
        shiftTabEvent
    );

    expect(shiftTabEvent.defaultPrevented)
        .toBe(true);

    expect(document.activeElement)
        .toBe(videoLink);

    const tabEvent =
        new KeyboardEvent("keydown", {
            key: "Tab",
            bubbles: true,
            cancelable: true
        });

    document.dispatchEvent(
        tabEvent
    );

    expect(tabEvent.defaultPrevented)
        .toBe(true);

    expect(document.activeElement)
        .toBe(closeCalendarModalButton);

    closeCalendarModalButton.click();
});


test("does not trap Tab when focus is not at either edge", async () => {
    const day =
        await prepareDictationDay([
            {
                id: 1,
                name: "Primo"
            },
            {
                id: 2,
                name: "Secondo"
            }
        ]);

    day.click();

    const links = Array.from(
        calendarModalDictations
            .querySelectorAll("a")
    );

    links[0].focus();

    const event =
        new KeyboardEvent("keydown", {
            key: "Tab",
            bubbles: true,
            cancelable: true
        });

    document.dispatchEvent(event);

    expect(event.defaultPrevented)
        .toBe(false);

    closeCalendarModalButton.click();
});


test("handles a month whose first day is Sunday", async () => {
    await navigateTo(
        2026,
        10
    );

    expect(
        calendarContainer.querySelectorAll(
            ".calendar-day.empty"
        )
    ).toHaveLength(6);

    expect(
        calendarContainer.querySelector(
            ".calendar-header h3"
        ).textContent
    ).toBe("Novembre 2026");
});


test.each([
    {
        startYear: 2026,
        startMonth: 0,
        direction: "previous",
        expectedYear: 2025,
        expectedMonth: 11
    },
    {
        startYear: 2026,
        startMonth: 1,
        direction: "previous",
        expectedYear: 2026,
        expectedMonth: 0
    },
    {
        startYear: 2026,
        startMonth: 11,
        direction: "next",
        expectedYear: 2027,
        expectedMonth: 0
    },
    {
        startYear: 2026,
        startMonth: 10,
        direction: "next",
        expectedYear: 2026,
        expectedMonth: 11
    }
])(
    "navigates $direction from $startMonth/$startYear",
    async ({
        startYear,
        startMonth,
        direction,
        expectedYear,
        expectedMonth
    }) => {
        await navigateTo(
            startYear,
            startMonth
        );

        const [
            previousButton,
            nextButton
        ] = getNavigationButtons();

        if (direction === "previous") {
            previousButton.click();
        } else {
            nextButton.click();
        }

        await waitForAsyncCode();

        expect(
            getDisplayedYearMonth()
        ).toEqual({
            year: expectedYear,
            month: expectedMonth
        });
    }
);