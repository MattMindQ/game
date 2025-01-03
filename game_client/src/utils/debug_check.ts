// src/debug/debug_check.ts

import { StateManager } from '../managers/StateManager';

export class DebugManager {
    private stateManager: StateManager;
    private debugContainer: HTMLElement | null;
    private selectedAgentElement: HTMLElement | null;
    private mousePositionElement: HTMLElement | null;
    private lastBroadcast: any = null;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        this.debugContainer = document.getElementById('debugInfo');
        this.selectedAgentElement = document.getElementById('selectedAgent');
        this.mousePositionElement = document.getElementById('mousePosition');
        this.initializeDebugPanel();
    }

    private initializeDebugPanel(): void {
        if (!this.debugContainer) return;

        // Create state check elements
        const stateCheckContainer = document.createElement('div');
        stateCheckContainer.className = 'mt-4';

        // Add check state button
        const checkStateButton = document.createElement('button');
        checkStateButton.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm w-full';
        checkStateButton.textContent = 'Check State';
        checkStateButton.onclick = () => this.checkState();

        // Create state output container
        const stateOutputContainer = document.createElement('div');
        stateOutputContainer.className = 'bg-gray-700 rounded p-2 mt-2 hidden';
        stateOutputContainer.id = 'stateOutput';
        stateOutputContainer.innerHTML = `
            <div class="space-y-2">
                <div>
                    <p class="text-sm text-gray-400">Current State:</p>
                    <pre id="currentStateDebug" class="text-white font-mono text-xs overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-words"></pre>
                </div>
                <div class="mt-2">
                    <p class="text-sm text-gray-400">Last Broadcast:</p>
                    <pre id="lastBroadcastDebug" class="text-white font-mono text-xs overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-words"></pre>
                </div>
            </div>
        `;

        // Append elements
        stateCheckContainer.appendChild(checkStateButton);
        stateCheckContainer.appendChild(stateOutputContainer);
        this.debugContainer.appendChild(stateCheckContainer);

        // Initialize mouse position tracking
        this.initializeMouseTracking();
    }

    private initializeMouseTracking(): void {
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!canvas || !this.mousePositionElement) return;

        canvas.addEventListener('mousemove', (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.updateMousePosition(Math.round(x), Math.round(y));
        });

        canvas.addEventListener('mouseleave', () => {
            this.updateMousePosition(0, 0);
        });
    }

    private updateMousePosition(x: number, y: number): void {
        if (this.mousePositionElement) {
            this.mousePositionElement.textContent = `x: ${x}, y: ${y}`;
        }
    }

    public updateSelectedAgent(agentId: string | null): void {
        if (this.selectedAgentElement) {
            this.selectedAgentElement.textContent = agentId || 'None';
        }
    }

    private checkState(): void {
        const stateOutput = document.getElementById('stateOutput');
        if (!stateOutput) return;

        // Show the output container
        stateOutput.classList.remove('hidden');

        // Get current state
        const currentState = {
            agents: this.stateManager.getAgents(),
            selectedAgent: this.stateManager.getSelectedAgent(),
            stats: this.stateManager.getStats(),
            config: this.stateManager.getActiveConfig(),
            isRunning: this.stateManager.isGameRunning()
        };

        // Update displays
        const currentStateElement = document.getElementById('currentStateDebug');
        const lastBroadcastElement = document.getElementById('lastBroadcastDebug');

        if (currentStateElement) {
            currentStateElement.textContent = this.formatDebugData(currentState);
        }

        if (lastBroadcastElement) {
            lastBroadcastElement.textContent = this.formatDebugData(this.lastBroadcast);
        }
    }

    private formatDebugData(data: any): string {
        try {
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return 'Unable to format data';
        }
    }

    public updateBroadcastData(data: any): void {
        this.lastBroadcast = data;
        // If state output is visible, update it immediately
        const stateOutput = document.getElementById('stateOutput');
        if (stateOutput && !stateOutput.classList.contains('hidden')) {
            const lastBroadcastElement = document.getElementById('lastBroadcastDebug');
            if (lastBroadcastElement) {
                lastBroadcastElement.textContent = this.formatDebugData(data);
            }
        }
    }
}