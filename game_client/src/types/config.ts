//src/types/config.ts

export interface GameConfig {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    parameters: {
        // Game Settings
        agentCount: number;
        gameAreaSize: number;
        enableWorldLogic: boolean;
        
        // Combat Settings
        visualRange: number;
        recognitionRange: number;
        combatRange: number;
        baseDamage: number;
        baseHealth: number;
        
        // Movement Settings
        baseSpeed: number;
        turnSpeed: number;
        
        // Behavior Settings
        behaviorUpdateInterval: number;
        maxGroupSize: number;
        flockingDistance: number;
        
        // World Settings
        obstacleCount: number;
        obstacleSize: number;
        boundaryDamage: number;
        
        // Team Settings
        teamBalance: number; // -1 to 1, affects team advantages
        respawnEnabled: boolean;
        respawnTime: number;
    };
}
