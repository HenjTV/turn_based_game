export function createGameStateMessage(player, opponent, lobbyId, currentTurn) {
    return JSON.stringify({
        action: "gameStart",
        lobbyId: lobbyId,
        playerName: player.name,
        opponentName: opponent.name,
        playerHp: player.hp,
        opponentHp: opponent.hp,
        currentTurn: currentTurn,
        playerCharacter: player.character,
        opponentCharacter: opponent.character,
    });
}

export function createUpdateMessage(player, opponent, currentTurn) {
    return JSON.stringify({
        action: "updateGame",
        playerName: player.name,
        opponentName: opponent.name,
        playerHp: player.hp,
        opponentHp: opponent.hp,
        currentTurn: currentTurn,
        playerCharacter: player.character,
        opponentCharacter: opponent.character,
    });
}