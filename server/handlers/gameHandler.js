import { lobbies, removePlayerFromLobby } from './lobbyManager.js';
import { resolveMoves } from '../utils/moveResolver.js';
import { createUpdateMessage } from '../utils/messageHelper.js';

function getPlayers(lobby, playerName) {
    const [player1, player2] = lobby;
    const currentPlayer = player1.name === playerName ? player1 : player2;
    const opponent = player1.name === playerName ? player2 : player1;
    return { currentPlayer, opponent };
}

function sendMessage(ws, message) {
    try {
        ws.send(JSON.stringify(message));
    } catch (error) {
        console.error("Failed to send message:", error);
    }
}

export function handleMakeMove(ws, data) {
    const { lobbyId, move, playerName } = data;

    // Validate lobby
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    const { currentPlayer, opponent } = getPlayers(lobby, playerName);

    // Store move and disable buttons
    currentPlayer.move = move;
    sendMessage(currentPlayer.ws, { action: "disableButtons" });

    console.log("PLAYER DATA", currentPlayer, opponent);
    // Process moves if both players have acted
    if (lobby[0].move && lobby[1].move) {
        resolveMoves(lobby[0], lobby[1]);

        lobby[0].move = null;
        lobby[1].move = null;

        // Check if the game is over
        if (lobby[0].hp <= 0 || lobby[1].hp <= 0) {
            const winner = lobby[0].hp > 0 ? lobby[0].name : lobby[1].name;
            const gameOverMessage = { action: "gameOver", winner };
            sendMessage(lobby[0].ws, gameOverMessage);
            sendMessage(lobby[1].ws, gameOverMessage);
            lobbies.delete(lobbyId);
            return;
        }

        // Update game state for the next turn
        console.log("DATA", lobby[0].hp, lobby[1].hp);
        const nextTurn = opponent.name;
        sendMessage(lobby[0].ws, createUpdateMessage(lobby[0], lobby[1], nextTurn));
        sendMessage(lobby[1].ws, createUpdateMessage(lobby[1], lobby[0], nextTurn));
        sendMessage(opponent.ws, { action: "enableButtons" });
    }
}

// Handle when a player disconnects
export function handleDisconnect(ws, data) {
    const { lobbyId, playerName } = data;

    // Validate lobby
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    const { opponent } = getPlayers(lobby, playerName);

    // Notify the opponent about the game over
    const gameOverMessage = { action: "gameOver", winner: opponent.name };

    sendMessage(lobby[0].ws, gameOverMessage);
    sendMessage(lobby[1].ws, gameOverMessage);
    lobbies.delete(lobbyId);
}
