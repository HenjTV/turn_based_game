import moveOutcomes from "./moveOutcomes.json" assert { type: "json" };
import {
    Player,
    Effect,
    MoveConfig,
    ResourceConfig,
    MoveKey,
} from "../../types";

export function resolveMoves(player1: Player, player2: Player): void {
    const move1: MoveKey | null | undefined = player1.move as
        | MoveKey
        | null
        | undefined;
    const move2: MoveKey | null | undefined = player2.move as
        | MoveKey
        | null
        | undefined;

    // Decrease resources based on power bar usage
    [player1, player2].forEach((player) => {
        player.currentResource -= player.powerBar;
    });

    // Decrease cooldowns
    [player1, player2].forEach((player) => {
        if (player.breakroundleftdefence > 0) player.breakroundleftdefence--;
        if (player.breakroundleftheal > 0) player.breakroundleftheal--;
    });

    // Calculate effects for both players
    const p1Effect: Effect = calculateEffect(
        moveOutcomes.moves[move1 as MoveKey],
        move2,
        player1
    );
    const p2Effect: Effect = calculateEffect(
        moveOutcomes.moves[move2 as MoveKey],
        move1,
        player2
    );

    // Apply damage with defense consideration
    player2.hp -= calculateFinalDamage(
        p1Effect.damage,
        moveOutcomes.moves[move2 as MoveKey]
    );
    player1.hp += p1Effect.heal;

    player1.hp -= calculateFinalDamage(
        p2Effect.damage,
        moveOutcomes.moves[move1 as MoveKey]
    );
    player2.hp += p2Effect.heal;

    console.log(
        "HP, resources, moves, effects:",
        player1.hp,
        player2.hp,
        move1,
        move2,
        p1Effect,
        p2Effect
    );

    // Apply resource changes
    player1.currentResource += p1Effect.resourceGain[player1.resourceType] || 0;
    player2.currentResource += p2Effect.resourceGain[player2.resourceType] || 0;

    // Apply cooldowns
    if (p1Effect.cooldown?.breakDefense)
        player2.breakroundleftdefence = p1Effect.cooldown.breakDefense;
    if (p1Effect.cooldown?.breakHeal)
        player2.breakroundleftheal = p1Effect.cooldown.breakHeal;

    if (p2Effect.cooldown?.breakDefense)
        player1.breakroundleftdefence = p2Effect.cooldown.breakDefense;
    if (p2Effect.cooldown?.breakHeal)
        player1.breakroundleftheal = p2Effect.cooldown.breakHeal;

    // Regenerate resources
    [player1, player2].forEach((player) =>
        regenerateResources(player, moveOutcomes.resources)
    );

    // Ensure health and resources don't exceed max values
    player1.hp = Math.min(player1.hp, player1.maxHp);
    player2.hp = Math.min(player2.hp, player2.maxHp);
    player1.currentResource = Math.min(
        player1.currentResource,
        player1.maxResource
    );
    player2.currentResource = Math.min(
        player2.currentResource,
        player2.maxResource
    );
}

function calculateEffect(
    attackerConfig: MoveConfig,
    defenderMove: MoveKey | null | undefined,
    attacker: Player
): Effect {
    const result: Effect = {
        damage: 0,
        heal: 0,
        resourceGain: {},
        cooldown: {},
    };

    // Base effect
    if (attackerConfig.type === "damage") {
        result.damage =
            (attackerConfig.baseDamage || 0) +
            (attackerConfig.powerBarModifier || 0) * attacker.powerBar;
    } else if (attackerConfig.type === "heal") {
        result.heal =
            (attackerConfig.baseHeal || 0) +
            (attackerConfig.powerBarModifier || 0) * attacker.powerBar;
    }

    const interaction = attackerConfig.interactions?.[defenderMove as MoveKey];
    if (interaction) {
        if (
            attackerConfig.type === "attack" &&
            (defenderMove === "heal" || defenderMove === "kick")
        ) {
            // Full damage, defender's heal or kick does nothing
        } else if (
            attackerConfig.type === "attack" &&
            (defenderMove === "defend" || defenderMove === "parry")
        ) {
            result.damage = 0;
        }

        if (
            attackerConfig.type === "defend" &&
            (defenderMove === "attack" || defenderMove === "parry")
        ) {
            result.damage = 0; // Defender's attack or parry doesn't work
            result.heal = 0; // Defender's heal does not work
        }

        if (
            attackerConfig.type === "heal" &&
            (defenderMove === "defend" || defenderMove === "parry")
        ) {
            result.heal =
                (attackerConfig.baseHeal || 0) +
                (attackerConfig.powerBarModifier || 0) * attacker.powerBar; // Full heal
            result.damage = 0;
        }

        if (
            attackerConfig.type === "kick" &&
            (defenderMove === "defend" || defenderMove === "heal")
        ) {
            // Full damage, defender's heal doesn't work
        } else if (
            attackerConfig.type === "kick" &&
            defenderMove !== "defend" &&
            defenderMove !== "heal"
        ) {
            result.damage = 0;
        }

        if (
            attackerConfig.type === "parry" &&
            (defenderMove === "attack" || defenderMove === "kick")
        ) {
            result.damage = 0;
        } else if (attackerConfig.type === "parry") {
            result.damage = 0;
        }

        // Apply resource gain and cooldowns
        if (interaction.resourceGain) {
            result.resourceGain = interaction.resourceGain;
        }
        if (interaction.cooldown) {
            result.cooldown = interaction.cooldown;
        }
    }

    return result;
}

function calculateFinalDamage(
    baseDamage: number,
    defenderConfig: MoveConfig
): number {
    if (defenderConfig.type === "block") {
        return Math.max(0, baseDamage - (defenderConfig.baseDefense || 0));
    }
    return baseDamage;
}

function regenerateResources(player: Player, resources: ResourceConfig): void {
    if (resources[player.resourceType]) {
        player.currentResource += resources[player.resourceType].regenPerTurn;
    }
}
