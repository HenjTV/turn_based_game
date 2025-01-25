import moveOutcomes from "./moveOutcomes.json" assert { type: "json" };

export function resolveMoves(player1, player2) {
    const move1 = player1.move;
    const move2 = player2.move;

    // Calculate effects for both players
    const p1Effect = calculateEffect(moveOutcomes.moves[move1], move2);
    const p2Effect = calculateEffect(moveOutcomes.moves[move2], move1);

    // Apply damage with defense consideration
    player2.hp -= calculateFinalDamage(
        p1Effect.damage,
        moveOutcomes.moves[move2]
    );
    player1.hp += p1Effect.heal;

    player1.hp -= calculateFinalDamage(
        p2Effect.damage,
        moveOutcomes.moves[move1]
    );
    player2.hp += p2Effect.heal;
}

function calculateEffect(attackerConfig, defenderMove) {
    const result = { damage: 0, heal: 0 };

    // Base effect
    if (attackerConfig.type === "damage") {
        result.damage = attackerConfig.value;
    } else if (attackerConfig.type === "heal") {
        result.heal = attackerConfig.value;
    }

    // Apply interactions
    if (attackerConfig.interactions?.[defenderMove]) {
        const interaction = attackerConfig.interactions[defenderMove];
        switch (interaction.modifier) {
            case "reduce_damage":
                result.damage = interaction.value;
                break;
            case "cancel_heal":
                result.heal = 0;
                break;
        }
    }

    return result;
}

function calculateFinalDamage(baseDamage, defenderConfig) {
    // Add potential defense modifiers here
    if (defenderConfig.type === "block") {
        return Math.max(0, baseDamage - defenderConfig.value);
    }
    return baseDamage;
}
