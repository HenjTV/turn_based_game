import {
    handleFindLobby,
    handleMoveButtonClick,
    handleServerMessage,
    handleCancelMatchmaking,
    disconnectClient
} from "./gameLogic.js";

export function initializeSelectors() {
    return {
        loginDiv: document.getElementById("login"),
        gameDiv: document.getElementById("game"),
        nameInput: document.getElementById("name"),
        findLobbyButton: document.getElementById("start-game"),
        playerHp: document.getElementById("playerHp"),
        opponentHp: document.getElementById("opponentHp"),
        waitingMessage: document.getElementById("waiting-message"),
        moveButtons: document.getElementById("move-buttons"),
        playerName: document.getElementById("playerName"),
        opponentName: document.getElementById("opponentName"),
        characterSelect: document.getElementById("characterSelect"),
        playerCharacter: document.getElementById("playerCharacter"),
        opponentCharacter: document.getElementById("opponentCharacter"),
        disconnectButton: document.getElementById("disconnectButton"),

        loginBtn: document.getElementById("loginBtn"),
        usernameInput: document.getElementById("username"),
        passwordInput: document.getElementById("password"),
        registerBtn: document.getElementById("registerBtn"),

        matchmakingOverlay: document.getElementById("matchmaking-overlay"),
        cancelMatchmakingButton: document.getElementById("cancel-matchmaking"),

        gameoverOverlay: document.getElementById("gameover-overlay"),
        closeGameoverOverlay: document.getElementById("close-gameover"),
        allButtons: document.querySelectorAll("button"),
    };
}

export function setupEventListeners(gameClient) {
    gameClient.selectors.findLobbyButton.addEventListener("click", () =>
        handleFindLobby(gameClient)
    );
    gameClient.selectors.moveButtons.addEventListener("click", (e) =>
        handleMoveButtonClick(e, gameClient)
    );
    gameClient.selectors.disconnectButton.addEventListener("click", (e) =>
        disconnectClient(e, gameClient)
    );
    gameClient.selectors.loginBtn.addEventListener("click", () =>
        handleLogin(gameClient)
    );
    gameClient.selectors.registerBtn.addEventListener("click", () =>
        handleRegister(gameClient)
    );
    gameClient.selectors.cancelMatchmakingButton.addEventListener("click", () =>
        handleCancelMatchmaking(gameClient)
    );
    gameClient.selectors.closeGameoverOverlay.addEventListener("click", () =>
        gameClient.viewManager.showMainApp()
    );
    gameClient.ws.onmessage = (event) => handleServerMessage(event, gameClient);
}

function handleLogin(gameClient) {
    const credentials = {
        username: gameClient.selectors.usernameInput.value,
        password: gameClient.selectors.passwordInput.value
    };
    // Here you would typically make an API call
    console.log("Login attempt:", credentials);
    // For now, just show main app
    gameClient.viewManager.showMainApp();
}

function handleRegister(gameClient) {
    const credentials = {
        username: gameClient.selectors.usernameInput.value,
        password: gameClient.selectors.passwordInput.value
    };
    // Here you would typically make an API call
    console.log("Registration attempt:", credentials);
}
