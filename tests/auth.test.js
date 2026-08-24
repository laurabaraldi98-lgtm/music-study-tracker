document.body.innerHTML = `
    <div id="sign-in-container"></div>
    <div id="user-button-container"></div>
    <div id="app-container"></div>
`;

const signInContainer =
    document.getElementById(
        "sign-in-container"
    );

const userButtonContainer =
    document.getElementById(
        "user-button-container"
    );

const appContainer =
    document.getElementById(
        "app-container"
    );


const loadMock = jest.fn();
const mountUserButtonMock = jest.fn();
const mountSignInMock = jest.fn();
const clerkReadyMock = jest.fn();


window.__internal_ClerkUICtor =
    "test-clerk-ui";


global.Clerk = {
    user: null,
    load: loadMock,
    mountUserButton:
        mountUserButtonMock,
    mountSignIn:
        mountSignInMock
};


window.addEventListener(
    "clerk-ready",
    clerkReadyMock
);


require("../auth.js");


async function waitForAsyncCode() {
    await Promise.resolve();
    await Promise.resolve();
}


async function triggerLoad(user) {
    Clerk.user = user;

    window.dispatchEvent(
        new Event("load")
    );

    await waitForAsyncCode();
}


beforeEach(() => {
    [
        loadMock,
        mountUserButtonMock,
        mountSignInMock,
        clerkReadyMock
    ].forEach(
        mock => mock.mockReset()
    );

    loadMock.mockResolvedValue();

    Clerk.user = null;

    [
        signInContainer,
        appContainer
    ].forEach(element => {
        element.style.display = "";
    });
});


test("loads Clerk with the expected configuration", async () => {
    await triggerLoad(null);

    expect(loadMock)
        .toHaveBeenCalledWith({
            ui: {
                ClerkUI:
                    "test-clerk-ui"
            },
            appearance: {
                variables: {
                    colorPrimary:
                        "#6f86a6",
                    colorBackground:
                        "#ffffff",
                    colorForeground:
                        "#222222",
                    colorInputBackground:
                        "#ffffff",
                    colorInputText:
                        "#222222",
                    borderRadius:
                        "8px"
                },
                options: {
                    unsafe_disableDevelopmentModeWarnings:
                        true
                }
            }
        });

    expect(clerkReadyMock)
        .toHaveBeenCalledTimes(1);
});


test.each([
    {
        description:
            "shows the app when the user is authenticated",
        user: {
            id: "user_test"
        },
        signInDisplay: "none",
        appDisplay: "block",
        mountedFunction:
            mountUserButtonMock,
        mountedContainer:
            userButtonContainer,
        unusedFunction:
            mountSignInMock
    },
    {
        description:
            "shows sign in when the user is not authenticated",
        user: null,
        signInDisplay: "flex",
        appDisplay: "none",
        mountedFunction:
            mountSignInMock,
        mountedContainer:
            signInContainer,
        unusedFunction:
            mountUserButtonMock
    }
])(
    "$description",
    async ({
        user,
        signInDisplay,
        appDisplay,
        mountedFunction,
        mountedContainer,
        unusedFunction
    }) => {
        await triggerLoad(user);

        expect(signInContainer.style.display)
            .toBe(signInDisplay);

        expect(appContainer.style.display)
            .toBe(appDisplay);

        expect(mountedFunction)
            .toHaveBeenCalledWith(
                mountedContainer
            );

        expect(unusedFunction)
            .not.toHaveBeenCalled();

        expect(clerkReadyMock)
            .toHaveBeenCalledTimes(1);
    }
);