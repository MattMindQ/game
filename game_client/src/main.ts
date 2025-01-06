// src/main.ts
import { StateManager } from './managers/StateManager';
import { Game } from './game/Game';
import { GameConnection } from './network/socket';
import { UserInputManager } from './managers/UserInputManager';
import { setupUIToggles } from './ui/toggles';
import { setupCopilot } from './ui/copilot/setup';
import { DebugManager } from './utils/debug_check';
import { EditorManager } from './editor/EditorManager';
import { TemplateLoader } from './utils/templateLoader';
import { ConfigManager } from './managers/ConfigManager';

class GameApplication {
    private stateManager: StateManager;
    private game: Game;
    private connection: GameConnection;
    private userInputManager: UserInputManager;
    private editorManager: EditorManager;
    private debugManager: DebugManager;
    private configManager: ConfigManager;

    constructor() {
        this.initialize();
    }
    
    private async initialize() {
        try {
            // Load all HTML partials first
            await TemplateLoader.loadPartials();
    
            // Create and initialize ConfigManager first
            this.configManager = new ConfigManager();
            
            // Wait for DOM to be ready
            await this.waitForDOM();
            
            // Initialize core components with proper dependencies
            this.stateManager = new StateManager(this.configManager);
            this.game = new Game(this.stateManager);
            this.connection = new GameConnection(this.stateManager);
            this.userInputManager = new UserInputManager(this.stateManager);
            
            // Initialize UI components
            this.configManager.initializeUI('gameConfig');
            
            // Initialize remaining components
            this.debugManager = new DebugManager(this.stateManager);
            this.connection.setDebugManager(this.debugManager);
            this.editorManager = new EditorManager(this.stateManager);
            
            // Continue with component initialization
            await this.initializeComponents();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }

    private handleInitializationError(error: any): void {
        // Add user-friendly error handling
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <strong class="font-bold">Initialization Error!</strong>
                    <span class="block sm:inline">Failed to start the application. Please refresh the page.</span>
                </div>
            `;
        }
        console.error('Detailed error:', error);
    }

    private waitForDOM(): Promise<void> {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', () => resolve());
            }
        });
    }

    private async initializeComponents() {
        // Initialize editor
        await this.editorManager.initialize();

        // Initialize UI with editor instance
        this.setupUI();
        
        // Setup WebSocket message handling
        this.setupMessageHandling();

        // Setup config sync with backend
        this.setupConfigSync();
    }

    private setupConfigSync() {
        // Subscribe to config changes
        this.configManager.subscribe((config) => {
            // Send updated config to backend
            this.connection.sendCommand({
                type: 'update_config',
                data: config
            });
        });
    }

    private setupMessageHandling() {
        this.connection.onMessage((data) => {
            this.debugManager.updateBroadcastData(data);
        });

        this.stateManager.subscribe('selectedAgent', (agent) => {
            this.debugManager.updateSelectedAgent(agent?.id || null);
        });
    }

    private setupUI() {
        // Setup window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
        this.handleResize();
        
        // Setup all UI toggles
        setupUIToggles();

        // Initialize copilot with all necessary dependencies
        setupCopilot({
            connection: this.connection,
            stateManager: this.stateManager,
            editor: this.editorManager.getEditor()
        });
    }

    private handleResize() {
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (canvas) {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientWidth * 0.5625; 
            }
        }
        // Ensure editor layout is updated
        this.editorManager.layout();
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GameApplication();
});