import { createGameStateMessage } from '../utils/messageHelper';
import { ServerWebSocket } from 'bun';
import { Player } from '../../types';

type Lobby = Player[];
export const lobbies: Map<string, Lobby> = new Map();

export function initializePlayerState(overrides: Partial<Player> = {}): Player {
    return {
        ws: null as any, // Placeholder, will be set later
        name: "",
        character: null,
        hp: 100,
        maxHp: 100,
        currentResource: 100,
        maxResource: 100,
        breakroundleftheal: 0,
        breakroundleftdefence: 0,
        powerBar: 1,
        resourceType: "Rage",
        ...overrides,
    };
}

export function handleFindLobby(ws: ServerWebSocket, data: any): void {

    const player: Player = initializePlayerState({
        ws,
        name: data.name,
        character: data.character,
    });

    let foundLobby: boolean = false;

    for (const [lobbyId, players] of lobbies.entries()) {
        if (players.length === 1) {
            players.push(player);
            foundLobby = true;
            const [firstPlayer, secondPlayer] = players;
            const currentTurn: string =
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
        const lobbyId: string = `lobby-${lobbies.size + 1}`;
        lobbies.set(lobbyId, [player]);
        ws.send(JSON.stringify({ action: "waitingForLobby", lobbyId }));
    }
}

export function removePlayerFromLobby(ws: ServerWebSocket): void {
    for (const [lobbyId, players] of lobbies.entries()) {
        const index: number = players.findIndex((player) => player.ws === ws);
        if (index !== -1) {
            const disconnectedPlayer: Player = players.splice(index, 1)[0];

            // Notify remaining player if there's one left
            if (players.length === 1) {
                const remainingPlayer: Player = players[0];
                const gameOverMessage: string = JSON.stringify({
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