window.addEventListener("load", async function () {
    await Clerk.load({
        ui: {
            ClerkUI: window.__internal_ClerkUICtor
        }
    });

    const authContainer =
        document.getElementById("auth-container");

    const appContainer =
        document.getElementById("app-container");

    if (Clerk.user) {
        authContainer.innerHTML = "";
        appContainer.style.display = "block";

        Clerk.mountUserButton(authContainer);
    } else {
        appContainer.style.display = "none";

        Clerk.mountSignIn(authContainer);
    }
});