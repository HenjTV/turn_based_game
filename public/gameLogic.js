export function initializeState() {
    return {
        playerName: "",
        lobbyId: "",
        currentTurn: "",
        isMyTurn: false,
        selectedCharacter: null,
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
    gameClient.state.playerName = gameClient.selectors.nameInput.value;
    if (!gameClient.state.playerName || !gameClient.state.selectedCharacter) {
        alert("Please enter your name and select a character!");
        return;
    }

    gameClient.ws.send(
        JSON.stringify({
            action: "findLobby",
            name: gameClient.state.playerName,
            character: gameClient.state.selectedCharacter,
        })
    );
}

export function handleMoveButtonClick(event, gameClient) {
    if (event.target.tagName !== "BUTTON") return;

    const move = event.target.dataset.move;
    sendMove(move, gameClient);
    toggleMoveButtons(false, gameClient);
}

function sendMove(move, gameClient) {
    gameClient.ws.send(
        JSON.stringify({
            action: "makeMove",
            lobbyId: gameClient.state.lobbyId,
            move: move,
            playerName: gameClient.state.playerName,
        })
    );
}

export function handleServerMessage(event, gameClient) {
    const data = JSON.parse(event.data);
    const handler = messageHandlers[data.action] || handleUnknownMessage;
    handler(data, gameClient);
}

const messageHandlers = {
    waitingForPlayer: (data, gameClient) => {
        gameClient.selectors.loginDiv.style.display = "none";
        gameClient.selectors.waitingMessage.style.display = "flex";
        gameClient.selectors.gameDiv.style.display = "none";
    },

    gameStart: (data, gameClient) => {
        gameClient.state.lobbyId = data.lobbyId;
        gameClient.state.currentTurn = data.currentTurn;

        gameClient.selectors.playerCharacter.src = `/images/characters/${data.playerCharacter}`;
        gameClient.selectors.opponentCharacter.src = `/images/characters/${data.opponentCharacter}`;

        updatePlayerInfo(data, gameClient);
        showGameScreen(gameClient);
        toggleMoveButtons(true, gameClient);
    },

    updateGame: (data, gameClient) => {
        updateGameState(data, gameClient);
        toggleMoveButtons(true, gameClient); //data.currentTurn === this.state.playerName
    },

    gameOver: (data, gameClient) => {
        handleGameOver(data, gameClient);
    },

    disableButtons: (data, gameClient) => {
        toggleMoveButtons(false, gameClient);
    },

    enableButtons: (data, gameClient) => {
        toggleMoveButtons(true, gameClient);
    },
};

function updatePlayerInfo(data, gameClient) {
    gameClient.selectors.playerName.textContent = data.playerName;
    gameClient.selectors.opponentName.textContent = data.opponentName;
    gameClient.selectors.playerHp.textContent = `HP: ${data.playerHp}`;
    gameClient.selectors.opponentHp.textContent = `HP: ${data.opponentHp}`;
}

function updateGameState(data, gameClient) {
    gameClient.selectors.playerHp.textContent = `HP: ${data.playerHp}`;
    gameClient.selectors.opponentHp.textContent = `HP: ${data.opponentHp}`;
    gameClient.state.currentTurn = data.currentTurn;
}

function showGameScreen(gameClient) {
    gameClient.selectors.loginDiv.style.display = "none";
    gameClient.selectors.waitingMessage.style.display = "none";
    gameClient.selectors.gameDiv.style.display = "block";
}

function handleGameOver(data, gameClient) {
    const message =
        data.reason === "opponent_disconnected"
            ? "Opponent disconnected! You win!"
            : `Winner: ${data.winner}`;

    gameClient.selectors.waitingMessage.textContent = message;
    gameClient.selectors.waitingMessage.style.display = "flex";
    gameClient.selectors.gameDiv.style.display = "none";
    toggleMoveButtons(false, gameClient);

    setTimeout(() => {
        window.location.reload();
    }, 5000);
}

function toggleMoveButtons(enabled, gameClient) {
    const buttons = gameClient.selectors.moveButtons.querySelectorAll("button");
    buttons.forEach((button) => (button.disabled = !enabled));
}

function handleUnknownMessage(data) {
    console.warn("Unknown message type:", data.action);
}