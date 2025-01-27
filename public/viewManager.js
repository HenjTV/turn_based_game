export class ViewManager {
    constructor(gameClient) {
        this.gameClient = gameClient;
        this.views = {
            login: document.getElementById("login"),
            mainApp: document.getElementById("main-app"),
            game: document.getElementById("game"),
        };

        this.navButtons = document.querySelectorAll(".nav-btn");
        this.initializeNavigation();
    }

    initializeNavigation() {
        this.navButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const viewId = btn.dataset.view;
                this.showView(viewId);
            });
        });
    }

    showView(viewId) {
        // Hide all views
        document.querySelectorAll(".view").forEach((view) => {
            view.classList.remove("active");
        });

        // Update navigation buttons
        this.navButtons.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.view === viewId);
        });

        // Show selected view
        const targetView = document.getElementById(`${viewId}-view`);
        if (targetView) {
            targetView.classList.add("active");
            this.loadViewContent(viewId);
        }
    }

    loadViewContent(viewId) {
        switch (viewId) {
            case "lobby":
                this.updateLobbyView();
                break;
            case "leaderboard":
                this.loadLeaderboard();
                break;
            // Add other view cases
        }
    }

    updateLobbyView() {
        const characterDisplay = document.getElementById("selected-character-img");
        if (this.gameClient.state.selectedCharacter) {
            characterDisplay.src = `/images/characters/${this.gameClient.state.selectedCharacter}`;
        }
    }

    async loadLeaderboard() {
        // Implement leaderboard loading
    }
    // Transition between main views
    toggleMatchmakingUI(isActive) {
        const { matchmakingOverlay, cancelMatchmakingButton, allButtons } = this.gameClient.selectors;
        matchmakingOverlay.classList.toggle("hidden", !isActive);
        allButtons.forEach(button => {
            if(button !== cancelMatchmakingButton) {
                button.disabled = isActive;
            }
        });
    }
    toggleGameoverUI(isActive) {
        const { gameoverOverlay, closeGameoverOverlay, allButtons } = this.gameClient.selectors;
        gameoverOverlay.classList.toggle("hidden", !isActive);
        allButtons.forEach(button => {
            if(button !== closeGameoverOverlay) {
                button.disabled = isActive;
            }
        });
    }
    toggleMoveButtons(enabled) {
        const buttons = this.gameClient.selectors.moveButtons.querySelectorAll("button");
        buttons.forEach((button) => (button.disabled = !enabled));
    }
    showGameScreen() {
        this.toggleMatchmakingUI(false);
        this.views.mainApp.classList.add("hidden");
        this.views.game.classList.remove("hidden");
    }

    showMainApp() {
        this.toggleMatchmakingUI(false);
        this.views.game.classList.add("hidden");
        this.views.login.classList.add("hidden");
        this.views.mainApp.classList.remove("hidden");
    }
}
