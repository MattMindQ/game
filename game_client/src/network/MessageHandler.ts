// src/network/MessageHandler.ts
import { StateManager } from '../managers/StateManager';
import { NotificationService } from './NotificationService';
import {
    GameStateMessage,
    GameUpdateMessage,
    StateUpdateMessage,
    BehaviorUpdateResponse,
} from './types';

export class MessageHandler {
    constructor(private stateManager: StateManager) {}

    public handleGameUpdate(data: GameUpdateMessage): void {
        const agentManager = this.stateManager.getAgentManager();
        const worldManager = this.stateManager.getWorldManager();

        agentManager.updateAgents(data.agents);
        if (data.stats) {
            agentManager.updateTeamCounts({
                red: data.stats.red_agents,
                blue: data.stats.blue_agents,
            });
        }
        if (data.world) {
            worldManager.updateWorldState(data.world);
        }
    }

    public handleGameState(state: GameStateMessage): void {
        const agentManager = this.stateManager.getAgentManager();
        const worldManager = this.stateManager.getWorldManager();

        this.stateManager.setGameRunning(state.is_running);

        if (state.world) {
            worldManager.updateWorldState(state.world);
        }

        if (state.team_counts) {
            agentManager.updateTeamCounts(state.team_counts);
        }

        this.updateGameButton(state.is_running);
    }

    public handleStateUpdate(data: StateUpdateMessage): void {
        const agentManager = this.stateManager.getAgentManager();
        const worldManager = this.stateManager.getWorldManager();
        const behaviorManager = this.stateManager.getBehaviorManager();
        const combatManager = this.stateManager.getCombatManager();

        // Update agents
        if (data.agents) {

            agentManager.updateAgents(data.agents);
        }

        // Update world
        if (data.world) {
            worldManager.updateWorldState(data.world);
        }

        // Update behaviors
        if (data.behaviors) {
            behaviorManager.updateBehaviors(data.behaviors);
        }

        // Update combat state
        if (data.combat) {
            combatManager.updateCombatState(data.combat);
        }

        console.log('State update applied:', data);
    }

    public handleCombatEvent(data: { kills: Array<{ killer_team: string; victim_team: string }> }): void {
        const combatManager = this.stateManager.getCombatManager();

        data.kills.forEach((kill) => {
            combatManager.recordKill(kill.killer_team, kill.victim_team);
            NotificationService.show(
                `${kill.killer_team} team killed an agent from ${kill.victim_team} team`,
                'info'
            );
        });
    }

    public handleBehaviorUpdate(data: BehaviorUpdateResponse): void {
        const behaviorManager = this.stateManager.getBehaviorManager();

        if (data.status === 'success') {
            behaviorManager.setBehavior(data.agent_id, data.behavior_id || 'DEFAULT');
            NotificationService.show(
                `Behavior updated for agent ${data.agent_id.slice(0, 6)}...`,
                'success'
            );
        } else {
            NotificationService.show(data.message || 'Failed to update behavior', 'error');
        }
    }

    private updateGameButton(isRunning: boolean): void {
        const toggleButton = document.getElementById('toggleGameButton');
        if (toggleButton) {
            toggleButton.textContent = isRunning ? 'Pause' : 'Start';
            toggleButton.classList.toggle('bg-green-600', !isRunning);
            toggleButton.classList.toggle('bg-yellow-600', isRunning);
        }
    }
}
