// src/components/debug/DebugPanel.ts

export class DebugPanel {
    private debugContainer: HTMLElement;
    private lastBroadcast: any = null;
    private currentState: any = null;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        // Get the debug info container
        const debugInfo = document.getElementById('debugInfo');
        if (!debugInfo) {
            console.error('Debug info container not found');
            return;
        }

        // Create debug controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'mt-4 space-y-2';
        
        // Add check state button
        const checkStateButton = document.createElement('button');
        checkStateButton.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm w-full';
        checkStateButton.textContent = 'Check State';
        checkStateButton.onclick = () => this.checkState();
        
        // Create debug output container
        this.debugContainer = document.createElement('div');
        this.debugContainer.className = 'bg-gray-700 rounded p-2 mt-2 hidden';
        this.debugContainer.innerHTML = `
            <div class="space-y-2">
                <div>
                    <p class="text-sm text-gray-400">Current State:</p>
                    <pre id="currentStateDebug" class="text-white font-mono text-xs overflow-x-auto max-h-40 overflow-y-auto"></pre>
                </div>
                <div>
                    <p class="text-sm text-gray-400">Last Broadcast:</p>
                    <pre id="lastBroadcastDebug" class="text-white font-mono text-xs overflow-x-auto max-h-40 overflow-y-auto"></pre>
                </div>
            </div>
        `;

        // Append elements
        controlsContainer.appendChild(checkStateButton);
        debugInfo.appendChild(controlsContainer);
        debugInfo.appendChild(this.debugContainer);
    }

    public updateState(state: any): void {
        this.currentState = state;
    }

    public updateBroadcast(broadcast: any): void {
        this.lastBroadcast = broadcast;
    }

    private checkState(): void {
        this.debugContainer.classList.remove('hidden');
        
        // Update current state display
        const currentStateElement = document.getElementById('currentStateDebug');
        if (currentStateElement) {
            currentStateElement.textContent = this.formatDebugData(this.currentState);
        }

        // Update last broadcast display
        const lastBroadcastElement = document.getElementById('lastBroadcastDebug');
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
}