import {
    handleFindLobby,
    handleMoveButtonClick,
    handleServerMessage,
    handleCancelMatchmaking,
    disconnectClient
} from "./gameLogic";
import { GameClient } from "./index";
import { Selectors } from "./../types";


export function initializeSelectors(): Selectors {
    return {
        loginDiv: document.getElementById("login"),
        gameDiv: document.getElementById("game"),
        nameInput: document.getElementById("name") as HTMLInputElement,
        findLobbyButton: document.getElementById("start-game") as HTMLButtonElement,
        playerHp: document.getElementById("playerHp"),
        opponentHp: document.getElementById("opponentHp"),
        playerResource: document.getElementById("playerResource"),
        opponentResource: document.getElementById("opponentResource"),
        waitingMessage: document.getElementById("waiting-message"),
        moveButtons: document.getElementById("move-buttons"),
         playerName: document.getElementById("playerName"),
        opponentName: document.getElementById("opponentName"),
        characterSelect: document.getElementById("characterSelect"),
        playerCharacter: document.getElementById("playerCharacter") as HTMLImageElement,
        opponentCharacter: document.getElementById("opponentCharacter") as HTMLImageElement,
        disconnectButton: document.getElementById("disconnectButton") as HTMLButtonElement,
        loginBtn: document.getElementById("loginBtn") as HTMLButtonElement,
        usernameInput: document.getElementById("username") as HTMLInputElement,
        passwordInput: document.getElementById("password") as HTMLInputElement,
        registerBtn: document.getElementById("registerBtn") as HTMLButtonElement,
        matchmakingOverlay: document.getElementById("matchmaking-overlay"),
        cancelMatchmakingButton: document.getElementById("cancel-matchmaking") as HTMLButtonElement,
        gameoverOverlay: document.getElementById("gameover-overlay"),
        closeGameoverOverlay: document.getElementById("close-gameover") as HTMLButtonElement,
         allButtons: document.querySelectorAll("button") as NodeListOf<HTMLButtonElement>,
    };
}

export function setupEventListeners(gameClient: GameClient): void {
    gameClient.selectors.findLobbyButton?.addEventListener("click", () =>
        handleFindLobby(gameClient)
    );
    gameClient.selectors.moveButtons?.addEventListener("click", (e) =>
        handleMoveButtonClick(e as MouseEvent, gameClient)
    );
    gameClient.selectors.disconnectButton?.addEventListener("click", (e) =>
        disconnectClient(e as MouseEvent, gameClient)
    );
     gameClient.selectors.loginBtn?.addEventListener("click", () =>
        handleLogin(gameClient)
    );
    gameClient.selectors.registerBtn?.addEventListener("click", () =>
        handleRegister(gameClient)
    );
    gameClient.selectors.cancelMatchmakingButton?.addEventListener("click", () =>
        handleCancelMatchmaking(gameClient)
    );
    gameClient.selectors.closeGameoverOverlay?.addEventListener("click", () =>
        gameClient.viewManager.showMainApp()
    );
    gameClient.ws.onmessage = (event) => handleServerMessage(event, gameClient);
}

function handleLogin(gameClient: GameClient): void {
    const credentials = {
        username: gameClient.selectors.usernameInput?.value,
        password: gameClient.selectors.passwordInput?.value
    };
    // Here you would typically make an API call
    console.log("Login attempt:", credentials);
    // For now, just show main app
    gameClient.viewManager.showMainApp();
}

function handleRegister(gameClient: GameClient): void {
     const credentials = {
        username: gameClient.selectors.usernameInput?.value,
        password: gameClient.selectors.passwordInput?.value
    };
    // Here you would typically make an API call
    console.log("Registration attempt:", credentials);
}
