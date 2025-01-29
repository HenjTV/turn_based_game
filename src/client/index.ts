import { initializeState, loadStatsConfig, loadCharacterOptions } from "./gameLogic";
import { initializeSelectors, setupEventListeners } from "./ui";
import { ViewManager } from './viewManager';
import { GameState, Selectors } from "./../types";

export class GameClient {
    ws: WebSocket;
    selectors: Selectors;
    state: GameState;
    viewManager: ViewManager;

    constructor() {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
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
