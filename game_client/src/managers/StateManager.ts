// src/managers/StateManager.ts

import { Agent, GameStats, Position, WorldState, GameConfig } from '../types'; 
import { ConfigManager } from './ConfigManager';

type StateKey =
  | 'gameState'
  | 'agents'
  | 'stats'
  | 'selectedAgent'
  | 'connectionStatus'
  | 'config'
  | 'world';

type Subscriber = (data: any) => void;

interface GameState {
  isRunning: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  agents: Agent[];
  selectedAgent: Agent | null;
  stats: GameStats;
  world: WorldState | null;
  config: GameConfig | null; // <-- Added here
}

export class StateManager {
  private state: GameState;
  private subscribers: Map<StateKey, Set<Subscriber>> = new Map();
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();

    this.state = {
      isRunning: false,
      connectionStatus: 'disconnected',
      agents: [],
      selectedAgent: null,
      stats: {
        fps: 0,
        red_agents: 0,
        blue_agents: 0,
        red_kills: 0,
        blue_kills: 0,
        total_deaths: 0
      },
      world: null,
      config: null
    };

    // Initialize empty subscriber sets for each state key, including 'config' and 'world'.
    [
      'gameState',
      'agents',
      'stats',
      'selectedAgent',
      'connectionStatus',
      'config',
      'world'
    ].forEach(key => {
      this.subscribers.set(key as StateKey, new Set());
    });

    // Subscribe to config changes from ConfigManager
    this.configManager.subscribe((config) => {
      this.state.config = config;
      this.notifySubscribers('config', config);
      this.updateConfigUI(config);
    });
  }

  // Config Management
  public getConfigManager(): ConfigManager {
    return this.configManager;
  }

  public getActiveConfig(): GameConfig | null {
    return this.state.config;
  }

  public updateConfigParameter<K extends keyof GameConfig['parameters']>(
    key: K,
    value: GameConfig['parameters'][K]
  ): void {
    this.configManager.updateConfigParameter(key, value);
  }

  public async saveConfig(name: string, description?: string): Promise<void> {
    await this.configManager.saveCurrentConfig(name, description);
  }

  public loadConfig(configId: string): void {
    this.configManager.loadConfig(configId);
  }

  // Subscription Management
  public subscribe(key: StateKey, callback: Subscriber): () => void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.add(callback);
    }

    // Return unsubscribe function
    return () => {
      subscribers?.delete(callback);
    };
  }

  private notifySubscribers(key: StateKey, data: any) {
    const subscribers = this.subscribers.get(key);
    subscribers?.forEach(callback => callback(data));
  }

  // State Updates
  public setGameRunning(isRunning: boolean) {
    this.state.isRunning = isRunning;
    this.notifySubscribers('gameState', { isRunning });
  }

  public setConnectionStatus(status: 'connected' | 'disconnected' | 'error') {
    this.state.connectionStatus = status;
    this.notifySubscribers('connectionStatus', status);

    // Update UI elements
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
      statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      statusElement.className = `text-${
        status === 'connected' ? 'green' : 'red'
      }-500`;
    }

    // Update button states
    this.updateControlButtons();
  }

  private updateControlButtons() {
    const startButton = document.getElementById('startButton') as HTMLButtonElement;
    const pauseButton = document.getElementById('pauseButton') as HTMLButtonElement;
    const addRedButton = document.getElementById('addRedAgent') as HTMLButtonElement;
    const addBlueButton = document.getElementById('addBlueAgent') as HTMLButtonElement;
    const saveConfigButton = document.getElementById('saveConfigButton') as HTMLButtonElement;

    const isConnected = this.state.connectionStatus === 'connected';
    const isRunning = this.state.isRunning;

    if (startButton) startButton.disabled = !isConnected || isRunning;
    if (pauseButton) pauseButton.disabled = !isConnected || !isRunning;
    if (addRedButton) addRedButton.disabled = !isConnected;
    if (addBlueButton) addBlueButton.disabled = !isConnected;
    if (saveConfigButton) saveConfigButton.disabled = !isConnected;
  }

  // Agent Management
  public updateSimulationState(agents: Agent[], stats?: GameStats, world?: WorldState) {
    this.state.agents = agents;
    this.notifySubscribers('agents', agents);

    if (stats) {
      this.state.stats = { ...this.state.stats, ...stats };
      this.notifySubscribers('stats', this.state.stats);
    }

    if (world) {
      this.state.world = world;
      this.notifySubscribers('world', world);
    }

    // Update selected agent if exists
    if (this.state.selectedAgent) {
      const updatedSelectedAgent = agents.find(a => a.id === this.state.selectedAgent?.id);
      if (updatedSelectedAgent) {
        this.setSelectedAgent(updatedSelectedAgent);
      }
    }
  }

  public setSelectedAgent(agent: Agent | null) {
    this.state.selectedAgent = agent;
    this.notifySubscribers('selectedAgent', agent);

    // Update UI elements for selected agent
    this.updateSelectedAgentUI(agent);
  }

  private updateSelectedAgentUI(agent: Agent | null) {
    // Update editor status
    const editorStatus = document.getElementById('editorStatus');
    if (editorStatus) {
      if (agent) {
        editorStatus.textContent = `Selected agent ${agent.id.slice(0, 6)}...`;
        editorStatus.className = 'text-gray-400';
      } else {
        editorStatus.textContent = 'No agent selected';
        editorStatus.className = 'text-gray-400';
      }
    }

    const elements = {
      agentId: document.getElementById('agentId'),
      agentTeam: document.getElementById('agentTeam'),
      agentHealth: document.getElementById('agentHealth'),
      agentKills: document.getElementById('agentKills'),
      agentDamageDealt: document.getElementById('agentDamageDealt'),
      agentDamageTaken: document.getElementById('agentDamageTaken')
    };

    if (agent) {
      if (elements.agentId) elements.agentId.textContent = agent.id.slice(0, 8);
      if (elements.agentTeam) elements.agentTeam.textContent = agent.team;
      if (elements.agentHealth) elements.agentHealth.textContent = `${agent.health}%`;

      // Update combat stats
      if (elements.agentKills) {
        elements.agentKills.textContent = agent.kills?.toString() || '0';
      }
      if (elements.agentDamageDealt) {
        elements.agentDamageDealt.textContent = agent.damageDealt?.toString() || '0';
      }
      if (elements.agentDamageTaken) {
        elements.agentDamageTaken.textContent = agent.damageTaken?.toString() || '0';
      }
    } else {
      // Clear all fields when no agent is selected
      Object.values(elements).forEach(element => {
        if (element) element.textContent = '-';
      });
    }
  }

  private updateConfigUI(config: GameConfig): void {
    // Update all input fields with the new config values
    Object.entries(config.parameters).forEach(([key, value]) => {
      const element = document.querySelector(`[data-config-key="${key}"]`) as HTMLInputElement;
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value as boolean;
        } else {
          element.value = String(value);
        }
      }
    });

    // Update the active config name display
    const activeConfigName = document.getElementById('activeConfigName');
    if (activeConfigName) {
      activeConfigName.textContent = config.name;
    }
  }

  public initializeConfig(): void {
    const config = this.configManager.getActiveConfig();
    if (config) {
      this.state.config = config;
      this.updateConfigUI(config);
    }
  }

  public updateTeamCounts(counts: { red: number; blue: number }) {
    // Update stats
    this.state.stats.red_agents = counts.red;
    this.state.stats.blue_agents = counts.blue;
    this.notifySubscribers('stats', this.state.stats);

    // Update UI elements
    const redCount = document.getElementById('redTeamCount');
    const blueCount = document.getElementById('blueTeamCount');

    if (redCount) redCount.textContent = `${counts.red} agents`;
    if (blueCount) blueCount.textContent = `${counts.blue} agents`;
  }

  // State Getters
  public getState(): GameState {
    return this.state;
  }

  public getAgents(): Agent[] {
    return this.state.agents;
  }

  public getSelectedAgent(): Agent | null {
    return this.state.selectedAgent;
  }

  public getStats(): GameStats {
    return this.state.stats;
  }

  public isGameRunning(): boolean {
    return this.state.isRunning;
  }

  // WebSocket Message Handlers
  public requestAddAgent(team: 'red' | 'blue') {
    // This will be handled by the WebSocket connection
    // Implementation in GameConnection class
  }

  public updateAgentPosition(agentId: string, position: Position) {
    const agent = this.state.agents.find(a => a.id === agentId);
    if (agent) {
      agent.position = position;
      this.notifySubscribers('agents', this.state.agents);
    }
  }
}
