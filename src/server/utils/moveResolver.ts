import moveOutcomes from "./moveOutcomes.json" with { type: "json" };
import { Player, Effect, MoveConfig, ResourceConfig, MoveKey} from '../../types';


export function resolveMoves(player1: Player, player2: Player): void {
    const move1: MoveKey | null | undefined = player1.move as MoveKey | null | undefined;
    const move2: MoveKey | null | undefined = player2.move as MoveKey | null | undefined;

    // Decrease resources based on power bar usage
    [player1, player2].forEach(player => {
        player.currentResource -= player.powerBar;
    });

    // Decrease cooldowns
    [player1, player2].forEach(player => {
        if (player.breakroundleftdefence > 0) player.breakroundleftdefence--;
        if (player.breakroundleftheal > 0) player.breakroundleftheal--;
    });

    // Calculate effects for both players
    const p1Effect: Effect = calculateEffect(moveOutcomes.moves[move1 as MoveKey], move2, player1);
    const p2Effect: Effect = calculateEffect(moveOutcomes.moves[move2 as MoveKey], move1, player2);

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

    console.log("HP, resources, moves, effects:", player1.hp, player2.hp, move1, move2, p1Effect, p2Effect);

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
    [player1, player2].forEach(player => regenerateResources(player, moveOutcomes.resources));

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


function calculateEffect(attackerConfig: MoveConfig, defenderMove: string | null | undefined, attacker: Player): Effect {
    const result: Effect = { damage: 0, heal: 0, resourceGain: {}, cooldown: {} };

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

    // Apply interactions based on the new logic
    const interaction = attackerConfig.interactions?.[defenderMove as string];
    if (interaction) {
        // Default damage modifier
        result.damage *= interaction.damageModifier || 1;

        // Special logic for Attack > Heal, Kick
        if (attackerConfig.type === "attack" && (defenderMove === "heal" || defenderMove === "kick")) {
            result.damage = (attackerConfig.baseDamage || 0) + (attackerConfig.powerBarModifier || 0) * attacker.powerBar; // Full damage
            result.heal = 0; // Defender's heal doesn't work
        }

        // Special logic for Defend > Attack, Parry
        if (attackerConfig.type === "defend" && (defenderMove === "attack" || defenderMove === "parry")) {
            result.damage = 0; // Defender's attack or parry doesn't work
        }

        // Special logic for Heal > Defend, Parry
        if (attackerConfig.type === "heal" && (defenderMove === "defend" || defenderMove === "parry")) {
            result.heal = (attackerConfig.baseHeal || 0) + (attackerConfig.powerBarModifier || 0) * attacker.powerBar; // Full heal
            result.damage = 0; // Defender's defend or parry doesn't work
        }

        // Special logic for Kick > Defend, Heal
        if (attackerConfig.type === "kick" && (defenderMove === "defend" || defenderMove === "heal")) {
            result.damage = (attackerConfig.baseDamage || 0) + (attackerConfig.powerBarModifier || 0) * attacker.powerBar; // Full damage
            result.heal = 0; // Defender's heal doesn't work
        }

        // Special logic for Parry > Attack, Kick
        if (attackerConfig.type === "parry" && (defenderMove === "attack" || defenderMove === "kick")) {
            result.damage = (attackerConfig.baseDamage || 0) + (attackerConfig.powerBarModifier || 0) * attacker.powerBar; // Full damage
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


function calculateFinalDamage(baseDamage: number, defenderConfig: MoveConfig): number {
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
