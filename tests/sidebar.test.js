describe("sidebar", () => {
    let sidebar;
    let sidebarToggle;
    let sidebarBackdrop;
    let newDictationSection;
    let savedDictationsSection;
    let calendarSection;
    let practiceReportSection;

    const displaySavedDictationsMock = jest.fn();
    const displayCalendarMock = jest.fn();
    const displayPracticeReportMock = jest.fn();

    beforeEach(() => {
        document.body.innerHTML = `
            <button id="sidebar-toggle" type="button">☰</button>

            <div id="sidebar-backdrop" hidden></div>

            <aside id="sidebar" class="sidebar">
                <nav class="sidebar-nav">
                    <button type="button" data-section="new-dictation">
                        Nuovo dettato
                    </button>

                    <button type="button" data-section="saved-dictations">
                        Dettati salvati
                    </button>

                    <button type="button" data-section="calendar">
                        Calendario
                    </button>

                    <button type="button" data-section="practice-report">
                        Report progressi
                    </button>
                </nav>
            </aside>

            <section id="new-dictation-section" class="app-view"></section>
            <section id="saved-dictations-section" class="app-view" hidden></section>
            <section id="calendar-section" class="app-view" hidden></section>
            <section id="practice-report-section" class="app-view" hidden></section>
        `;

        displaySavedDictationsMock.mockReset();
        displayCalendarMock.mockReset();
        displayPracticeReportMock.mockReset();

        global.displaySavedDictations = displaySavedDictationsMock;
        global.displayCalendar = displayCalendarMock;
        global.displayPracticeReport = displayPracticeReportMock;

        jest.resetModules();

        require("../sidebar.js");

        sidebar = document.getElementById("sidebar");
        sidebarToggle = document.getElementById("sidebar-toggle");
        sidebarBackdrop = document.getElementById("sidebar-backdrop");

        newDictationSection = document.getElementById(
            "new-dictation-section"
        );

        savedDictationsSection = document.getElementById(
            "saved-dictations-section"
        );

        calendarSection = document.getElementById(
            "calendar-section"
        );

        practiceReportSection = document.getElementById(
            "practice-report-section"
        );
    });

    test("opens sidebar when toggle is clicked", () => {
        sidebarToggle.click();

        expect(sidebar.classList.contains("open")).toBe(true);
        expect(sidebarBackdrop.hidden).toBe(false);
    });

    test("closes sidebar when toggle is clicked again", () => {
        sidebarToggle.click();
        sidebarToggle.click();

        expect(sidebar.classList.contains("open")).toBe(false);
        expect(sidebarBackdrop.hidden).toBe(true);
    });

    test("closes sidebar when backdrop is clicked", () => {
        sidebarToggle.click();
        sidebarBackdrop.click();

        expect(sidebar.classList.contains("open")).toBe(false);
        expect(sidebarBackdrop.hidden).toBe(true);
    });

    test("shows new dictation section", () => {
        document.querySelector(
            '[data-section="new-dictation"]'
        ).click();

        expect(newDictationSection.hidden).toBe(false);
        expect(savedDictationsSection.hidden).toBe(true);
        expect(calendarSection.hidden).toBe(true);
        expect(practiceReportSection.hidden).toBe(true);

        expect(displaySavedDictationsMock).not.toHaveBeenCalled();
        expect(displayCalendarMock).not.toHaveBeenCalled();
        expect(displayPracticeReportMock).not.toHaveBeenCalled();
    });

    test("shows saved dictations section and loads dictations", () => {
        document.querySelector(
            '[data-section="saved-dictations"]'
        ).click();

        expect(newDictationSection.hidden).toBe(true);
        expect(savedDictationsSection.hidden).toBe(false);
        expect(calendarSection.hidden).toBe(true);
        expect(practiceReportSection.hidden).toBe(true);

        expect(displaySavedDictationsMock).toHaveBeenCalledTimes(1);
    });

    test("shows calendar section and loads calendar", () => {
        document.querySelector(
            '[data-section="calendar"]'
        ).click();

        expect(newDictationSection.hidden).toBe(true);
        expect(savedDictationsSection.hidden).toBe(true);
        expect(calendarSection.hidden).toBe(false);
        expect(practiceReportSection.hidden).toBe(true);

        expect(displayCalendarMock).toHaveBeenCalledTimes(1);
    });

    test("shows practice report section and loads report", () => {
        document.querySelector(
            '[data-section="practice-report"]'
        ).click();

        expect(newDictationSection.hidden).toBe(true);
        expect(savedDictationsSection.hidden).toBe(true);
        expect(calendarSection.hidden).toBe(true);
        expect(practiceReportSection.hidden).toBe(false);

        expect(displayPracticeReportMock).toHaveBeenCalledTimes(1);
    });

    test("closes sidebar after selecting a section", () => {
        sidebarToggle.click();

        document.querySelector(
            '[data-section="calendar"]'
        ).click();

        expect(sidebar.classList.contains("open")).toBe(false);
        expect(sidebarBackdrop.hidden).toBe(true);
    });
});