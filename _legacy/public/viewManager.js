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
    updateStat(currentValue, statType, playerType) {
        console.log("Updating stat:", currentValue, statType, playerType);
        const config = this.gameClient.state.statsConfig[statType];
        if (!config) {
            console.warn(`Stat configuration for "${statType}" not found.`);
            return;
        }

        // Determine which selector to target dynamically
        const containerElement = this.gameClient.selectors[`${playerType}${statType.charAt(0).toUpperCase() + statType.slice(1)}`];
        if (!containerElement) {
            console.warn(`Selector for ${playerType}${statType.charAt(0).toUpperCase() + statType.slice(1)} not found.`);
            return;
        }

        const barElement = containerElement.querySelector(`.${statType}-current`);
        const textElement = containerElement.querySelector(`.${statType}-text`);

        const percentage = (currentValue / config.max) * 100;
        barElement.style.width = `${percentage}%`;
        barElement.style.backgroundColor = config.color;
        textElement.textContent = `${Math.round(currentValue)}/${config.max} ${config.suffix}`;
    }
    initializeNavigation() {
        this.navButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const viewId = btn.dataset.view;
                this.activateSubview(viewId);
            });
        });
    }
    activateSubview(viewId) {
        document.querySelectorAll("#content-container .view").forEach((view) => {
            view.classList.add("hidden");
        });

        this.navButtons.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.view === viewId);
        });

        const targetView = document.getElementById(`${viewId}-view`);
        if (targetView) {
            targetView.classList.remove("hidden");
        } else {
            console.error(`Subview with ID ${viewId}-view not found.`);
        }
    }
    resetUI() {
        const defaults = {
            overlays: [".overlay"],
            buttons: [".btn"],
        };

        defaults.overlays.forEach((selector) => {
            document.querySelectorAll(selector).forEach((overlay) => {
                overlay.classList.add("hidden");
            });
        });

        defaults.buttons.forEach((selector) => {
            document.querySelectorAll(selector).forEach((button) => {
                button.disabled = false;
            });
        });
        // Additional resets
        this.toggleMatchmakingUI(false);
        this.toggleGameoverUI(false);
    }

    showView(viewId) {
        this.resetUI();

        // Hide all views
        Object.values(this.views).forEach((view) => {
            view.classList.add("hidden");
        });
        // Show the selected view
        const targetView = this.views[viewId];
        if (targetView) {
            targetView.classList.remove("hidden");
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
        const characterDisplay = document.getElementById(
            "selected-character-img"
        );
        if (this.gameClient.state.selectedCharacter) {
            characterDisplay.src = `/images/characters/${this.gameClient.state.selectedCharacter}`;
        }
    }

    async loadLeaderboard() {
        // Implement leaderboard loading
    }

    toggleMatchmakingUI(isActive) {
        const { matchmakingOverlay, cancelMatchmakingButton, allButtons } =
            this.gameClient.selectors;
        matchmakingOverlay.classList.toggle("hidden", !isActive);
        allButtons.forEach((button) => {
            if (button !== cancelMatchmakingButton) {
                button.disabled = isActive;
            }
        });
    }
    toggleGameoverUI(isActive, winnerName = "Unknown") {
        const { gameoverOverlay, closeGameoverOverlay, allButtons } =
            this.gameClient.selectors;
        gameoverOverlay.classList.toggle("hidden", !isActive);
        if (isActive) {
            const gameoverStatus =
                gameoverOverlay.querySelector("#gameover-status p");
            gameoverStatus.textContent = `Match ended! Winner: ${winnerName}`;
        }
        allButtons.forEach((button) => {
            if (button !== closeGameoverOverlay) {
                button.disabled = isActive;
            }
        });
    }
    toggleMoveButtons(enabled) {
        const buttons =
            this.gameClient.selectors.moveButtons.querySelectorAll("button");
        buttons.forEach((button) => (button.disabled = !enabled));
    }

    showGameScreen() {
        this.showView("game");
    }

    showMainApp() {
        this.showView("mainApp");
    }

    showLogin() {
        this.showView("login");
    }
}
