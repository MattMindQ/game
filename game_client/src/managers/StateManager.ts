import { Agent, GameStats, Position, WorldState, GameConfig } from '../types'; 
import { AgentSlice } from '../state/AgentSlice';
import { GameSlice } from '../state/GameSlice';
import { ConfigSlice } from '../state/ConfigSlice';
// 1. Import the new WorldSlice
import { WorldSlice } from '../state/WorldSlice';

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
  // Delegated to GameSlice:
  isRunning: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';

  // Delegated to AgentSlice:
  agents: Agent[];
  selectedAgent: Agent | null;
  stats: GameStats;

  // Delegated to ConfigSlice:
  config: GameConfig | null;

  // Delegated to WorldSlice:
  world: WorldState | null;
}

export class StateManager {
  private state: GameState;
  private subscribers: Map<StateKey, Set<Subscriber>> = new Map();

  // 2. Add references to our slices
  private agentSlice: AgentSlice;
  private gameSlice: GameSlice;
  private configSlice: ConfigSlice;
  private worldSlice: WorldSlice;

  constructor() {
    // Instantiate slices
    this.agentSlice = new AgentSlice();
    this.gameSlice = new GameSlice();
    this.configSlice = new ConfigSlice();
    this.worldSlice = new WorldSlice();

    // Initialize them so we can mirror the slice states in this.state
    this.state = {
      isRunning: this.gameSlice.getIsRunning(),
      connectionStatus: this.gameSlice.getConnectionStatus(),
      agents: this.agentSlice.getAgents(),
      selectedAgent: this.agentSlice.getSelectedAgent(),
      stats: this.agentSlice.getStats(),
      config: this.configSlice.getActiveConfig(),
      world: this.worldSlice.getWorld()
    };

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

    // Initialize the config slice if needed
    this.configSlice.initializeConfig();

    // Optionally load the active config into this.state
    const currentConfig = this.configSlice.getActiveConfig();
    if (currentConfig) {
      this.state.config = currentConfig;
      this.notifySubscribers('config', currentConfig);
      this.updateConfigUI(currentConfig);
    }
  }

  // -----------------------------------------------------------
  //                SUBSCRIPTION MANAGEMENT
  // -----------------------------------------------------------
  public subscribe(key: StateKey, callback: Subscriber): () => void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.add(callback);
    }
    return () => {
      subscribers?.delete(callback);
    };
  }

  private notifySubscribers(key: StateKey, data: any) {
    const subscribers = this.subscribers.get(key);
    subscribers?.forEach(callback => callback(data));
  }

  // -----------------------------------------------------------
  //                GAME SLICE (DELEGATION)
  // -----------------------------------------------------------
  public setGameRunning(isRunning: boolean) {
    this.gameSlice.setIsRunning(isRunning);
    this.state.isRunning = this.gameSlice.getIsRunning();
    this.notifySubscribers('gameState', { isRunning: this.state.isRunning });
  }

  public setConnectionStatus(status: 'connected' | 'disconnected' | 'error') {
    this.gameSlice.setConnectionStatus(status);
    this.state.connectionStatus = this.gameSlice.getConnectionStatus();
    this.notifySubscribers('connectionStatus', this.state.connectionStatus);

    // Optional UI updates
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
      statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      statusElement.className = `text-${
        status === 'connected' ? 'green' : 'red'
      }-500`;
    }
    this.updateControlButtons();
  }

  private updateControlButtons() {
    const startButton = document.getElementById('startButton') as HTMLButtonElement;
    const pauseButton = document.getElementById('pauseButton') as HTMLButtonElement;
    const addRedButton = document.getElementById('addRedAgent') as HTMLButtonElement;
    const addBlueButton = document.getElementById('addBlueAgent') as HTMLButtonElement;
    const saveConfigButton = document.getElementById('saveConfigButton') as HTMLButtonElement;

    const isConnected = this.gameSlice.getConnectionStatus() === 'connected';
    const isRunning = this.gameSlice.getIsRunning();

    if (startButton) startButton.disabled = !isConnected || isRunning;
    if (pauseButton) pauseButton.disabled = !isConnected || !isRunning;
    if (addRedButton) addRedButton.disabled = !isConnected;
    if (addBlueButton) addBlueButton.disabled = !isConnected;
    if (saveConfigButton) saveConfigButton.disabled = !isConnected;
  }

  // -----------------------------------------------------------
  //                AGENT SLICE (DELEGATION)
  // -----------------------------------------------------------
  public updateSimulationState(agents: Agent[], stats?: GameStats, world?: WorldState) {
    this.agentSlice.setAgents(agents);
    if (stats) {
      this.agentSlice.updateStats(stats);
    }
    this.state.agents = this.agentSlice.getAgents();
    this.state.stats = this.agentSlice.getStats();
    this.notifySubscribers('agents', this.state.agents);
    this.notifySubscribers('stats', this.state.stats);

    // Delegate to WorldSlice
    if (world) {
      this.worldSlice.setWorld(world);
      this.state.world = this.worldSlice.getWorld();
      this.notifySubscribers('world', this.state.world);
    }

    // Update selected agent if it exists
    if (this.agentSlice.getSelectedAgent()) {
      const updatedSelectedAgent = agents.find(
        a => a.id === this.agentSlice.getSelectedAgent()?.id
      );
      if (updatedSelectedAgent) {
        this.setSelectedAgent(updatedSelectedAgent);
      }
    }
  }

  public setSelectedAgent(agent: Agent | null) {
    this.agentSlice.setSelectedAgent(agent);
    this.state.selectedAgent = this.agentSlice.getSelectedAgent();
    this.notifySubscribers('selectedAgent', this.state.selectedAgent);

    this.updateSelectedAgentUI(agent);
  }

  private updateSelectedAgentUI(agent: Agent | null) {
    // (Existing DOM update code remains here)
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
      Object.values(elements).forEach(element => {
        if (element) element.textContent = '-';
      });
    }
  }

  public updateAgentPosition(agentId: string, position: Position) {
    const agents = this.agentSlice.getAgents();
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      agent.position = position;
      this.state.agents = agents;
      this.notifySubscribers('agents', this.state.agents);
    }
  }

  // -----------------------------------------------------------
  //                CONFIG SLICE (DELEGATION)
  // -----------------------------------------------------------
  public getActiveConfig(): GameConfig | null {
    return this.configSlice.getActiveConfig();
  }

  public updateConfigParameter<K extends keyof GameConfig['parameters']>(
    key: K,
    value: GameConfig['parameters'][K]
  ): void {
    this.configSlice.updateConfigParameter(key, value);

    const currentConfig = this.configSlice.getActiveConfig();
    if (currentConfig) {
      this.state.config = currentConfig;
      this.notifySubscribers('config', currentConfig);
      this.updateConfigUI(currentConfig);
    }
  }

  public async saveConfig(name: string, description?: string): Promise<void> {
    await this.configSlice.saveConfig(name, description);

    const currentConfig = this.configSlice.getActiveConfig();
    if (currentConfig) {
      this.state.config = currentConfig;
      this.notifySubscribers('config', currentConfig);
      this.updateConfigUI(currentConfig);
    }
  }

  public loadConfig(configId: string): void {
    this.configSlice.loadConfig(configId);

    const currentConfig = this.configSlice.getActiveConfig();
    if (currentConfig) {
      this.state.config = currentConfig;
      this.notifySubscribers('config', currentConfig);
      this.updateConfigUI(currentConfig);
    }
  }

  public getConfigManager() {
    return this.configSlice.getConfigManager();
  }

  public initializeConfig(): void {
    this.configSlice.initializeConfig();
    const currentConfig = this.configSlice.getActiveConfig();
    if (currentConfig) {
      this.state.config = currentConfig;
      this.updateConfigUI(currentConfig);
    }
  }

  private updateConfigUI(config: GameConfig): void {
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

    const activeConfigName = document.getElementById('activeConfigName');
    if (activeConfigName) {
      activeConfigName.textContent = config.name;
    }
  }

  // -----------------------------------------------------------
  //                WORLD SLICE (DELEGATION)
  // -----------------------------------------------------------
  /**
   * If you need specific world-manipulation methods, expose them here,
   * delegating to `WorldSlice`.
   */
  public getWorldState(): WorldState | null {
    return this.worldSlice.getWorld();
  }

  public setWorldState(world: WorldState): void {
    this.worldSlice.setWorld(world);
    this.state.world = this.worldSlice.getWorld();
    this.notifySubscribers('world', this.state.world);
  }

  public clearWorldState(): void {
    this.worldSlice.clearWorld();
    this.state.world = null;
    this.notifySubscribers('world', null);
  }

  // -----------------------------------------------------------
  //                MISC & GETTERS
  // -----------------------------------------------------------
  public updateTeamCounts(counts: { red: number; blue: number }) {
    this.agentSlice.updateStats({
      red_agents: counts.red,
      blue_agents: counts.blue
    });
    this.state.stats = this.agentSlice.getStats();
    this.notifySubscribers('stats', this.state.stats);

    const redCount = document.getElementById('redTeamCount');
    const blueCount = document.getElementById('blueTeamCount');
    if (redCount) redCount.textContent = `${counts.red} agents`;
    if (blueCount) blueCount.textContent = `${counts.blue} agents`;
  }

  public getState() {
    return this.state;
  }

  public getAgents(): Agent[] {
    return this.agentSlice.getAgents();
  }

  public getSelectedAgent(): Agent | null {
    return this.agentSlice.getSelectedAgent();
  }

  public getStats(): GameStats {
    return this.agentSlice.getStats();
  }

  public isGameRunning(): boolean {
    return this.gameSlice.getIsRunning();
  }

  // WebSocket message handlers remain unchanged
  public requestAddAgent(team: 'red' | 'blue') {
    // ...
  }
}
