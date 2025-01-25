export function createGameStateMessage(player, opponent, lobbyId, currentTurn) {
    return JSON.stringify({
        action: "gameStart",
        lobbyId,
        playerName: player.name,
        opponentName: opponent.name,
        playerHp: player.hp,
        opponentHp: opponent.hp,
        currentTurn
    });
}

export function createUpdateMessage(player, opponent, currentTurn) {
    return JSON.stringify({
        action: "updateGame",
        playerName: player.name,
        opponentName: opponent.name,
        playerHp: player.hp,
        opponentHp: opponent.hp,
        currentTurn
    });
}