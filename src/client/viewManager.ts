import { GameClient } from './index';
import { Selectors } from './ui';
interface Views {
    login: HTMLElement | null;
    mainApp: HTMLElement | null;
    game: HTMLElement | null;
}

export class ViewManager {
    gameClient: GameClient;
    views: Views;
    navButtons: NodeListOf<Element>;

    constructor(gameClient: GameClient) {
        this.gameClient = gameClient;
        this.views = {
            login: document.getElementById("login"),
            mainApp: document.getElementById("main-app"),
            game: document.getElementById("game"),
        };

        this.navButtons = document.querySelectorAll(".nav-btn");
        this.initializeNavigation();
    }
    updateStat(currentValue: number, statType: string, playerType: string): void {
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
        const barElement = containerElement.querySelector(`.${statType}-current`) as HTMLElement;
        const textElement = containerElement.querySelector(`.${statType}-text`) as HTMLElement;

        const percentage = (currentValue / config.max) * 100;
        barElement.style.width = `${percentage}%`;
        barElement.style.backgroundColor = config.color;
        textElement.textContent = `${Math.round(currentValue)}/${config.max} ${config.suffix}`;
    }
    initializeNavigation(): void {
        this.navButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const viewId = (btn as HTMLElement).dataset.view;
                this.activateSubview(viewId);
            });
        });
    }
    activateSubview(viewId: string): void {
        document.querySelectorAll("#content-container .view").forEach((view) => {
            view.classList.add("hidden");
        });

        this.navButtons.forEach((btn) => {
            btn.classList.toggle("active", (btn as HTMLElement).dataset.view === viewId);
        });

        const targetView = document.getElementById(`${viewId}-view`);
        if (targetView) {
            targetView.classList.remove("hidden");
        } else {
            console.error(`Subview with ID ${viewId}-view not found.`);
        }
    }
    resetUI(): void {
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

    showView(viewId: string): void {
        this.resetUI();

        // Hide all views
        Object.values(this.views).forEach((view) => {
            view?.classList.add("hidden");
        });
        // Show the selected view
        const targetView = this.views[viewId];
        if (targetView) {
            targetView.classList.remove("hidden");
        }
    }

    loadViewContent(viewId: string): void {
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

    updateLobbyView(): void {
        const characterDisplay = document.getElementById(
            "selected-character-img"
        ) as HTMLImageElement;
        if (this.gameClient.state.selectedCharacter) {
            characterDisplay.src = `/images/characters/${this.gameClient.state.selectedCharacter}`;
        }
    }

    async loadLeaderboard(): Promise<void> {
        // Implement leaderboard loading
    }

     toggleMatchmakingUI(isActive: boolean): void {
        const { matchmakingOverlay, cancelMatchmakingButton, allButtons } =
            this.gameClient.selectors;
        matchmakingOverlay.classList.toggle("hidden", !isActive);
        allButtons.forEach((button) => {
            if (button !== cancelMatchmakingButton) {
                button.disabled = isActive;
            }
        });
    }
    toggleGameoverUI(isActive: boolean, winnerName: string = "Unknown"): void {
          const { gameoverOverlay, closeGameoverOverlay, allButtons } =
            this.gameClient.selectors;
        gameoverOverlay.classList.toggle("hidden", !isActive);
        if (isActive) {
            const gameoverStatus =
                gameoverOverlay.querySelector("#gameover-status p") as HTMLElement;
            gameoverStatus.textContent = `Match ended! Winner: ${winnerName}`;
        }
         allButtons.forEach((button) => {
            if (button !== closeGameoverOverlay) {
                button.disabled = isActive;
            }
        });
    }
    toggleMoveButtons(enabled: boolean): void {
        const buttons =
            this.gameClient.selectors.moveButtons.querySelectorAll("button");
        buttons.forEach((button) => (button.disabled = !enabled));
    }

    showGameScreen(): void {
        this.showView("game");
    }

    showMainApp(): void {
         this.showView("mainApp");
    }

    showLogin(): void {
        this.showView("login");
    }
}
