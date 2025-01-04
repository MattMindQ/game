import { BehaviorSlice } from '../state/BehaviorSlice';
import { StateManager } from '../managers/StateManager'; // or RootStore if you have one
import { Agent, CustomBehavior } from '../types';
import { GameConnection } from '../network/socket';

export class BehaviorPanelManager {
  private behaviorListPanel: HTMLDivElement;
  private agentDetailsPanel: HTMLDivElement;
  private customBehaviorEditor: HTMLTextAreaElement;
  private saveCustomBehaviorButton: HTMLButtonElement;

  constructor(
    private behaviorSlice: BehaviorSlice,
    private stateManager: StateManager,
    private gameConnection: GameConnection
  ) {
    // Grab elements from the DOM
    this.behaviorListPanel = document.getElementById('behaviorList') as HTMLDivElement;
    this.agentDetailsPanel = document.getElementById('agentDetails') as HTMLDivElement;
    this.customBehaviorEditor = document.getElementById('customBehaviorEditor') as HTMLTextAreaElement;
    this.saveCustomBehaviorButton = document.getElementById('saveCustomBehavior') as HTMLButtonElement;

    this.setupEventListeners();
    this.renderBehaviorList();
  }

  private setupEventListeners() {
    // Fetch available behaviors when initializing or refreshing
    this.fetchAvailableBehaviors();

    // Save custom behavior
    this.saveCustomBehaviorButton.addEventListener('click', () => {
        const code = this.customBehaviorEditor.value.trim();
        if (!code) return;

        const selectedAgent = this.stateManager.getSelectedAgent();
        if (!selectedAgent) {
            alert('No agent selected.');
            return;
        }

        const behaviorId = `behavior-${Date.now()}`;
        const newBehavior: CustomBehavior = {
            id: behaviorId,
            name: `Custom Behavior ${behaviorId}`,
            code,
        };

        // Add behavior locally and assign it to the agent
        this.behaviorSlice.addOrUpdateBehavior(newBehavior);
        this.behaviorSlice.assignBehaviorToAgent(selectedAgent.id, behaviorId);

        // Send to backend
        this.gameConnection.sendCommand({
            type: 'update_custom_behavior',
            agent_id: selectedAgent.id,
            code,
            behavior_id: behaviorId,
        });

        // Re-render the behavior list
        this.renderBehaviorList();
        alert('Custom behavior saved and assigned to the agent.');
    });

    // Listen for agent selection changes (StateManager subscription)
    this.stateManager.subscribe('selectedAgent', (agent) => {
        this.renderAgentDetails(agent);
    });

    // Listen for backend behavior updates
    document.addEventListener('behavior_update', (event: any) => {
        const data = event.detail;
        if (data.status === 'success') {
            console.log('Behavior updated successfully:', data);
        } else {
            alert(`Error updating behavior: ${data.message}`);
        }
    });
}

/**
 * Fetch available behaviors from the backend.
 */
private fetchAvailableBehaviors() {
    this.gameConnection.sendCommand({ type: 'fetch_behaviors' });
}


    private renderBehaviorList() {
        const behaviors = this.behaviorSlice.getBehaviors();
        this.behaviorListPanel.innerHTML = '';

        behaviors.forEach((behavior) => {
            const div = document.createElement('div');
            div.className = 'bg-gray-700 p-2 rounded';
            div.innerHTML = `
                <span class="text-white text-sm">${behavior.name}</span>
                <button class="ml-2 bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded" data-behavior-id="${behavior.id}">
                    Assign
                </button>
            `;
            div.querySelector('button')?.addEventListener('click', () => {
                const selectedAgent = this.stateManager.getSelectedAgent();
                if (selectedAgent) {
                    this.behaviorSlice.assignBehaviorToAgent(selectedAgent.id, behavior.id);

                    // Send to backend
                    this.gameConnection.sendCommand({
                        type: 'assign_behavior',
                        agent_id: selectedAgent.id,
                        behavior_id: behavior.id,
                    });

                    alert(`Behavior "${behavior.name}" assigned to agent ${selectedAgent.id}.`);
                }
            });
            this.behaviorListPanel.appendChild(div);
        });
    }


  private renderAgentDetails(agent: Agent | null) {
    if (!agent) {
      this.agentDetailsPanel.innerHTML = '<p class="text-gray-400">No agent selected</p>';
      return;
    }

    const currentBehavior = this.behaviorSlice.getAgentBehavior(agent.id);

    this.agentDetailsPanel.innerHTML = `
      <div class="bg-gray-700 rounded p-2">
        <div class="grid grid-cols-2 gap-2 text-sm">
          <span class="text-gray-400">ID:</span>
          <span class="text-white font-mono">${agent.id.slice(0, 8)}</span>
          <span class="text-gray-400">Team:</span>
          <span class="text-white font-mono">${agent.team}</span>
          <span class="text-gray-400">Health:</span>
          <span class="text-white font-mono">${agent.health}%</span>
        </div>
      </div>

      <div class="bg-gray-700 rounded p-2 mt-2">
        <p class="text-sm text-gray-400 mb-2">Current Behavior:</p>
        <p class="text-white">${currentBehavior?.name || 'None'}</p>
      </div>

      <div class="bg-gray-700 rounded p-2 mt-2">
        <p class="text-sm text-gray-400 mb-2">Custom Behavior:</p>
        <textarea id="customBehaviorEditor" class="w-full h-24 bg-gray-800 text-white p-2 rounded resize-none" placeholder="Write your custom behavior logic here..."></textarea>
        <div class="flex justify-end mt-2">
          <button id="saveCustomBehavior" class="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded">Save</button>
        </div>
      </div>
    `;

    this.setupEventListeners(); // Re-bind event listeners
  }
}
