import { Player } from '../../types';

interface PlayerData {
    name: string;
    hp: number;
    character: string | null;
    currentResource: number;
    maxResource: number;
    resourceType: string;
    breakDefense: number;
    breakHeal: number;
    powerBar: number;
}

function generatePlayerData(player: Player): PlayerData {
    return {
        name: player.name,
        hp: player.hp,
        character: player.character,
        currentResource: player.currentResource,
        maxResource: player.maxResource,
        resourceType: player.resourceType,
        breakDefense: player.breakroundleftdefence,
        breakHeal: player.breakroundleftheal,
        powerBar: player.powerBar,
    };
}

export function createGameStateMessage(player: Player, opponent: Player, lobbyId: string, currentTurn: string): string {
    return JSON.stringify({
        action: "gameStart",
        lobbyId: lobbyId,
        currentTurn: currentTurn,
        player: generatePlayerData(player),
        opponent: generatePlayerData(opponent),
    });
}

export function createUpdateMessage(player: Player, opponent: Player, currentTurn: string): any {
    return {
        action: "updateGame",
        currentTurn: currentTurn,
        player: generatePlayerData(player),
        opponent: generatePlayerData(opponent),
    };
}