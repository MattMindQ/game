// Position type for 2D coordinates
export interface Position {
    x: number;
    y: number;
}

export interface Agent {
    id: string;
    team: 'red' | 'blue'; // Team affiliation
    position: Position; // Current position
    health: number; // Health percentage (0-100)
    target_id?: string; // Current target (optional)
    behavior?: string; // Behavior ID assigned to the agent
    velocity?: Position; // Velocity vector (optional)
    rotation?: number; // Rotation angle in degrees (optional)
}

// CustomBehavior type for behaviors created by the player
export interface CustomBehavior {
    id: string;
    name: string; // Display name of the behavior
    code: string; // Behavior logic as a string
}

// GameStats type for real-time game statistics
export interface GameStats {
    fps: number; // Frames per second
    red_agents: number; // Count of red team agents
    blue_agents: number; // Count of blue team agents
    red_kills: number; // Total kills by red team
    blue_kills: number; // Total kills by blue team
    total_deaths: number; // Total deaths in the game
}

// General object type for in-game world elements (e.g., walls, holes)
export interface WorldObject {
    name: string; // Identifier
    x: number; // X position
    y: number; // Y position
    width: number; // Width of the object
    height: number; // Height of the object
}

export interface WorldState {
    walls: WorldObject[]; // Array of walls
    holes: WorldObject[]; // Array of holes
    colines: WorldObject[]; // Array of colines (custom objects)
    bounds?: [number, number, number, number]; // Optional bounds for the world
}

// GameConfig type for game configuration
export interface GameConfig {
    parameters: { [key: string]: any }; // Parameters for the game configuration
    name: string; // Config name
    description?: string; // Optional description
}

// BehaviorState type for tracking behaviors
export interface BehaviorState {
    behaviors: Record<string, string>; // Agent ID to behavior mapping
    timers: Record<string, number>; // Timers per agent
    awareness: Record<string, any>; // Awareness zones
}

// CombatState type for tracking combat events
export interface CombatState {
    stats?: GameStats;
    dead_agents?: string[];
    recent_kills?: { killer: string; victim: string }[];
}


// StateUpdate type for syncing state between frontend and backend
export interface StateUpdate {
    timestamp: number; // Time of the update
    agents?: { [id: string]: Agent }; // List of agents (dictionary format)
    stats?: GameStats; // Current game stats
    world?: WorldState; // Current world state (optional)
    behaviors?: BehaviorState; // Current behavior state (optional)
    combat?: CombatState; // Current combat state (optional)
}
