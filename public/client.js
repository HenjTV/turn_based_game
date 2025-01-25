import { initializeState, loadCharacterOptions } from './gameLogic.js'; // 👈 Simplified
import { initializeSelectors, setupEventListeners } from './ui.js';

class GameClient {
  constructor() {
    this.ws = new WebSocket("ws://localhost:8108/ws");
    this.selectors = initializeSelectors();
    this.state = initializeState();
    setupEventListeners(this);
    loadCharacterOptions(this);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new GameClient();
});