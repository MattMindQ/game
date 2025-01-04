// src/state/ConfigSlice.ts
import { ConfigManager } from '../managers/ConfigManager';
import { GameConfig } from '../types';

/**
 * Manages the game's config data by delegating to ConfigManager,
 * and stores the active config locally.
 */
export class ConfigSlice {
  private configManager: ConfigManager;
  private activeConfig: GameConfig | null = null;

  constructor() {
    // Instantiate the ConfigManager (or receive it via constructor if preferred)
    this.configManager = new ConfigManager();

    // Subscribe to config changes from the ConfigManager
    this.configManager.subscribe((newConfig: GameConfig) => {
      this.activeConfig = newConfig;
    });
  }

  /**
   * Retrieves the active config object from local state
   * (updated via configManager.subscribe).
   */
  public getActiveConfig(): GameConfig | null {
    return this.activeConfig;
  }

  /**
   * Updates a single config parameter. This delegates to ConfigManager,
   * which will trigger its own subscription callback to update `activeConfig`.
   */
  public updateConfigParameter<K extends keyof GameConfig['parameters']>(
    key: K,
    value: GameConfig['parameters'][K]
  ): void {
    this.configManager.updateConfigParameter(key, value);
  }

  /**
   * Saves the current config to the backend or local storage,
   * depending on your ConfigManager's implementation.
   */
  public async saveConfig(name: string, description?: string): Promise<void> {
    await this.configManager.saveCurrentConfig(name, description);
  }

  /**
   * Loads a config by ID (delegates to ConfigManager).
   */
  public loadConfig(configId: string): void {
    this.configManager.loadConfig(configId);
  }

  /**
   * Returns the underlying ConfigManager instance,
   * if other parts of the code need direct access.
   */
  public getConfigManager(): ConfigManager {
    return this.configManager;
  }

  /**
   * Optionally, initialize from the manager's existing active config
   * if you want the slice to immediately have the correct config on creation.
   */
  public initializeConfig(): void {
    const config = this.configManager.getActiveConfig();
    if (config) {
      this.activeConfig = config;
    }
  }
}
