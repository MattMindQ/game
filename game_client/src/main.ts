// src/main.ts
import { StateManager } from './managers/StateManager';
import { Game } from './game/Game';
import { GameConnection } from './network/socket';
import { UserInputManager } from './managers/UserInputManager';
import { setupMonacoEditor } from './editor/setup';
import { setupUIToggles } from './ui/toggles';
import { setupCopilot } from './ui/copilot/setup';
import { Copilot } from './ui/copilot/Copilot';
import { DebugManager } from './utils/debug_check';

class GameApplication {
    private stateManager: StateManager;
    private game: Game;
    private connection: GameConnection;
    private userInputManager: UserInputManager;
    private editor: any; // Monaco editor instance
    private copilot: Copilot;
    private debugManager: DebugManager;

    constructor() {
        // Initialize core components
        this.stateManager = new StateManager();
        this.game = new Game(this.stateManager);
        this.connection = new GameConnection(this.stateManager);
        this.userInputManager = new UserInputManager(this.stateManager);
        
        // Initialize debug manager
        this.debugManager = new DebugManager(this.stateManager);
        this.connection.setDebugManager(this.debugManager);

        // Initialize UI
        this.setupUI();
        
        // Initialize code editor
        this.initializeEditor();

        // Setup WebSocket message handling
        this.setupMessageHandling();
    }

    private setupMessageHandling() {
        // Assuming connection has a method to subscribe to messages
        this.connection.onMessage((data) => {
            // Update debug manager with broadcast data
            this.debugManager.updateBroadcastData(data);
        });

        // Subscribe to agent selection changes
        this.stateManager.subscribe('selectedAgent', (agent) => {
            this.debugManager.updateSelectedAgent(agent?.id || null);
        });
    }

    private async initializeEditor() {
        try {
            this.editor = await setupMonacoEditor();
            this.setupEditorEvents();
        } catch (error) {
            console.error('Failed to initialize code editor:', error);
        }
    }

    private setupEditorCopilot() {
        const editorContainer = document.getElementById('codeEditor');
        if (editorContainer) {
            const context = {
                elementId: 'codeEditor',
                elementName: 'Behavior Editor',
                description: 'Editor for viewing and modifying agent behaviors'
            };
            const trigger = this.copilot.createTrigger(editorContainer, context);
            editorContainer.parentElement?.appendChild(trigger);
        }
    }

    private setupEditorEvents() {
        this.stateManager.subscribe('selectedAgent', (agent) => {
            const editorStatus = document.getElementById('editorStatus');

            if (agent) {
                if (editorStatus) editorStatus.textContent = `Selected agent ${agent.id.slice(0, 6)}...`;
                
                if (this.editor) {
                    this.editor.setValue(this.formatBehaviorInfo(agent));
                }
            } else {
                if (editorStatus) editorStatus.textContent = 'No agent selected';
                if (this.editor) {
                    this.editor.setValue('');
                }
            }
        });
    }

    private formatBehaviorInfo(agent: any): string {
        return `# Agent ${agent.id} Information
Team: ${agent.team}
Current Behavior: ${agent.currentBehavior || 'Unknown'}
Health: ${agent.health}%

# Current State
Position: (${Math.round(agent.position.x)}, ${Math.round(agent.position.y)})
Target ID: ${agent.target_id || 'None'}
`;
    }

    private setupUI() {
        // Setup window resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
        this.handleResize();
        
        // Setup all UI toggles
        setupUIToggles();

        // Initialize copilot with all necessary dependencies
        this.copilot = setupCopilot({
            connection: this.connection,
            stateManager: this.stateManager,
            editor: this.editor
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
    }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GameApplication();
});

export const DEFAULT_BEHAVIOR_CODE = `# Agent behavior function
def update(agent, nearby_agents):
    """
    Custom behavior update function.
    
    Parameters:
    - agent: Current agent state containing:
        - position: {x, y}
        - team: 'red' or 'blue'
        - health: current health value
        - target_id: ID of current target if any
    - nearby_agents: List of nearby agents with same properties
    
    Returns:
    - dict: Behavior weights between 0 and 1
    """
    # Example: Aggressive behavior
    weights = {
        'cohesion': 0.3,    # Stay somewhat close to teammates
        'alignment': 0.4,    # Follow team movement
        'separation': 0.8,   # Keep distance when too close
        'wander': 0.2,      # Low random movement
        'avoidWalls': 0.9,  # Strong wall avoidance
        'pursue': 0.9,      # High pursuit of enemies
        'flee': 0.3         # Low fleeing tendency
    }
    
    # Adjust weights based on health
    if agent['health'] < 30:
        weights['flee'] = 0.9       # Flee when health is low
        weights['pursue'] = 0.1     # Stop pursuing
        weights['cohesion'] = 0.9   # Stay close to team
    
    return weights
`;