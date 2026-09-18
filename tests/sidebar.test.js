describe("sidebar", () => {
    let sidebar;
    let sidebarToggle;
    let sidebarBackdrop;

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

                <div class="sidebar-user">
                    <div id="user-button-container"></div>
                </div>
            </aside>
        `;

        jest.resetModules();

        require("../sidebar.js");

        sidebar = document.getElementById("sidebar");
        sidebarToggle = document.getElementById("sidebar-toggle");
        sidebarBackdrop = document.getElementById("sidebar-backdrop");
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
});