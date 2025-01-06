// src/state/ConfigSlice.ts
import { ConfigManager } from '../managers/ConfigManager';
import { GameConfig } from '../types';

export class ConfigSlice {
  private configManager: ConfigManager;
  private activeConfig: GameConfig | null = null;

  constructor(configManager: ConfigManager) {
    if (!configManager) {
      throw new Error('ConfigManager is required in ConfigSlice');
    }
    
    this.configManager = configManager;
    
    // Subscribe to config changes
    this.configManager.subscribe((newConfig: GameConfig) => {
      this.activeConfig = newConfig;
    });
  }

  public initializeConfig(): void {
    const config = this.configManager.getActiveConfig();
    if (config) {
      this.activeConfig = config;
    }
  }

  public getActiveConfig(): GameConfig | null {
    return this.activeConfig;
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

  public deleteConfig(configId: string): void {
    this.configManager.deleteConfig(configId);
  }
}