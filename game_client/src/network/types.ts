// gameserver/src/network/types.ts
export interface GameStateMessage {
    is_running: boolean;
    world?: WorldState;
    team_counts?: {
        red: number;
        blue: number;
    };
    stats?: GameStats;
    timestamp?: number;
    config?: GameConfig | null;
    behaviors?: BehaviorState; // Include optional behaviors property
    user?: {
        id: string | null;
        is_default: boolean;
    };
}


export interface GameUpdateMessage {
    agents: { [id: string]: Agent }; // Use a dictionary for agent updates
    stats?: GameStats;
    world?: WorldState;
}

export interface StateUpdateMessage {
    agents?: { [id: string]: Partial<Agent> }; // Partial updates for agents
    world?: Partial<WorldState>; // Partial updates for the game world
    behaviors?: {
        behaviors: { [id: string]: string }; // Agent ID to behavior mapping
        timers: { [id: string]: number }; // Behavior timers
        awareness: Record<string, any>; // Awareness zones (extend as needed)
    };
    combat?: {
        stats: GameStats;
        dead_agents: string[]; // List of agent IDs
        recent_kills: { killer: string; victim: string }[]; // Kill events
    };
    timestamp?: number; // Optional timestamp
}


export interface LLMQuery {
    query: string;
    context: string;
    conversationId: string;
}

export interface LLMResponse {
    conversationId: string;
    response: string;
}

export interface LLMError {
    conversationId: string;
    error: string;
}

export interface BehaviorUpdateResponse {
    agent_id: string;
    status: string;
    message?: string;
}

export type NotificationType = 'success' | 'error' | 'info';

export interface WebSocketCommand {
    type: string;
    [key: string]: any;
}
