function generatePlayerData(player) {
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
export function createGameStateMessage(player, opponent, lobbyId, currentTurn) {
    return JSON.stringify({
        action: "gameStart",
        lobbyId: lobbyId,
        currentTurn: currentTurn,
        player: generatePlayerData(player),
        opponent: generatePlayerData(opponent),
    });
}

export function createUpdateMessage(player, opponent, currentTurn) {
    return {
        action: "updateGame",
        currentTurn: currentTurn,
        player: generatePlayerData(player),
        opponent: generatePlayerData(opponent),
    };
}