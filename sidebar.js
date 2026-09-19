const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const sidebarButtons = document.querySelectorAll(".sidebar-nav button");
const appViews = document.querySelectorAll(".app-view");

const sectionIds = {
    "new-dictation": "new-dictation-section",
    "saved-dictations": "saved-dictations-section",
    "calendar": "calendar-section",
    "practice-report": "practice-report-section"
};

function openSidebar() {
    sidebar.classList.add("open");
    sidebarBackdrop.hidden = false;
}

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.hidden = true;
}

function showSection(sectionName) {
    appViews.forEach(function (view) {
        view.hidden = true;
    });

    const sectionId = sectionIds[sectionName];
    const selectedSection = document.getElementById(sectionId);

    selectedSection.hidden = false;

    if (sectionName === "saved-dictations") {
        displaySavedDictations();
    }

    if (sectionName === "calendar") {
        displayCalendar();
    }

    if (sectionName === "practice-report") {
        displayPracticeReport();
    }

    closeSidebar();
}

sidebarToggle.addEventListener("click", function () {
    if (sidebar.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});

sidebarBackdrop.addEventListener("click", closeSidebar);

sidebarButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        showSection(button.dataset.section);
    });
});

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        openSidebar,
        closeSidebar,
        showSection
    };
}