import { GameClient } from "./index";
import { GameState } from "../types";

export function initializeState(overrides: Partial<GameState> = {}): GameState {
    return {
        playerName: "",
        lobbyId: "",
        currentTurn: "",
        isMyTurn: false,
        selectedCharacter: null,
        statsConfig: null,
        currentResource: 100,
        maxResource: 100,
        resourceType: "Rage",
        breakroundleftheal: 0,
        breakroundleftdefence: 0,
        hp: 100,
        maxHp: 100,
        powerBar: 1,
        ...overrides,
    };
}

export async function loadCharacterOptions(gameClient: GameClient): Promise<void> {
    try {
        const response = await fetch("/api/characters");

        if (!response.ok) {
            throw new Error(`Failed to load character options: ${response.statusText}`);
        }

        const data = await response.json();
        const characterSelect = gameClient.selectors.characterSelect;
        characterSelect.innerHTML = "";

        data.characters.forEach((character: string) => {
            const div = document.createElement("div");
            div.className = "character-option";
            div.dataset.character = character;

            const img = document.createElement("img");
            img.src = `/images/characters/${character}`;
            img.alt = character;

            div.appendChild(img);
            div.addEventListener("click", () => selectCharacter(div, gameClient));

            characterSelect.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading character options:", error);
    }
}

function selectCharacter(selectedDiv: HTMLDivElement, gameClient: GameClient): void {
    const options = document.querySelectorAll(".character-option");
    options.forEach((option) => option.classList.remove("selected"));
    selectedDiv.classList.add("selected");

    gameClient.state.selectedCharacter = selectedDiv.dataset.character;
    console.log("Selected character:", gameClient.state.selectedCharacter);
}

export function handleFindLobby(gameClient: GameClient): void {
    // Get credentials from localStorage
    gameClient.state.playerName = gameClient.selectors.usernameInput.value;
    const savedName = gameClient.state.playerName;
    const character = gameClient.state.selectedCharacter;

    if (!savedName || !character) {
        alert("Please select a character first!");
        return;
    }

    gameClient.ws.send(
        JSON.stringify({
            action: "findLobby",
            name: savedName,
            character: character,
        })
    );
}

export function handleCancelMatchmaking(gameClient: GameClient): void {
    // Hide matchmaking UI
    gameClient.viewManager.toggleMatchmakingUI(false);

    gameClient.ws.send(
        JSON.stringify({
            action: "cancelMatchmaking",
            lobbyId: gameClient.state.lobbyId,
        })
    );
}

export function disconnectClient(event: MouseEvent, gameClient: GameClient): void {
    if ((event.target as HTMLElement).tagName !== "BUTTON") return;

    gameClient.ws.send(
        JSON.stringify({
            action: "disconnect",
            lobbyId: gameClient.state.lobbyId,
            playerName: gameClient.state.playerName,
        })
    );
}

export function handleMoveButtonClick(event: MouseEvent, gameClient: GameClient): void {
    if ((event.target as HTMLElement).tagName !== "BUTTON") return;

    const move = (event.target as HTMLElement).dataset.move;
    sendMove(move, gameClient);
    gameClient.viewManager.toggleMoveButtons(false);
}

function sendMove(move: string, gameClient: GameClient): void {
    const currentState = gameClient.state;
    console.log("SEND STATE", currentState);
    gameClient.ws.send(
        JSON.stringify({
            action: "makeMove",
            lobbyId: currentState.lobbyId,
            move: move,
            playerName: currentState.playerName,
            currentResource: currentState.currentResource,
            breakroundleftheal: currentState.breakroundleftheal,
            breakroundleftdefence: currentState.breakroundleftdefence,
            hp: currentState.hp,
            powerBar: currentState.powerBar,
        })
    );
}

export async function loadStatsConfig(gameClient: GameClient): Promise<void> {
    try {
        const response = await fetch("/config/stats.json");
        if (!response.ok) {
            throw new Error(`Failed to load stats config: ${response.statusText}`);
        }

        const statsConfig = await response.json();
        gameClient.state.statsConfig = statsConfig;
        console.log("Stats configuration loaded:", statsConfig);
    } catch (error) {
        console.error("Error loading stats config:", error);
    }
}

export function handleServerMessage(event: MessageEvent, gameClient: GameClient): void {
    const data = JSON.parse(event.data);
    const handler = messageHandlers[data.action] || handleUnknownMessage;
    handler(data, gameClient);
}


const messageHandlers: { [key: string]: (data: any, gameClient: GameClient) => void } = {
    waitingForLobby: (data, gameClient) => {
         // Show matchmaking UI
        gameClient.viewManager.toggleMatchmakingUI(true);
    },

    gameStart: (data, gameClient) => {
        const state = gameClient.state;

        state.lobbyId = data.lobbyId;
        state.currentTurn = data.currentTurn;

        gameClient.selectors.playerCharacter.src = `/images/characters/${data.player.character}`;
        gameClient.selectors.opponentCharacter.src = `/images/characters/${data.opponent.character}`;

        console.log("Game start:", data.player.powerBar, data.opponent.powerBar);
        updatePlayerInfo(data.player, gameClient, "player");
        updatePlayerInfo(data.opponent, gameClient, "opponent");

        gameClient.viewManager.showGameScreen();
        gameClient.viewManager.toggleMoveButtons(true);
    },

    updateGame: (data, gameClient) => {
        updateGameState(data, gameClient);
        console.log("updateGame:", data.player.powerBar, data.opponent.powerBar);
        updatePlayerInfo(data.player, gameClient, "player");
        updatePlayerInfo(data.opponent, gameClient, "opponent");
        gameClient.viewManager.toggleMoveButtons(true);
    },

    gameOver: (data, gameClient) => {
        handleGameOver(data, gameClient);
    },

    disableButtons: (data, gameClient) => {
        gameClient.viewManager.toggleMoveButtons(false);
    },

    enableButtons: (data, gameClient) => {
        gameClient.viewManager.toggleMoveButtons(true);
    },

    matchmakingCancelled: (data, gameClient) => {
        gameClient.viewManager.toggleMatchmakingUI(false);
        alert("Matchmaking cancelled");
    },

    // Add error handling
    matchmakingError: (data, gameClient) => {
         gameClient.viewManager.toggleMatchmakingUI(false);
        alert(`Matchmaking failed: ${data.reason}`);
    }
};

function updateCooldownIndicator(cooldownType: string, cooldownValue: number, gameClient: GameClient): void {
    const cooldownElement = gameClient.selectors[cooldownType];
    if (!cooldownElement) {
        console.warn(`Cooldown element for "${cooldownType}" not found.`);
        return;
    }

    if (cooldownValue > 0) {
        cooldownElement.textContent = `Cooldown: ${cooldownValue}`;
        cooldownElement.style.display = "block";
    } else {
        cooldownElement.textContent = "";
        cooldownElement.style.display = "none";
    }
}


function updatePlayerInfo(playerData: any, gameClient: GameClient, playerType: string): void {
    const viewManager = gameClient.viewManager;

    // Update player/opponent name
    const playerNameElement = gameClient.selectors[`${playerType}Name`];
    if (playerNameElement) {
        playerNameElement.textContent = playerData.name;
    }

    viewManager.updateStat(playerData.hp, "hp", playerType);
    viewManager.updateStat(playerData.currentResource, "resource", playerType);
    viewManager.updateBar(playerData.currentResource);
    gameClient.state.powerBar = playerData.powerBar;
}

function updateGameState(data: any, gameClient: GameClient): void {
    const state = gameClient.state;

    // Update current turn
    state.currentTurn = data.currentTurn;

    // Update player and opponent HP
    state.hp = data.player.hp;
    state.opponentHp = data.opponent.hp;

    // Update resource values for both players
    state.currentResource = data.player.currentResource || state.currentResource;
    state.opponentResource = data.opponent.currentResource || state.opponentResource;

    // Update cooldowns
    state.breakroundleftheal = data.player.breakHeal || state.breakroundleftheal;
;
    state.breakroundleftdefence = data.player.breakDefense || state.breakroundleftdefence;

    // Update power bar values
    state.powerBar = data.player.powerBar || state.powerBar;
    state.opponentPowerBar = data.opponent.powerBar || state.opponentPowerBar;

    // Ensure resources don't exceed max values
    state.currentResource = Math.min(state.currentResource, state.maxResource);
    state.opponentResource = Math.min(state.opponentResource, state.maxResource);

    // Ensure HP doesn't exceed max values
    state.hp = Math.min(state.hp, state.maxHp);
    state.opponentHp = Math.min(state.opponentHp, state.maxHp);
}

function handleGameOver(data: any, gameClient: GameClient): void {
    console.log("Game over:", data);
    const winnerName = data.winner || "Unknown";
    gameClient.viewManager.toggleGameoverUI(true, winnerName);
}

function handleUnknownMessage(data: any): void {
    console.warn("Unknown message type:", data.action, data);
}
