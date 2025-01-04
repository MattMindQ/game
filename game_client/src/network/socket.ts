// src/network/socket.ts

import { StateManager } from '../managers/StateManager';
import { DebugManager } from '../debug/debug_check';
import { MessageHandler } from './MessageHandler';
import { NotificationService } from './NotificationService';
import { WebSocketCommand } from './types';

export class GameConnection {
    private socket: WebSocket;
    private messageHandler: MessageHandler;
    private debugManager: DebugManager | null = null;

    constructor(private stateManager: StateManager) {
        this.messageHandler = new MessageHandler(stateManager);
        this.socket = new WebSocket('ws://localhost:8000/ws');
        this.setupSocketHandlers();
        this.setupUIHandlers();
    }

    public setDebugManager(debugManager: DebugManager): void {
        this.debugManager = debugManager;
    }

    private setupSocketHandlers(): void {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (this.debugManager) {
                this.debugManager.updateBroadcastData({
                    timestamp: new Date().toISOString(),
                    type: message.type,
                    data: message.data
                });
            }
            
            this.routeMessage(message);
        };

        this.socket.onopen = () => {
            this.stateManager.setConnectionStatus('connected');
            NotificationService.show('Connected to server', 'success');
        };

        this.socket.onclose = () => {
            this.stateManager.setConnectionStatus('disconnected');
            this.stateManager.setGameRunning(false);
            NotificationService.show('Disconnected from server', 'error');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.stateManager.setConnectionStatus('error');
            NotificationService.show('Connection error', 'error');
        };
    }

    private routeMessage(message: any): void {
        switch (message.type) {
            case 'game_update':
                this.messageHandler.handleGameUpdate(message.data);
                break;
            case 'game_state':
                this.messageHandler.handleGameState(message.data);
                break;
            case 'combat_event':
                this.messageHandler.handleCombatEvent(message.data);
                break;
            case 'behavior_update':
                this.messageHandler.handleBehaviorUpdate(message.data);
                break;
            case 'llm_response':
                document.dispatchEvent(new CustomEvent('llmResponse', { detail: message.data }));
                break;
            case 'llm_error':
                NotificationService.show(`LLM Error: ${message.data.error}`, 'error');
                document.dispatchEvent(new CustomEvent('llmError', { detail: message.data }));
                break;
        }
    }

    private setupUIHandlers(): void {
        this.setupGameControls();
        this.setupTeamControls();
    }

    private setupGameControls(): void {
        document.getElementById('toggleGameButton')?.addEventListener('click', () => {
            this.sendCommand({ type: 'toggle_game' });
        });

        document.getElementById('resetButton')?.addEventListener('click', () => {
            this.sendCommand({ type: 'reset_game' });
        });
    }

    private setupTeamControls(): void {
        document.getElementById('addRedAgent')?.addEventListener('click', () => {
            this.sendCommand({ type: 'add_agent', team: 'red' });
        });

        document.getElementById('addBlueAgent')?.addEventListener('click', () => {
            this.sendCommand({ type: 'add_agent', team: 'blue' });
        });
    }

    public sendCommand(command: WebSocketCommand): void {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(command));
        } else {
            console.warn('WebSocket is not connected');
            NotificationService.show('Not connected to server', 'error');
        }
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
}

