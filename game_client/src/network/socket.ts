// src/network/socket.ts
import { StateManager } from '../managers/StateManager';
import { DebugManager } from '../debug/debug_check';
import { Agent, GameStats, WorldState } from '../types';

// Interface for game state message
interface GameStateMessage {
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

// Interface for game update message
interface GameUpdateMessage {
    agents: Agent[];
    stats?: GameStats;
    world?: WorldState;
}

export class GameConnection {
    private socket: WebSocket;
    private stateManager: StateManager;
    private debugManager: DebugManager | null = null;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        this.socket = new WebSocket('ws://localhost:8000/ws');
        this.setupSocketHandlers();
        this.setupUIHandlers();
    }

    public setDebugManager(debugManager: DebugManager) {
        this.debugManager = debugManager;
    }

    private setupSocketHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            // Update debug manager with latest message
            if (this.debugManager) {
                this.debugManager.updateBroadcastData({
                    timestamp: new Date().toISOString(),
                    type: message.type,
                    data: message.data
                });
            }
            
            switch (message.type) {
                case 'game_update':
                    this.handleGameUpdate(message.data);
                    break;
                    
                case 'position_update':
                    this.handlePositionUpdate(message.data);
                    break;
                    
                case 'combat_event':
                    this.handleCombatEvent(message.data);
                    break;
                    
                case 'game_state':
                    this.handleGameStateUpdate(message.data);
                    break;
                    
                case 'team_update':
                    this.handleTeamUpdate(message.data);
                    break;

                case 'behavior_update':
                    this.handleBehaviorUpdateResponse(message.data);
                    break;

                case 'llm_response':
                    this.handleLLMResponse(message.data);
                    break;
                
                case 'llm_error':
                    this.handleLLMError(message.data);
                    break;
            }
        };

        this.socket.onopen = () => {
            this.stateManager.setConnectionStatus('connected');
            this.showNotification('Connected to server', 'success');
        };

        this.socket.onclose = () => {
            this.stateManager.setConnectionStatus('disconnected');
            this.stateManager.setGameRunning(false);
            this.showNotification('Disconnected from server', 'error');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.stateManager.setConnectionStatus('error');
            this.showNotification('Connection error', 'error');
        };
    }

    private showNotification(message: string, type: 'success' | 'error' | 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white transition-opacity duration-500
            ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    private handleLLMResponse(data: LLMResponse) {
        document.dispatchEvent(new CustomEvent('llmResponse', { 
            detail: data 
        }));
    }
    
    private handleLLMError(data: LLMError) {
        this.showNotification(
            `LLM Error: ${data.error}`,
            'error'
        );
        document.dispatchEvent(new CustomEvent('llmError', { 
            detail: data 
        }));
    }

    // Update handleGameUpdate to ensure world state is handled
    private handleGameUpdate(data: { 
        agents: Agent[], 
        stats?: any, 
        world?: WorldState 
    }) {
        this.stateManager.updateSimulationState(
            data.agents,
            data.stats,
            data.world
        );
    }

    private handlePositionUpdate(data: { agents: any[] }) {
        this.stateManager.updateSimulationState(data.agents);
    }

    // Update handleGameStateUpdate to include world state
    private handleGameStateUpdate(state: { 
        is_running: boolean,
        world?: WorldState,
        team_counts?: { red: number, blue: number },
        stats?: any
    }) {
        // Update game running state
        this.stateManager.setGameRunning(state.is_running);
        
        // Update world state if present
        if (state.world) {
            this.stateManager.updateSimulationState(
                [], // No agents to update
                state.stats,
                state.world
            );
        }

        // Update team counts if present
        if (state.team_counts) {
            this.stateManager.updateTeamCounts(state.team_counts);
        }
            
        // Update button state
        const toggleButton = document.getElementById('toggleGameButton');
        if (toggleButton) {
            if (state.is_running) {
                toggleButton.textContent = 'Pause';
                toggleButton.classList.remove('bg-green-600', 'hover:bg-green-700');
                toggleButton.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
            } else {
                toggleButton.textContent = 'Start';
                toggleButton.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
                toggleButton.classList.add('bg-green-600', 'hover:bg-green-700');
            }
        }
    }

    private handleCombatEvent(data: { kills: Array<{ killer_team: string, victim_team: string }> }) {
        if (data.kills) {
            data.kills.forEach(kill => {
                this.showNotification(
                    `${kill.killer_team} team killed an agent from ${kill.victim_team} team`,
                    'info'
                );
            });
        }
    }

    private handleTeamUpdate(counts: { red: number, blue: number }) {
        this.stateManager.updateTeamCounts(counts);
    }

    private handleBehaviorUpdateResponse(data: { agent_id: string, status: string, message?: string }) {
        const { agent_id, status, message } = data;
        
        if (status === 'success') {
            this.showNotification(
                `Behavior updated for agent ${agent_id.slice(0, 6)}...`,
                'success'
            );
        } else {
            this.showNotification(
                message || 'Failed to update behavior',
                'error'
            );
        }
    }

    private setupUIHandlers() {
        this.setupGameControls();
        this.setupTeamControls();
    }

    private setupGameControls() {
        const toggleButton = document.getElementById('toggleGameButton');
        const resetButton = document.getElementById('resetButton');
        
        toggleButton?.addEventListener('click', () => {
            this.sendCommand({ type: 'toggle_game' });
        });

        resetButton?.addEventListener('click', () => {
            this.sendCommand({ type: 'reset_game' });
            if (toggleButton) {
                toggleButton.textContent = 'Start';
                toggleButton.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
                toggleButton.classList.add('bg-green-600', 'hover:bg-green-700');
            }
        });
    }

    private setupTeamControls() {
        document.getElementById('addRedAgent')?.addEventListener('click', () => {
            this.sendCommand({ type: 'add_agent', team: 'red' });
        });

        document.getElementById('addBlueAgent')?.addEventListener('click', () => {
            this.sendCommand({ type: 'add_agent', team: 'blue' });
        });
    }

    public applyCustomBehavior(agentId: string, code: string): void {
        this.sendCommand({
            type: 'update_custom_behavior',
            agent_id: agentId,
            code: code
        });
    }

    public sendLLMQuery(query: string, context: any, conversationId: string): void {
        this.sendCommand({
            type: 'llm_query',
            data: {
                query,
                context: typeof context === 'string' ? context : JSON.stringify(context),
                conversationId
            }
        });
    }

    private sendCommand(command: any) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(command));
        } else {
            console.warn('WebSocket is not connected');
            this.showNotification('Not connected to server', 'error');
        }
    }
}

interface LLMQuery {
    query: string;
    context: string;
    conversationId: string;
}

interface LLMResponse {
    conversationId: string;
    response: string;
}

interface LLMError {
    conversationId: string;
    error: string;
}