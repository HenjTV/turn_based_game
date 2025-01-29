import { initializeState, loadStatsConfig, loadCharacterOptions } from "./gameLogic.js";
import { initializeSelectors, setupEventListeners } from "./ui.js";
import { ViewManager } from './viewManager.js';

class GameClient {
    constructor() {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host; // Automatically gets the current host (e.g., <VPS_IP>:8108)
        const wsUrl = `${protocol}//${host}/ws`;

        this.ws = new WebSocket(wsUrl);
        this.selectors = initializeSelectors();
        this.state = initializeState();
        this.viewManager = new ViewManager(this);

        setupEventListeners(this);
        loadCharacterOptions(this);
        loadStatsConfig(this);
        this.viewManager.showLogin();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new GameClient();
});
