import { lobbies } from './lobbyManager.js';
import { resolveMoves } from './moveResolver.js';
import { createUpdateMessage } from './messageHelper.js';

export function handleMakeMove(ws, data) {
    const { lobbyId, move, playerName } = data;
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;

    const [player1, player2] = lobby;
    const currentPlayer = player1.name === playerName ? player1 : player2;
    const opponent = player1.name === playerName ? player2 : player1;

    // Store move and disable buttons
    currentPlayer.move = move;
    currentPlayer.ws.send(JSON.stringify({ action: "disableButtons" }));

    // Process moves if both players acted
    if (player1.move && player2.move) {
        resolveMoves(player1, player2);
        player1.move = player2.move = null;

        // Check game over condition
        if (player1.hp <= 0 || player2.hp <= 0) {
            const winner = player1.hp > 0 ? player1.name : player2.name;
            const gameOverMessage = JSON.stringify({
                action: "gameOver",
                winner
            });
            player1.ws.send(gameOverMessage);
            player2.ws.send(gameOverMessage);
            lobbies.delete(lobbyId);
            return;
        }

        // Update game state
        const nextTurn = opponent.name;
        player1.ws.send(createUpdateMessage(player1, player2, nextTurn));
        player2.ws.send(createUpdateMessage(player2, player1, nextTurn));
        opponent.ws.send(JSON.stringify({ action: "enableButtons" }));
    }
}