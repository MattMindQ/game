// src/managers/ConfigManager.ts

import { GameConfig } from '../types/config';
import { ConfigUIRenderer } from '../services/ConfigUIRenderer';

export class ConfigManager {
  private activeConfig: GameConfig | null = null;
  private savedConfigs: GameConfig[] = [];
  private subscribers: Set<(config: GameConfig) => void> = new Set();
  private uiRenderer: ConfigUIRenderer | null = null;

  constructor() {
    this.loadDefaultConfig();
  }

  public initializeUI(containerId: string): void {
    try {
      this.uiRenderer = new ConfigUIRenderer(containerId, this);
      this.uiRenderer.render();
      
      // Set up save config button
      const saveButton = document.getElementById('saveConfigButton');
      if (saveButton) {
        saveButton.addEventListener('click', async () => {
          const name = prompt('Enter configuration name:');
          if (name) {
            await this.saveCurrentConfig(name);
          }
        });
      }

      // Set up toggle config button
      const toggleButton = document.getElementById('toggleGameConfigButton');
      const configPanel = document.getElementById('gameConfig');
      if (toggleButton && configPanel) {
        toggleButton.addEventListener('click', () => {
          configPanel.classList.toggle('hidden');
        });
      }

      // Update UI with current config
      if (this.activeConfig) {
        this.uiRenderer.update();
      }
    } catch (error) {
      console.error('Failed to initialize config UI:', error);
    }
  }

  private loadDefaultConfig() {
    this.activeConfig = {
      id: 'default',
      name: 'Default Configuration',
      description: 'Default game settings',
      createdAt: new Date(),
      updatedAt: new Date(),
      parameters: {
        agentCount: 5,
        gameAreaSize: 1000,
        enableWorldLogic: true,
        visualRange: 150,
        recognitionRange: 100,
        combatRange: 30,
        baseDamage: 10,
        baseHealth: 100,
        baseSpeed: 5,
        turnSpeed: 0.1,
        behaviorUpdateInterval: 100,
        maxGroupSize: 5,
        flockingDistance: 50,
        obstacleCount: 10,
        obstacleSize: 20,
        boundaryDamage: 5,
        teamBalance: 0,
        respawnEnabled: true,
        respawnTime: 3000,
      },
    };
    this.notifySubscribers();
  }

  private notifySubscribers() {
    if (this.activeConfig) {
      this.subscribers.forEach(callback => callback(this.activeConfig!));
      // Only update UI if it's initialized
      if (this.uiRenderer) {
        this.uiRenderer.update();
      }
    }
  }

  // -----------------------------------------------------------
  // Public API
  // -----------------------------------------------------------
  public subscribe(callback: (config: GameConfig) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public getActiveConfig(): GameConfig | null {
    return this.activeConfig;
  }

  public getSavedConfigs(): GameConfig[] {
    return [...this.savedConfigs]; // Return a copy to avoid direct mutation
  }

  public async saveCurrentConfig(name: string, description?: string): Promise<void> {
    if (!this.activeConfig) return;

    const newConfig: GameConfig = {
      ...this.activeConfig,
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.savedConfigs.push(newConfig);

    // Future integration point for backend save
    // await saveToBackend(newConfig);

    this.notifySubscribers();
  }

  public updateConfigParameter<K extends keyof GameConfig['parameters']>(
    key: K,
    value: GameConfig['parameters'][K]
  ): void {
    if (!this.activeConfig) return;

    this.activeConfig = {
      ...this.activeConfig,
      parameters: {
        ...this.activeConfig.parameters,
        [key]: value,
      },
      updatedAt: new Date(),
    };

    this.notifySubscribers();
  }

  public loadConfig(configId: string): void {
    const config = this.savedConfigs.find((c) => c.id === configId);
    if (config) {
      this.activeConfig = { ...config };
      this.notifySubscribers();
    }
  }

  public deleteConfig(configId: string): void {
    this.savedConfigs = this.savedConfigs.filter((c) => c.id !== configId);

    if (this.activeConfig?.id === configId) {
      this.loadDefaultConfig();
    }

    // Future integration point for backend delete
    // await deleteFromBackend(configId);
  }
}

