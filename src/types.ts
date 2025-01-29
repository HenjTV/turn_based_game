import { ServerWebSocket } from 'bun';

export interface Player {
    ws: ServerWebSocket;
    name: string;
    character: string | null;
    hp: number;
    maxHp: number;
    currentResource: number;
    maxResource: number;
    breakroundleftheal: number;
    breakroundleftdefence: number;
    powerBar: number;
    move?: string | null;
    resourceType: string;
}
export interface Players {
    currentPlayer: Player;
    opponent: Player;
}

export interface MoveConfig {
    type: string;
    baseDamage?: number;
    baseDefense?: number;
    baseHeal?: number;
    powerBarModifier?: number;
    interactions?: {
        [key: string]: {
             damageModifier?: number;
             resourceGain?: { [key: string]: number };
             cooldown?: { breakDefense?: number; breakHeal?: number };
        }
    }
}


export interface Effect {
    damage: number;
    heal: number;
    resourceGain: { [key: string]: number };
    cooldown: { breakDefense?: number; breakHeal?: number };
}

export interface ResourceConfig {
    [key: string]: {
        regenPerTurn: number;
    }
}

export interface GameState {
    playerName: string;
    lobbyId: string;
    currentTurn: string;
    isMyTurn: boolean;
    selectedCharacter: string | null;
    statsConfig: any;
    currentResource: number;
    maxResource: number;
    resourceType: string;
    breakroundleftheal: number;
    breakroundleftdefence: number;
    hp: number;
    maxHp: number;
    powerBar: number;
    opponentHp?: number;
    opponentResource?: number;
    opponentPowerBar?: number;
}
