// src/types/index.ts
export interface Position {
    x: number;
    y: number;
}

export interface Agent {
    id: string;
    team: 'red' | 'blue';
    position: Position;
    health: number;
    target_id?: string;
    customBehavior?: string;  // Added to track custom behavior
    velocity?: Position;
    rotation?: number;
}

export interface GameStats {
    fps: number;
    red_agents: number;
    blue_agents: number;
    red_kills: number;
    blue_kills: number;
    total_deaths: number;
}

export interface WorldObject {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface WorldState {
    walls: WorldObject[];
    holes: WorldObject[];
    colines: WorldObject[];
    // ... etc.
}

export interface Wall {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface WorldState {
    walls: Wall[];
    holes: any[];  // Define proper type if needed
    colines: any[];  // Define proper type if needed
}

// Update your existing StateUpdate interface if you have one
export interface StateUpdate {
    timestamp: number;
    agents: Agent[];
    stats: GameStats;
    world?: WorldState;
}