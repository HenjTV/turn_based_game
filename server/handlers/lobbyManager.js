import { createGameStateMessage } from '../utils/messageHelper.js';
export const lobbies = new Map();

// export function createGameStateMessage(player, opponent, lobbyId, currentTurn) {
//     return JSON.stringify({
//         action: "gameStart",
//         lobbyId: lobbyId,
//         playerName: player.name,
//         opponentName: opponent.name,
//         playerHp: player.hp,
//         opponentHp: opponent.hp,
//         currentTurn: currentTurn,
//         playerCharacter: player.character,
//         opponentCharacter: opponent.character,
//     });
// }

export function handleFindLobby(ws, data) {
    const player = {
        ws,
        name: data.name,
        hp: 100,
        character: data.character
    };
    let foundLobby = false;

    for (const [lobbyId, players] of lobbies.entries()) {
        if (players.length === 1) {
            players.push(player);
            foundLobby = true;
            const [firstPlayer, secondPlayer] = players;
            const currentTurn =
                Math.random() < 0.5 ? firstPlayer.name : secondPlayer.name;

            firstPlayer.ws.send(
                createGameStateMessage(
                    firstPlayer,
                    secondPlayer,
                    lobbyId,
                    currentTurn
                )
            );
            secondPlayer.ws.send(
                createGameStateMessage(
                    secondPlayer,
                    firstPlayer,
                    lobbyId,
                    currentTurn
                )
            );
            break;
        }
    }

    if (!foundLobby) {
        const lobbyId = `lobby-${lobbies.size + 1}`;
        lobbies.set(lobbyId, [player]);
        ws.send(JSON.stringify({ action: "waitingForLobby", lobbyId }));
    }
}

export function removePlayerFromLobby(ws) {
    for (const [lobbyId, players] of lobbies.entries()) {
        const index = players.findIndex((player) => player.ws === ws);
        if (index !== -1) {
            const disconnectedPlayer = players.splice(index, 1)[0];

            // Notify remaining player if there's one left
            if (players.length === 1) {
                const remainingPlayer = players[0];
                const gameOverMessage = JSON.stringify({
                    action: "gameOver",
                    winner: remainingPlayer.name,
                    reason: "opponent_disconnected",
                });
                remainingPlayer.ws.send(gameOverMessage);
                remainingPlayer.ws.close();
            }

            // Clean up empty lobbies
            if (players.length === 0) {
                lobbies.delete(lobbyId);
            }
            break;
        }
    }
}
