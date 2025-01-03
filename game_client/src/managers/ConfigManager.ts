//src/managers/ConfigManager.ts
import { GameConfig } from '../types/config';

export class ConfigManager {
    private activeConfig: GameConfig | null = null;
    private savedConfigs: GameConfig[] = [];
    private subscribers: Set<(config: GameConfig) => void> = new Set();

    constructor() {
        this.loadDefaultConfig();
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
                respawnTime: 3000
            }
        };
        this.notifySubscribers();
    }

    public subscribe(callback: (config: GameConfig) => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notifySubscribers() {
        if (this.activeConfig) {
            this.subscribers.forEach(callback => callback(this.activeConfig!));
        }
    }

    public getActiveConfig(): GameConfig | null {
        return this.activeConfig;
    }

    public getSavedConfigs(): GameConfig[] {
        return this.savedConfigs;
    }

    public async saveCurrentConfig(name: string, description?: string): Promise<void> {
        if (!this.activeConfig) return;

        const newConfig: GameConfig = {
            ...this.activeConfig,
            id: crypto.randomUUID(),
            name,
            description,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.savedConfigs.push(newConfig);
        // TODO: Implement backend save
    }

    public updateConfigParameter<K extends keyof GameConfig['parameters']>(
        key: K,
        value: GameConfig['parameters'][K]
    ) {
        if (!this.activeConfig) return;

        this.activeConfig = {
            ...this.activeConfig,
            parameters: {
                ...this.activeConfig.parameters,
                [key]: value
            },
            updatedAt: new Date()
        };

        this.notifySubscribers();
    }

    public loadConfig(configId: string) {
        const config = this.savedConfigs.find(c => c.id === configId);
        if (config) {
            this.activeConfig = { ...config };
            this.notifySubscribers();
        }
    }
}