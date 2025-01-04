import { Agent, GameConfig, GameStats } from '../types';

export interface UIState {
  selectedAgentId: string | null;
  notifications: Notification[];
  connectionStatus: 'connected' | 'disconnected' | 'error';
  isGameRunning: boolean;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
}

export class UIManager {
  private state: UIState = {
    selectedAgentId: null,
    notifications: [],
    connectionStatus: 'disconnected',
    isGameRunning: false
  };

  // Notification Management
  public showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now()
    };

    const notificationElement = this.createNotificationElement(notification);
    document.body.appendChild(notificationElement);

    setTimeout(() => {
      notificationElement.style.opacity = '0';
      setTimeout(() => notificationElement.remove(), 500);
    }, 3000);
  }

  private createNotificationElement(notification: Notification): HTMLDivElement {
    const element = document.createElement('div');
    element.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white transition-opacity duration-500 ${
      this.getNotificationColorClass(notification.type)
    }`;
    element.textContent = notification.message;
    return element;
  }

  private getNotificationColorClass(type: 'success' | 'error' | 'info'): string {
    const colorMap = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };
    return colorMap[type];
  }

  // Connection Status Management
  public updateConnectionStatus(status: 'connected' | 'disconnected' | 'error'): void {
    this.state.connectionStatus = status;
    
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
      statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      statusElement.className = `text-${status === 'connected' ? 'green' : 'red'}-500`;
    }
    
    this.updateControlButtonStates();
  }

  // Game Control UI
  public updateGameRunningState(isRunning: boolean): void {
    this.state.isGameRunning = isRunning;
    
    const toggleButton = document.getElementById('toggleGameButton');
    if (toggleButton) {
      toggleButton.textContent = isRunning ? 'Pause' : 'Start';
      toggleButton.classList.remove(isRunning ? 'bg-green-600' : 'bg-yellow-600');
      toggleButton.classList.add(isRunning ? 'bg-yellow-600' : 'bg-green-600');
    }
    
    this.updateControlButtonStates();
  }

  private updateControlButtonStates(): void {
    const buttons = {
      startButton: document.getElementById('startButton') as HTMLButtonElement,
      pauseButton: document.getElementById('pauseButton') as HTMLButtonElement,
      addRedButton: document.getElementById('addRedAgent') as HTMLButtonElement,
      addBlueButton: document.getElementById('addBlueAgent') as HTMLButtonElement,
      saveConfigButton: document.getElementById('saveConfigButton') as HTMLButtonElement
    };

    const isConnected = this.state.connectionStatus === 'connected';
    const isRunning = this.state.isGameRunning;

    Object.entries(buttons).forEach(([key, button]) => {
      if (button) {
        button.disabled = this.getButtonDisabledState(key, isConnected, isRunning);
      }
    });
  }

  private getButtonDisabledState(
    buttonKey: string, 
    isConnected: boolean, 
    isRunning: boolean
  ): boolean {
    const stateMap: Record<string, (c: boolean, r: boolean) => boolean> = {
      startButton: (c, r) => !c || r,
      pauseButton: (c, r) => !c || !r,
      addRedButton: (c) => !c,
      addBlueButton: (c) => !c,
      saveConfigButton: (c) => !c
    };

    return stateMap[buttonKey]?.(isConnected, isRunning) ?? true;
  }

  // Agent UI Management
  public updateSelectedAgent(agent: Agent | null): void {
    this.state.selectedAgentId = agent?.id ?? null;
    this.updateSelectedAgentUI(agent);
  }

  public updateAgentList(agents: Agent[]): void {
    // Update any agent list UI elements
    const selectedAgent = agents.find(a => a.id === this.state.selectedAgentId);
    if (selectedAgent) {
      this.updateSelectedAgentUI(selectedAgent);
    }
  }

  private updateSelectedAgentUI(agent: Agent | null): void {
    const editorStatus = document.getElementById('editorStatus');
    if (editorStatus) {
      editorStatus.textContent = agent 
        ? `Selected agent ${agent.id.slice(0, 6)}...`
        : 'No agent selected';
      editorStatus.className = 'text-gray-400';
    }

    const elements = {
      agentId: document.getElementById('agentId'),
      agentTeam: document.getElementById('agentTeam'),
      agentHealth: document.getElementById('agentHealth'),
      agentPosition: document.getElementById('agentPosition')
    };

    if (agent) {
      Object.entries(elements).forEach(([key, element]) => {
        if (element) {
          element.textContent = this.getAgentDisplayValue(key, agent);
        }
      });
    } else {
      Object.values(elements).forEach(element => {
        if (element) element.textContent = '-';
      });
    }
  }

  private getAgentDisplayValue(key: string, agent: Agent): string {
    const displayMap: Record<string, (a: Agent) => string> = {
      agentId: (a) => a.id.slice(0, 8),
      agentTeam: (a) => a.team,
      agentHealth: (a) => `${a.health}%`,
      agentPosition: (a) => `(${a.position.x.toFixed(2)}, ${a.position.y.toFixed(2)})`
    };

    return displayMap[key]?.(agent) ?? '-';
  }

  // Config UI Management
  public updateConfigUI(config: GameConfig): void {
    // Update configuration input fields
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

    // Update active config name display
    const activeConfigName = document.getElementById('activeConfigName');
    if (activeConfigName) {
      activeConfigName.textContent = config.name;
    }
  }

  // Stats UI Management
  public updateStats(stats: GameStats): void {
    const elements = {
      redTeamCount: document.getElementById('redTeamCount'),
      blueTeamCount: document.getElementById('blueTeamCount'),
      redKills: document.getElementById('redKills'),
      blueKills: document.getElementById('blueKills'),
      totalDeaths: document.getElementById('totalDeaths')
    };

    if (elements.redTeamCount) elements.redTeamCount.textContent = `${stats.red_agents} agents`;
    if (elements.blueTeamCount) elements.blueTeamCount.textContent = `${stats.blue_agents} agents`;
    if (elements.redKills) elements.redKills.textContent = stats.red_kills.toString();
    if (elements.blueKills) elements.blueKills.textContent = stats.blue_kills.toString();
    if (elements.totalDeaths) elements.totalDeaths.textContent = stats.total_deaths.toString();
  }
}