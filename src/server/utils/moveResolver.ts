import moveOutcomes from "./moveOutcomes.json" assert { type: "json" };
import { Player, Effect, MoveConfig, ResourceConfig } from '../../types';


export function resolveMoves(player1: Player, player2: Player): void {
    const move1: string | null | undefined = player1.move;
    const move2: string | null | undefined = player2.move;


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
    const p1Effect: Effect = calculateEffect(moveOutcomes.moves[move1 as string], move2, player1);
    const p2Effect: Effect = calculateEffect(moveOutcomes.moves[move2 as string], move1, player2);


    // Apply damage with defense consideration
    player2.hp -= calculateFinalDamage(
        p1Effect.damage,
        moveOutcomes.moves[move2 as string]
    );
    player1.hp += p1Effect.heal;

    player1.hp -= calculateFinalDamage(
        p2Effect.damage,
        moveOutcomes.moves[move1 as string]
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

     console.log("Attacker Config:", attackerConfig);
    console.log("Attacker PowerBar:", attacker.powerBar);
     console.log("Base Damage:", attackerConfig.baseDamage);
    console.log("Power Bar Modifier:", attackerConfig.powerBarModifier);
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


    // Apply interactions
    const interaction = attackerConfig.interactions?.[defenderMove as string];
    if (interaction) {
        result.damage *= interaction.damageModifier || 1;
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
