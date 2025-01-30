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

    const p1FinalDamage = calculateFinalDamage(p1Effect.damage, moveOutcomes.moves[move2], move2, move1);
    const p2FinalDamage = calculateFinalDamage(p2Effect.damage, moveOutcomes.moves[move1], move1, move2);

    player2.hp -= p1FinalDamage;
    player1.hp += p1Effect.heal;
    player1.hp -= p2FinalDamage;
    player2.hp += p2Effect.heal;


    [player1, player2].forEach(player => {
        player.currentResource = Math.max(player.currentResource - player.powerBar, 0);
        if (player.powerBar > player.currentResource) {
            player.powerBar = player.currentResource;
        }
        player.hp = Math.min(player.hp, player.maxHp);

        if (player.breakroundleftdefence > 0) player.breakroundleftdefence--;
        if (player.breakroundleftheal > 0) player.breakroundleftheal--;

        regenerateResources(player, moveOutcomes.resources);
    });

    // Apply resource changes
    // player1.currentResource += p1Effect.resourceGain[player1.resourceType] || 0;
    // player2.currentResource += p2Effect.resourceGain[player2.resourceType] || 0;

    // Apply cooldowns
    applyCooldowns(player1, p2Effect.cooldown);
    applyCooldowns(player2, p1Effect.cooldown);
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


function getBaseResult(moveConfig: MoveConfig, attacker: Player): Effect {
    const result: Effect = { damage: 0, heal: 0, resourceGain: {}, cooldown: {} };

    switch (moveConfig.type) {
        case "damage":
            result.damage = (moveConfig.baseDamage || 0) + (moveConfig.powerBarModifier || 0) * attacker.powerBar;
            break;
        case "heal":
            result.heal = (moveConfig.baseHeal || 0) + (moveConfig.powerBarModifier || 0) * attacker.powerBar;
            break;
        case "block":
        case "counter":
            // Defensive moves do nothing by default
            break;
    }

    return result;
}

function calculateEffect(
    attackerConfig: MoveConfig,
    defenderMove: string | null | undefined,
    attacker: Player
): Effect {
    const result = getBaseResult(attackerConfig, attacker);

    // Apply interaction effects (including damageModifier)
    if (defenderMove && attackerConfig.interactions?.[defenderMove]) {
        applyInteraction(result, attackerConfig.interactions[defenderMove]);
    }

    return result;
}

function calculateFullEffect(
    moveConfig: MoveConfig,
    attacker: Player,
    defenderMove: string | null | undefined
): Effect {
    const result = getBaseResult(moveConfig, attacker);

    // Apply only resource/cooldown interactions (no damageModifier)
    if (defenderMove && moveConfig.interactions?.[defenderMove]) {
        const interaction = moveConfig.interactions[defenderMove];
        result.resourceGain = { ...interaction.resourceGain };
        result.cooldown = { ...interaction.cooldown };
    }

    return result;
}

function calculateFinalDamage(
    baseDamage: number,
    defenderConfig: MoveConfig,
    defenderMove: MoveKey,
    attackerMove: MoveKey
): number {
    const isBeaten = moveOutcomes.moves[attackerMove]?.beats?.includes(defenderMove);

    // Full block if defender uses a defensive move and isn't beaten
    if ((defenderConfig.type === "block" || defenderConfig.type === "counter") && !isBeaten) {
        return 0;
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
    // Regenerate resources
    player.currentResource = Math.min(player.currentResource + 10, player.maxResource);
    // if (resources[player.resourceType]) {
    //     player.currentResource = Math.min(player.currentResource + resources[player.resourceType].regenPerTurn, player.maxResource);
    // }
}