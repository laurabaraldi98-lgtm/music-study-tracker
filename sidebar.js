const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");

function openSidebar() {
    sidebar.classList.add("open");
    sidebarBackdrop.hidden = false;
}

function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.hidden = true;
}

sidebarToggle.addEventListener("click", function () {
    if (sidebar.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});

sidebarBackdrop.addEventListener("click", closeSidebar);

/* istanbul ignore next */
if (typeof module !== "undefined") {
    module.exports = {
        openSidebar,
        closeSidebar
    };
}