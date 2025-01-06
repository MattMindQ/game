// src/managers/StateManager.ts
import { GameSlice } from '../state/GameSlice';
import { ConfigSlice } from '../state/ConfigSlice';
import { AgentManager } from './AgentManager';
import { WorldManager } from './WorldManager';
import { CombatManager } from './CombatManager';
import { BehaviorManager } from './BehaviorManager';
import { GameConfig } from '../types/config';
import { Agent, Position, WorldState } from '../types';

type StateKey = 
  | 'gameState' 
  | 'connectionStatus' 
  | 'config' 
  | 'agents' 
  | 'selectedAgent' 
  | 'world'
  | 'stats';

interface GameState {
  isRunning: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  config: GameConfig | null;
  selectedAgent: Agent | null;
  agents: Agent[];
  world: WorldState | null;
}

type StateData<K extends StateKey> = 
  K extends 'gameState' ? { isRunning: boolean } :
  K extends 'connectionStatus' ? 'connected' | 'disconnected' | 'error' :
  K extends 'config' ? GameConfig :
  K extends 'agents' ? Agent[] :
  K extends 'selectedAgent' ? Agent | null :
  K extends 'world' ? WorldState :
  K extends 'stats' ? any : never;

type Subscriber<K extends StateKey> = (data: StateData<K>) => void;

export class StateManager {
  private state: GameState;
  private subscribers: Map<StateKey, Set<Subscriber<any>>> = new Map();

  private gameSlice: GameSlice;
  private configSlice: ConfigSlice;
  private agentManager: AgentManager;
  private worldManager: WorldManager;
  private combatManager: CombatManager;
  private behaviorManager: BehaviorManager;

  constructor(configManager: ConfigManager) {
    if (!configManager) {
      throw new Error('ConfigManager is required in StateManager');
    }

    // Initialize slices and managers
    this.gameSlice = new GameSlice();
    this.configSlice = new ConfigSlice(configManager); // Pass configManager
    this.agentManager = new AgentManager();
    this.worldManager = new WorldManager();
    this.combatManager = new CombatManager();
    this.behaviorManager = new BehaviorManager();

    // Initialize state
    this.state = {
      isRunning: this.gameSlice.getIsRunning(),
      connectionStatus: this.gameSlice.getConnectionStatus(),
      config: null,
      selectedAgent: null,
      agents: [],
      world: null
    };

    // Initialize subscribers
    [
      'gameState',
      'connectionStatus',
      'config',
      'agents',
      'selectedAgent',
      'world',
      'stats'
    ].forEach((key) => {
      this.subscribers.set(key as StateKey, new Set());
    });

    // Subscribe to AgentManager updates
    this.agentManager.subscribe((agents: Agent[]) => {
      this.state.agents = agents;
      this.notifySubscribers('agents', agents);
    });

    // Initialize configuration
    this.initializeState();
  }
  private initializeState(): void {
    this.configSlice.initializeConfig();
    const currentConfig = this.configSlice.getActiveConfig();
    if (currentConfig) {
      this.state.config = currentConfig;
      this.notifySubscribers('config', currentConfig);
    }
  }

  // -----------------------------------------------------------
  // Agent Management
  // -----------------------------------------------------------
  public setSelectedAgent(agent: Agent | null): void {
    this.state.selectedAgent = agent;
    this.agentManager.setSelectedAgent(agent);
    this.notifySubscribers('selectedAgent', agent);
  }


  public getSelectedAgent(): Agent | null {
    return this.state.selectedAgent;
  }

  public getAgents(): Agent[] {
    // Always get latest from AgentManager
    return this.agentManager.getAgents();
  }
  public updateAgentPosition(agentId: string, position: Position): void {
    const agent = this.state.agents.find(a => a.id === agentId);
    if (agent) {
      agent.position = position;
      this.notifySubscribers('agents', this.state.agents);
    }
  }

  public requestAddAgent(team: 'red' | 'blue'): void {
    this.agentManager.addAgent(team);
  }

  public removeAgent(agentId: string): void {
    this.agentManager.removeAgent(agentId);
  }


  public updateAgentBehavior(agentId: string, behaviorUpdate: any): void {
    this.behaviorManager.updateBehavior(agentId, behaviorUpdate);
  }

  // -----------------------------------------------------------
  // Game State Management
  // -----------------------------------------------------------
  public setGameRunning(isRunning: boolean): void {
    this.gameSlice.setIsRunning(isRunning);
    this.state.isRunning = this.gameSlice.getIsRunning();
    this.notifySubscribers('gameState', { isRunning: this.state.isRunning });
    this.updateControlButtons();
  }


// Add this method to StateManager class
public handleGameUpdate(update: any): void {
  if (!update?.data) {
    console.warn('Invalid game update received:', update);
    return;
  }

  const { data } = update;
  
  // Handle agents update with proper nesting
  if (data.agents) {
    console.log('StateManager received agent update:', {
      rawData: data.agents,
      agentCount: Object.keys(data.agents?.agents || {})
        .filter(key => key !== 'bounds').length
    });

    // Pass the entire agents object structure
    this.agentManager.updateAgents(data.agents);
    
    // Verify agent update
    const currentAgents = this.agentManager.getAgents();
    console.log('Current agents after update:', currentAgents.length);
  }

  // Update game running state
  if (data.is_running !== undefined) {
    this.setGameRunning(data.is_running);
  }

  // Update team counts if available
  if (data.team_counts) {
    this.agentManager.updateTeamCounts(data.team_counts);
  }

  // Update world state if available
  if (data.world) {
    this.worldManager.updateWorld(data.world);
  }
}

  public setConnectionStatus(status: 'connected' | 'disconnected' | 'error'): void {
    this.gameSlice.setConnectionStatus(status);
    this.state.connectionStatus = this.gameSlice.getConnectionStatus();
    this.notifySubscribers('connectionStatus', this.state.connectionStatus);
    this.updateControlButtons();
  }

  public sendCommand(command: { type: string; [key: string]: any }): void {
    // Implement command sending logic
  }

  private updateControlButtons(): void {
    const startButton = document.getElementById('startButton') as HTMLButtonElement;
    const pauseButton = document.getElementById('pauseButton') as HTMLButtonElement;

    const isConnected = this.state.connectionStatus === 'connected';
    const isRunning = this.state.isRunning;

    if (startButton) startButton.disabled = !isConnected || isRunning;
    if (pauseButton) pauseButton.disabled = !isConnected || !isRunning;
  }

  // -----------------------------------------------------------
  // Manager Access
  // -----------------------------------------------------------
  public getAgentManager(): AgentManager {
    return this.agentManager;
  }

  public getWorldManager(): WorldManager {
    return this.worldManager;
  }

  public getCombatManager(): CombatManager {
    return this.combatManager;
  }

  public getBehaviorManager(): BehaviorManager {
    return this.behaviorManager;
  }

  // -----------------------------------------------------------
  // Config Management
  // -----------------------------------------------------------
  public getActiveConfig(): GameConfig | null {
    return this.configSlice.getActiveConfig();
  }

  public updateConfigParameter<K extends keyof GameConfig['parameters']>(
    key: K,
    value: GameConfig['parameters'][K]
  ): void {
    this.configSlice.updateConfigParameter(key, value);

    const updatedConfig = this.configSlice.getActiveConfig();
    if (updatedConfig) {
      this.state.config = updatedConfig;
      this.notifySubscribers('config', updatedConfig);
    }
  }

  public async saveConfig(name: string, description?: string): Promise<void> {
    await this.configSlice.saveConfig(name, description);
    const updatedConfig = this.configSlice.getActiveConfig();
    if (updatedConfig) {
      this.state.config = updatedConfig;
      this.notifySubscribers('config', updatedConfig);
    }
  }

  public loadConfig(configId: string): void {
    this.configSlice.loadConfig(configId);
    const loadedConfig = this.configSlice.getActiveConfig();
    if (loadedConfig) {
      this.state.config = loadedConfig;
      this.notifySubscribers('config', loadedConfig);
    }
  }

  public deleteConfig(configId: string): void {
    this.configSlice.deleteConfig(configId);
    const fallbackConfig = this.configSlice.getActiveConfig();
    if (fallbackConfig) {
      this.state.config = fallbackConfig;
      this.notifySubscribers('config', fallbackConfig);
    }
  }

  // -----------------------------------------------------------
  // Subscription System
  // -----------------------------------------------------------
  public subscribe<K extends StateKey>(
    key: K, 
    callback: Subscriber<K>
  ): () => void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.add(callback);
    }
    return () => subscribers?.delete(callback);
  }

  private notifySubscribers<K extends StateKey>(key: K, data: StateData<K>): void {
    const subscribers = this.subscribers.get(key);
    subscribers?.forEach((callback) => callback(data));
  }
}