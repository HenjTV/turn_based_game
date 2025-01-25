import {
    handleFindLobby,
    handleMoveButtonClick,
    handleServerMessage,
    disconnectClient
} from "./gameLogic.js";
export function initializeSelectors() {
    return {
        loginDiv: document.getElementById("login"),
        gameDiv: document.getElementById("game"),
        nameInput: document.getElementById("name"),
        findLobbyButton: document.getElementById("findLobby"),
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
    gameClient.ws.onmessage = (event) => handleServerMessage(event, gameClient);
}
