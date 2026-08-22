window.addEventListener("load", async function () {
    await Clerk.load({
        ui: {
            ClerkUI: window.__internal_ClerkUICtor
        },
        appearance: {
            variables: {
                colorPrimary: "#6f86a6",
                colorBackground: "#ffffff",
                colorForeground: "#222222",
                colorInputBackground: "#ffffff",
                colorInputText: "#222222",
                borderRadius: "8px"
            },
            options: {
                unsafe_disableDevelopmentModeWarnings: true
            }
        }
    });

    window.dispatchEvent(new Event("clerk-ready"));

    const signInContainer =
        document.getElementById("sign-in-container");

    const userButtonContainer =
        document.getElementById("user-button-container");

    const appContainer =
        document.getElementById("app-container");

    if (Clerk.user) {
        signInContainer.style.display = "none";
        appContainer.style.display = "block";

        Clerk.mountUserButton(userButtonContainer);
    } else {
        signInContainer.style.display = "flex";
        appContainer.style.display = "none";

        Clerk.mountSignIn(signInContainer);
    }
});