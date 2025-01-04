// src/network/MessageHandler.ts

import { StateManager } from '../managers/StateManager';
import { NotificationService } from './NotificationService';
import { GameStateMessage, GameUpdateMessage, BehaviorUpdateResponse } from './types';

export class MessageHandler {
    constructor(private stateManager: StateManager) {}

    public handleGameUpdate(data: GameUpdateMessage): void {
        this.stateManager.updateSimulationState(
            data.agents,
            data.stats,
            data.world
        );
    }

    public handleGameState(state: GameStateMessage): void {
        this.stateManager.setGameRunning(state.is_running);
        
        if (state.world) {
            this.stateManager.updateSimulationState(
                [], 
                state.stats,
                state.world
            );
        }

        if (state.team_counts) {
            this.stateManager.updateTeamCounts(state.team_counts);
        }

        this.updateGameButton(state.is_running);
    }

    public handleCombatEvent(data: { kills: Array<{ killer_team: string, victim_team: string }> }): void {
        data.kills.forEach(kill => {
            NotificationService.show(
                `${kill.killer_team} team killed an agent from ${kill.victim_team} team`,
                'info'
            );
        });
    }

    public handleBehaviorUpdate(data: BehaviorUpdateResponse): void {
        if (data.status === 'success') {
            NotificationService.show(
                `Behavior updated for agent ${data.agent_id.slice(0, 6)}...`,
                'success'
            );
        } else {
            NotificationService.show(
                data.message || 'Failed to update behavior',
                'error'
            );
        }
    }

    private updateGameButton(isRunning: boolean): void {
        const toggleButton = document.getElementById('toggleGameButton');
        if (toggleButton) {
            toggleButton.textContent = isRunning ? 'Pause' : 'Start';
            toggleButton.classList.remove(
                isRunning ? 'bg-green-600' : 'bg-yellow-600',
                isRunning ? 'hover:bg-green-700' : 'hover:bg-yellow-700'
            );
            toggleButton.classList.add(
                isRunning ? 'bg-yellow-600' : 'bg-green-600',
                isRunning ? 'hover:bg-yellow-700' : 'hover:bg-green-700'
            );
        }
    }
}