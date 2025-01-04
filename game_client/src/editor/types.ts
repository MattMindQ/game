// src/editor/types.ts

export interface Agent {
    id: string;
    team: string;
    currentBehavior?: string;
    health: number;
    position: {
        x: number;
        y: number;
    };
    target_id?: string;
}

export interface EditorState {
    selectedAgent: Agent | null;
    content: string;
}