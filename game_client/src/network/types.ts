// src/network/types.ts

export interface GameStateMessage {
    is_running: boolean;
    world?: WorldState;
    team_counts?: {
        red: number;
        blue: number;
    };
    stats?: GameStats;
    timestamp?: number;
    config?: any;
    user?: {
        id: string | null;
        is_default: boolean;
    };
}

export interface GameUpdateMessage {
    agents: Agent[];
    stats?: GameStats;
    world?: WorldState;
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