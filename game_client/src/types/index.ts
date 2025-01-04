// Position type for 2D coordinates
export interface Position {
    x: number;
    y: number;
}

// Agent type for individual agents in the game
export interface Agent {
    id: string;
    team: 'red' | 'blue'; // Team affiliation
    position: Position; // Current position
    health: number; // Health percentage (0-100)
    target_id?: string; // Current target (optional)
    customBehavior?: string; // ID of custom behavior assigned
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

// WorldState type for the game world configuration
export interface WorldState {
    walls: WorldObject[]; // Array of walls
    holes: WorldObject[]; // Array of holes
    colines: WorldObject[]; // Array of colines (custom objects)
}

// StateUpdate type for syncing state between frontend and backend
export interface StateUpdate {
    timestamp: number; // Time of the update
    agents: Agent[]; // List of agents
    stats: GameStats; // Current game stats
    world?: WorldState; // Current world state (optional)
}
