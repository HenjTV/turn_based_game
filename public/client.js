class GameClient {
    constructor() {
        this.ws = new WebSocket("ws://localhost:8108/ws");
        this.initializeSelectors();
        this.setupEventListeners();
        this.initializeState();
        this.loadCharacterOptions();
    }

    initializeState() {
        this.state = {
            playerName: "",
            lobbyId: "",
            currentTurn: "",
            isMyTurn: false,
        };
    }

    initializeSelectors() {
        this.selectors = {
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
        };
    }

    setupEventListeners() {
        this.selectors.findLobbyButton.addEventListener("click", () =>
            this.handleFindLobby()
        );
        this.selectors.moveButtons.addEventListener("click", (e) =>
            this.handleMoveButtonClick(e)
        );
        this.ws.onmessage = (event) => this.handleServerMessage(event);
    }
    // Load character options from the server
    async loadCharacterOptions() {
        try {
            const response = await fetch("/api/characters");

            if (!response.ok) {
                // If response is not OK, throw an error
                throw new Error(`Failed to load character options: ${response.statusText}`);
            }

            const data = await response.json();

            const characterSelect = this.selectors.characterSelect;
            characterSelect.innerHTML = ""; // Clear any existing options

            data.characters.forEach((character) => {
                const div = document.createElement("div");
                div.className = "character-option";
                div.dataset.character = character;

                const img = document.createElement("img");
                img.src = `/images/characters/${character}`;
                img.alt = character;

                div.appendChild(img);
                div.addEventListener("click", () => this.selectCharacter(div));

                characterSelect.appendChild(div);
            });
        } catch (error) {
            console.error("Error loading character options:", error);
        }
    }

    selectCharacter(selectedDiv) {
        // Highlight the selected character
        const options = document.querySelectorAll(".character-option");
        options.forEach(option => option.classList.remove("selected"));
        selectedDiv.classList.add("selected");

        // Store the selected character in the state
        this.state.selectedCharacter = selectedDiv.dataset.character;
    }

    handleFindLobby() {
        this.state.playerName = this.selectors.nameInput.value;
        if (!this.state.playerName) return;

        this.ws.send(
            JSON.stringify({
                action: "findLobby",
                name: this.state.playerName,
            })
        );
    }

    handleMoveButtonClick(event) {
        if (event.target.tagName !== "BUTTON") return;

        const move = event.target.dataset.move;
        this.sendMove(move);
        this.toggleMoveButtons(false);
    }

    sendMove(move) {
        this.ws.send(
            JSON.stringify({
                action: "makeMove",
                lobbyId: this.state.lobbyId,
                move: move,
                playerName: this.state.playerName,
            })
        );
    }

    handleServerMessage(event) {
        const data = JSON.parse(event.data);
        const handler =
            this.messageHandlers[data.action] || this.handleUnknownMessage;
        handler.call(this, data);
    }
    messageHandlers = {
        waitingForPlayer: (data) => {
            this.selectors.loginDiv.style.display = "none";
            this.selectors.waitingMessage.style.display = "flex";
            this.selectors.gameDiv.style.display = "none";
        },

        gameStart: (data) => {
            this.state.lobbyId = data.lobbyId;
            this.state.currentTurn = data.currentTurn;

            this.updatePlayerInfo(data);
            this.showGameScreen();
            this.toggleMoveButtons(true);
        },

        updateGame: (data) => {
            this.updateGameState(data);
            this.toggleMoveButtons(true); //data.currentTurn === this.state.playerName
        },

        gameOver: (data) => {
            this.handleGameOver(data);
        },

        disableButtons: () => {
            this.toggleMoveButtons(false);
        },

        enableButtons: () => {
            this.toggleMoveButtons(true);
        },
    };

    updatePlayerInfo(data) {
        this.selectors.playerName.textContent = data.playerName;
        this.selectors.opponentName.textContent = data.opponentName;
        this.selectors.playerHp.textContent = `HP: ${data.playerHp}`;
        this.selectors.opponentHp.textContent = `HP: ${data.opponentHp}`;
    }

    updateGameState(data) {
        this.selectors.playerHp.textContent = `HP: ${data.playerHp}`;
        this.selectors.opponentHp.textContent = `HP: ${data.opponentHp}`;
        this.state.currentTurn = data.currentTurn;
    }

    showGameScreen() {
        this.selectors.loginDiv.style.display = "none";
        this.selectors.waitingMessage.style.display = "none";
        this.selectors.gameDiv.style.display = "block";
    }

    handleGameOver(data) {
        const message =
            data.reason === "opponent_disconnected"
                ? "Opponent disconnected! You win!"
                : `Winner: ${data.winner}`;

        this.selectors.waitingMessage.textContent = message;
        this.selectors.waitingMessage.style.display = "flex";
        this.selectors.gameDiv.style.display = "none";
        this.toggleMoveButtons(false);

        setTimeout(() => {
            window.location.reload();
        }, 5000);
    }

    toggleMoveButtons(enabled) {
        const buttons = this.selectors.moveButtons.querySelectorAll("button");
        buttons.forEach((button) => (button.disabled = !enabled));
    }

    handleUnknownMessage(data) {
        console.warn("Unknown message type:", data.action);
    }
}

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new GameClient();
});
