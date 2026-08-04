window.addEventListener("load", async function () {
    await Clerk.load({
        ui: {
            ClerkUI: window.__internal_ClerkUICtor
        }
    });

    const authContainer = document.getElementById("auth-container");

    if (Clerk.user) {
        const token = await Clerk.session.getToken();

        const response = await fetch("http://localhost:3000/auth-test", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const authResult = await response.json();

        console.log("Risultato backend:", authResult);
    }

    if (Clerk.user) {
        Clerk.mountUserButton(authContainer);
    } else {
        Clerk.mountSignIn(authContainer);
    }
});