export function initializeState(overrides = {}) {
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
        powerBar: 0,
        ...overrides, // Allow overriding specific properties if needed
    };
}

export async function loadCharacterOptions(gameClient) {
    try {
        const response = await fetch("/api/characters");

        if (!response.ok) {
            throw new Error(`Failed to load character options: ${response.statusText}`);
        }

        const data = await response.json();
        const characterSelect = gameClient.selectors.characterSelect;
        characterSelect.innerHTML = "";

        data.characters.forEach((character) => {
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

function selectCharacter(selectedDiv, gameClient) {
    const options = document.querySelectorAll(".character-option");
    options.forEach((option) => option.classList.remove("selected"));
    selectedDiv.classList.add("selected");

    gameClient.state.selectedCharacter = selectedDiv.dataset.character;
    console.log("Selected character:", gameClient.state.selectedCharacter);
}

export function handleFindLobby(gameClient) {
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

export function handleCancelMatchmaking(gameClient) {
    // Hide matchmaking UI
    gameClient.viewManager.toggleMatchmakingUI(false);

    gameClient.ws.send(
        JSON.stringify({
            action: "cancelMatchmaking",
            lobbyId: gameClient.state.lobbyId,
        })
    );
}

export function disconnectClient(event, gameClient) {
    if (event.target.tagName !== "BUTTON") return;

    gameClient.ws.send(
        JSON.stringify({
            action: "disconnect",
            lobbyId: gameClient.state.lobbyId,
            playerName: gameClient.state.playerName,
        })
    );
}

export function handleMoveButtonClick(event, gameClient) {
    if (event.target.tagName !== "BUTTON") return;

    const move = event.target.dataset.move;
    sendMove(move, gameClient);
    gameClient.viewManager.toggleMoveButtons(false);
}

function sendMove(move, gameClient) {
    const currentState = gameClient.state;

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

export async function loadStatsConfig(gameClient) {
    try {
        const response = await fetch("/config/stats.json"); // Adjust the path based on your setup
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

export function handleServerMessage(event, gameClient) {
    const data = JSON.parse(event.data);
    const handler = messageHandlers[data.action] || handleUnknownMessage;
    handler(data, gameClient);
}

const messageHandlers = {
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

        updatePlayerInfo(data.player, gameClient, "player");
        updatePlayerInfo(data.opponent, gameClient, "opponent");

        gameClient.viewManager.showGameScreen();
        gameClient.viewManager.toggleMoveButtons(true);
    },

    updateGame: (data, gameClient) => {
        updateGameState(data, gameClient);
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
        // toggleMoveButtons(true, gameClient);
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
function updateCooldownIndicator(cooldownType, cooldownValue, gameClient) {
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

function updatePlayerInfo(playerData, gameClient, playerType) {
    const viewManager = gameClient.viewManager;

    // Update player/opponent name
    const playerNameElement = gameClient.selectors[`${playerType}Name`];
    if (playerNameElement) {
        playerNameElement.textContent = playerData.name;
    }

    viewManager.updateStat(playerData.hp, "hp", playerType);
    viewManager.updateStat(playerData.currentResource, "resource", playerType);

    // updateCooldownIndicator(`${playerType}BreakDefense`, playerData.breakDefense, gameClient);
    // updateCooldownIndicator(`${playerType}BreakHeal`, playerData.breakHeal, gameClient);
}
function updateGameState(data, gameClient) {
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

function handleGameOver(data, gameClient) {
    console.log("Game over:", data);
    const winnerName = data.winner || "Unknown";
    gameClient.viewManager.toggleGameoverUI(true, winnerName);
}

function handleUnknownMessage(data) {
    console.warn("Unknown message type:", data.action, data);
}