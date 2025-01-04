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

class GameApplication {
    private stateManager: StateManager;
    private game: Game;
    private connection: GameConnection;
    private userInputManager: UserInputManager;
    private editorManager: EditorManager;
    private debugManager: DebugManager;

    constructor() {
        this.initialize();
    }
    
    private async initialize() {
        try {
            // Load all HTML partials first
            await TemplateLoader.loadPartials();
    
            // Initialize core components
            this.stateManager = new StateManager();
            this.game = new Game(this.stateManager);
            this.connection = new GameConnection(this.stateManager);
            this.userInputManager = new UserInputManager(this.stateManager);
            
            // Initialize debug manager
            this.debugManager = new DebugManager(this.stateManager);
            this.connection.setDebugManager(this.debugManager);
    
            // Initialize editor
            this.editorManager = new EditorManager(this.stateManager);
            
            // Continue with component initialization
            await this.initializeComponents();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            // You might want to show a user-friendly error message here
        }
    }

    private async initializeComponents() {
        // Initialize editor
        await this.editorManager.initialize();

        // Initialize UI with editor instance
        this.setupUI();
        
        // Setup WebSocket message handling
        this.setupMessageHandling();
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