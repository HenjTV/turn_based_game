import { initializeState, loadStatsConfig, loadCharacterOptions } from "./gameLogic.js";
import { initializeSelectors, setupEventListeners } from "./ui.js";
import { ViewManager } from './viewManager.js';

class GameClient {
    constructor() {
        this.ws = new WebSocket("ws://localhost:8108/ws");
        this.selectors = initializeSelectors();
        this.state = initializeState();
        this.viewManager = new ViewManager(this);

        setupEventListeners(this);
        loadCharacterOptions(this);
        loadStatsConfig(this);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new GameClient();
});
