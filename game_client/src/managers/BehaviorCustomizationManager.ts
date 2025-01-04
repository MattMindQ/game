import { StateManager } from './StateManager';
import { GameConnection } from '../network/socket';
import { BehaviorType, CustomBehavior, BehaviorContext } from '../types';

export class BehaviorCustomizationManager {
    private stateManager: StateManager;
    private gameConnection: GameConnection;

    constructor(stateManager: StateManager, gameConnection: GameConnection) {
        this.stateManager = stateManager;
        this.gameConnection = gameConnection;

        // Setup event listeners for UI elements
        this.setupUIHandlers();
    }

    private setupUIHandlers(): void {
        // Fetch behaviors when agent is selected
        this.stateManager.subscribe('selectedAgent', (agent) => {
            if (agent) {
                this.fetchAgentBehavior(agent.id);
            }
        });

        // Save custom behavior
        const saveButton = document.getElementById('saveCustomBehavior') as HTMLButtonElement;
        saveButton?.addEventListener('click', () => this.saveCustomBehavior());
    }

    private async fetchAgentBehavior(agentId: string): Promise<void> {
        // Fetch current behavior and available behaviors from backend
        const agentBehavior = await this.gameConnection.fetchAgentBehavior(agentId);
        const availableBehaviors = await this.gameConnection.fetchAvailableBehaviors();

        // Update state
        this.stateManager.setAgentBehaviorContext(agentBehavior);
        this.stateManager.setAvailableBehaviors(availableBehaviors);

        // Update UI
        this.renderBehaviorList(availableBehaviors);
        this.renderAgentBehavior(agentBehavior);
    }

    private saveCustomBehavior(): void {
        const customBehaviorCode = (document.getElementById('customBehaviorEditor') as HTMLTextAreaElement)?.value;

        const selectedAgent = this.stateManager.getSelectedAgent();
        if (!selectedAgent || !customBehaviorCode) return;

        // Send the custom behavior to backend
        this.gameConnection.applyCustomBehavior(selectedAgent.id, customBehaviorCode);
    }

    private renderBehaviorList(behaviors: CustomBehavior[]): void {
        const behaviorList = document.getElementById('behaviorList');
        if (!behaviorList) return;

        behaviorList.innerHTML = '';
        behaviors.forEach((behavior) => {
            const behaviorItem = document.createElement('div');
            behaviorItem.className = 'bg-gray-700 rounded p-2 cursor-pointer hover:bg-gray-600';
            behaviorItem.textContent = behavior.name;
            behaviorItem.addEventListener('click', () => this.applyBehaviorToAgent(behavior.id));
            behaviorList.appendChild(behaviorItem);
        });
    }

    private renderAgentBehavior(context: BehaviorContext): void {
        const behaviorElement = document.getElementById('agentBehavior');
        if (!behaviorElement) return;

        behaviorElement.innerHTML = `
            <p class="text-white">Current Behavior: ${context.current_behavior}</p>
        `;
    }

    private applyBehaviorToAgent(behaviorId: string): void {
        const selectedAgent = this.stateManager.getSelectedAgent();
        if (!selectedAgent) return;

        this.gameConnection.assignBehaviorToAgent(selectedAgent.id, behaviorId);
    }
}
