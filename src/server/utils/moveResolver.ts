import moveOutcomes from "./moveOutcomes.json" assert { type: "json" };
import {
    Player,
    Effect,
    MoveConfig,
    ResourceConfig,
    MoveKey,
} from "../../types";

export function resolveMoves(player1: Player, player2: Player): void {
    const move1 = player1.move as MoveKey;
    const move2 = player2.move as MoveKey;

    // Validate moves
    if (!move1 || !moveOutcomes.moves[move1]) {
        throw new Error(`Invalid move for Player1: ${move1}`);
    }
    if (!move2 || !moveOutcomes.moves[move2]) {
        throw new Error(`Invalid move for Player2: ${move2}`);
    }

    // Check move priority
    const p1Beats = moveOutcomes.moves[move1].beats || [];
    const p2Beats = moveOutcomes.moves[move2].beats || [];

    // Check for conflicting beats
    if (p1Beats.includes(move2) && p2Beats.includes(move1)) {
        console.warn(`Conflict: ${move1} and ${move2} both beat each other!`);
    }

    // Calculate effects
    let p1Effect: Effect, p2Effect: Effect;

    if (p1Beats.includes(move2)) {
        // Player1's move beats Player2's move
        p1Effect = calculateFullEffect(moveOutcomes.moves[move1], player1, move2);
        p2Effect = { damage: 0, heal: 0, resourceGain: {}, cooldown: {} };
    } else if (p2Beats.includes(move1)) {
        // Player2's move beats Player1's move
        p2Effect = calculateFullEffect(moveOutcomes.moves[move2], player2, move1);
        p1Effect = { damage: 0, heal: 0, resourceGain: {}, cooldown: {} };
    } else {
        // No priority - use default interactions
        p1Effect = calculateEffect(moveOutcomes.moves[move1], move2, player1);
        p2Effect = calculateEffect(moveOutcomes.moves[move2], move1, player2);
    }

    // Decrease resources and cooldowns
    [player1, player2].forEach(player => {
        player.currentResource -= player.powerBar;
        if (player.breakroundleftdefence > 0) player.breakroundleftdefence--;
        if (player.breakroundleftheal > 0) player.breakroundleftheal--;
    });

    // Apply damage/heal with defense consideration
    player2.hp -= calculateFinalDamage(p1Effect.damage, moveOutcomes.moves[move2], move2, move1);
    player1.hp += p1Effect.heal;
    player1.hp -= calculateFinalDamage(p2Effect.damage, moveOutcomes.moves[move1], move1, move2);
    player2.hp += p2Effect.heal;

    // Apply resource changes
    player1.currentResource += p1Effect.resourceGain[player1.resourceType] || 0;
    player2.currentResource += p2Effect.resourceGain[player2.resourceType] || 0;

    // Apply cooldowns
    applyCooldowns(player1, p2Effect.cooldown);
    applyCooldowns(player2, p1Effect.cooldown);

    // Regenerate resources
    regenerateResources(player1, moveOutcomes.resources);
    regenerateResources(player2, moveOutcomes.resources);

    // Clamp values
    player1.hp = Math.min(player1.hp, player1.maxHp);
    player2.hp = Math.min(player2.hp, player2.maxHp);
    player1.currentResource = Math.min(player1.currentResource, player1.maxResource);
    player2.currentResource = Math.min(player2.currentResource, player2.maxResource);
}


function getBaseEffect(config: MoveConfig, attacker: Player) {
    switch (config.type) {
        case "damage":
            return (config.baseDamage || 0) + (config.powerBarModifier || 0) * attacker.powerBar;
        case "heal":
            return (config.baseHeal || 0) + (config.powerBarModifier || 0) * attacker.powerBar;
        case "counter":
            return 0 + (config.powerBarModifier || 0) * attacker.powerBar;
        default:
            return 0;
    }
}

// Shared interaction handling
function applyInteraction(result: Effect, interaction: any) {
    if (interaction?.damageModifier) {
        result.damage *= interaction.damageModifier;
    }
    if (interaction?.resourceGain) {
        result.resourceGain = { ...interaction.resourceGain };
    }
    if (interaction?.cooldown) {
        result.cooldown = { ...interaction.cooldown };
    }
}



function calculateEffect(attackerConfig: MoveConfig, defenderMove: string | null | undefined, attacker: Player): Effect {
    const result: Effect = { damage: 0, heal: 0, resourceGain: {}, cooldown: {} };
    result.damage = getBaseEffect(attackerConfig, attacker);
    applyInteraction(result, attackerConfig.interactions?.[defenderMove as string]);
    return result;
}

function calculateFullEffect(moveConfig: MoveConfig, attacker: Player, defenderMove: string | null | undefined): Effect {
    const result: Effect = { damage: 0, heal: 0, resourceGain: {}, cooldown: {} };
    result.damage = getBaseEffect(moveConfig, attacker);
    // Skip damageModifier but keep resources/cooldowns
    if (moveConfig.interactions?.[defenderMove as string]) {
        result.resourceGain = { ...moveConfig.interactions[defenderMove as string].resourceGain };
        result.cooldown = { ...moveConfig.interactions[defenderMove as string].cooldown };
    }
    return result;
}

function calculateFinalDamage(
    baseDamage: number,
    defenderConfig: MoveConfig,
    defenderMove: MoveKey,
    attackerMove: MoveKey
): number {
    // Check if attacker's move beats defender's move
    const isBeaten = moveOutcomes.moves[attackerMove]?.beats?.includes(defenderMove);

    // Only apply defense if not beaten and defender is blocking
    if (defenderConfig.type === "block" && !isBeaten) {
        return Math.max(0, baseDamage - (defenderConfig.baseDefense || 0));
    }
    return baseDamage;
}

function applyCooldowns(player: Player, cooldown?: { breakDefense?: number; breakHeal?: number }) {
    if (cooldown?.breakDefense) {
        player.breakroundleftdefence = cooldown.breakDefense;
    }
    if (cooldown?.breakHeal) {
        player.breakroundleftheal = cooldown.breakHeal;
    }
}

function regenerateResources(player: Player, resources: ResourceConfig): void {
    if (resources[player.resourceType]) {
        player.currentResource = Math.min(
            player.currentResource + resources[player.resourceType].regenPerTurn,
            player.maxResource
        );
    }
}