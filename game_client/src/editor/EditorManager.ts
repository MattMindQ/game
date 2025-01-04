// src/editor/EditorManager.ts

import { setupMonacoEditor } from './setup';
import { StateManager } from '../managers/StateManager';
import { Agent } from './types';

export class EditorManager {
    private editor: any | null = null;
    private stateManager: StateManager;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }

    public async initialize(): Promise<void> {
        try {
            this.editor = await setupMonacoEditor();
            this.setupEditorEvents();
        } catch (error) {
            console.error('Failed to initialize code editor:', error);
            throw error;
        }
    }

    public getEditor(): any {
        return this.editor;
    }

    private setupEditorEvents(): void {
        this.stateManager.subscribe('selectedAgent', (agent) => {
            const editorStatus = document.getElementById('editorStatus');

            if (agent) {
                if (editorStatus) editorStatus.textContent = `Selected agent ${agent.id.slice(0, 6)}...`;
                
                if (this.editor) {
                    this.editor.setValue(this.formatBehaviorInfo(agent));
                }
            } else {
                if (editorStatus) editorStatus.textContent = 'No agent selected';
                if (this.editor) {
                    this.editor.setValue('');
                }
            }
        });
    }

    private formatBehaviorInfo(agent: Agent): string {
        return `# Agent ${agent.id} Information
Team: ${agent.team}
Current Behavior: ${agent.currentBehavior || 'Unknown'}
Health: ${agent.health}%

# Current State
Position: (${Math.round(agent.position.x)}, ${Math.round(agent.position.y)})
Target ID: ${agent.target_id || 'None'}
`;
    }

    public updateContent(content: string): void {
        if (this.editor) {
            this.editor.setValue(content);
        }
    }

    public getContent(): string {
        return this.editor ? this.editor.getValue() : '';
    }

    public layout(): void {
        if (this.editor) {
            this.editor.layout();
        }
    }
}