// src/constants/events.ts

export interface GameState {
    isRunning: boolean;
}

export interface TeamCounts {
    red: number;
    blue: number;
}

// Define types for each event
export type UIEventPayloads = {
    'ui:mouse:move': { x: number; y: number };
    'ui:mouse:down': { x: number; y: number };
    'ui:mouse:up': { x: number; y: number };
    'ui:key:down': string;
    'ui:agent:selected': string;
    'ui:agent:deselected': null;
    'ui:behavior:updated': { agentId: string; behavior: any };
    'ui:config:updated': any;
    'ui:resize': void;
}

export type StateEventPayloads = {
    'state:game:changed': GameState;
    'state:connection:changed': 'connected' | 'disconnected' | 'error';
    'state:agents:updated': any[];
    'state:stats:updated': any;
    'state:config:loaded': any;
    'state:selected_agent:changed': any;
}

export type SocketEventPayloads = {
    'socket:message:received': any;
    'socket:connection:opened': void;
    'socket:connection:closed': void;
    'socket:connection:error': Error;
    'socket:command:sent': any;
    'socket:game:update': any;
    'socket:game:state': any;
    'socket:combat:event': any;
    'socket:behavior:update': any;
    'socket:llm:response': any;
    'socket:llm:error': any;
}

export const UI_EVENTS = {
    MOUSE_MOVE: 'ui:mouse:move',
    MOUSE_DOWN: 'ui:mouse:down',
    MOUSE_UP: 'ui:mouse:up',
    KEY_DOWN: 'ui:key:down',
    AGENT_SELECTED: 'ui:agent:selected',
    AGENT_DESELECTED: 'ui:agent:deselected',
    BEHAVIOR_UPDATED: 'ui:behavior:updated',
    CONFIG_UPDATED: 'ui:config:updated',
    RESIZE: 'ui:resize',
} as const;

export const STATE_EVENTS = {
    GAME_STATE_CHANGED: 'state:game:changed',
    CONNECTION_STATUS_CHANGED: 'state:connection:changed',
    AGENTS_UPDATED: 'state:agents:updated',
    STATS_UPDATED: 'state:stats:updated',
    CONFIG_LOADED: 'state:config:loaded',
    SELECTED_AGENT_CHANGED: 'state:selected_agent:changed',
} as const;

export const SOCKET_EVENTS = {
    MESSAGE_RECEIVED: 'socket:message:received',
    CONNECTION_OPENED: 'socket:connection:opened',
    CONNECTION_CLOSED: 'socket:connection:closed',
    CONNECTION_ERROR: 'socket:connection:error',
    COMMAND_SENT: 'socket:command:sent',
    GAME_UPDATE: 'socket:game:update',
    GAME_STATE: 'socket:game:state',
    COMBAT_EVENT: 'socket:combat:event',
    BEHAVIOR_UPDATE: 'socket:behavior:update',
    LLM_RESPONSE: 'socket:llm:response',
    LLM_ERROR: 'socket:llm:error',
} as const;

// Type-safe event emitter helper
export const emit = <T extends keyof UIEventPayloads | keyof StateEventPayloads | keyof SocketEventPayloads>(
    event: T,
    payload: T extends keyof UIEventPayloads 
        ? UIEventPayloads[T] 
        : T extends keyof StateEventPayloads 
            ? StateEventPayloads[T]
            : T extends keyof SocketEventPayloads 
                ? SocketEventPayloads[T] 
                : never
) => {
    EventBus.emit(event, payload);
};