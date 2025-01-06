// src/game/Game.ts
import { Renderer } from './Renderer';
import { StateManager } from '../managers/StateManager';
import { UserInputManager } from '../managers/UserInputManager';
import { Agent, GameStats, WorldState } from '../types';

export class Game {
    private renderer: Renderer;
    private stateManager: StateManager;
    private inputManager: UserInputManager;
    private agents: Agent[] = [];
    private worldState: WorldState | null = null;
    private stats: GameStats = {
        fps: 0,
        red_agents: 0,
        blue_agents: 0,
        red_kills: 0,
        blue_kills: 0,
        total_deaths: 0
    };
    private isRunning = false;
    private lastFrameTime = 0;
    private frameCount = 0;
    private lastFpsUpdate = 0;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        this.renderer = new Renderer('gameCanvas');
        
        // Initialize input manager after renderer
        this.inputManager = new UserInputManager(stateManager);
        this.inputManager.setRenderer(this.renderer);
        
        this.setupEventListeners();
        this.initializeGameLoop();
    }

    private setupEventListeners() {
        // Display toggles
        const gridToggle = document.getElementById('showGrid') as HTMLInputElement;
        const debugToggle = document.getElementById('showDebugInfo') as HTMLInputElement;
        const zonesToggle = document.getElementById('showZones') as HTMLInputElement;

        // Subscribe to state changes
        this.stateManager.subscribe('gameState', (state) => {
            this.isRunning = state.isRunning;
            if (!this.isRunning) {
                this.inputManager.disableInput();
            } else {
                this.inputManager.enableInput();
            }
        });

        this.stateManager.subscribe('agents', (agents) => {
            // Ensure agents is always an array
            if (Array.isArray(agents)) {
                this.agents = agents;
            } else {
                console.error('Received non-array agents:', agents);
                this.agents = [];
            }
        });

        this.stateManager.subscribe('stats', (stats) => {
            this.stats = stats;
        });

        this.stateManager.subscribe('world', (worldState) => {
            if (worldState && worldState.walls) {
                this.worldState = worldState;
            }
        });

        // Setup display toggles
        gridToggle?.addEventListener('change', (e) => {
            this.renderer.toggleGrid((e.target as HTMLInputElement).checked);
        });
        debugToggle?.addEventListener('change', (e) => {
            this.renderer.toggleDebug((e.target as HTMLInputElement).checked);
        });
        zonesToggle?.addEventListener('change', (e) => {
            this.renderer.toggleZones((e.target as HTMLInputElement).checked);
        });

        // Set initial toggle states
        this.renderer.toggleGrid(gridToggle?.checked ?? true);
        this.renderer.toggleDebug(debugToggle?.checked ?? true);
        this.renderer.toggleZones(zonesToggle?.checked ?? false);

        // Handle window resize
        window.addEventListener('resize', () => {
            const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
            if (canvas) {
                const parent = canvas.parentElement;
                if (parent) {
                    canvas.width = parent.clientWidth;
                    canvas.height = parent.clientWidth * 0.6;
                    this.renderer.handleResize();
                }
            }
        });
    }

    private initializeGameLoop() {
        const gameLoop = (timestamp: number) => {
            // Calculate FPS
            if (timestamp - this.lastFpsUpdate >= 1000) {
                this.stats.fps = this.frameCount;
                this.frameCount = 0;
                this.lastFpsUpdate = timestamp;
            }
            this.frameCount++;

            // Update game state
            if (this.isRunning) {
                const deltaTime = timestamp - this.lastFrameTime;
                this.update(deltaTime);
            }

            // Render
            this.render();

            // Store frame time
            this.lastFrameTime = timestamp;

            // Request next frame
            requestAnimationFrame(gameLoop);
        };

        // Start the game loop
        requestAnimationFrame(gameLoop);
    }

    private update(deltaTime: number) {
        this.updateLocalState(deltaTime);
        this.updateStats();
    }

    private updateLocalState(deltaTime: number) {
        // Add safety check
        if (!Array.isArray(this.agents)) {
            console.error('Agents is not an array:', this.agents);
            this.agents = [];
            return;
        }

        this.agents.forEach(agent => {
            if (agent.targetPosition) {
                const dx = agent.targetPosition.x - agent.position.x;
                const dy = agent.targetPosition.y - agent.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 1) {
                    const speed = 0.1;
                    agent.position.x += dx * speed;
                    agent.position.y += dy * speed;
                }
            }
        });
    }


    private updateStats() {
        this.stats.red_agents = this.agents.filter(a => a.team === 'red').length;
        this.stats.blue_agents = this.agents.filter(a => a.team === 'blue').length;
    }

    private render() {
        // Add safety check
        if (!Array.isArray(this.agents)) {
            console.error('Agents is not an array in render:', this.agents);
            this.agents = [];
        }

        console.log('Rendering agents:', this.agents.length);
        this.renderer.render(this.agents, this.stats, this.worldState);
    }

    // Public methods for external control
    public start() {
        this.isRunning = true;
        this.stateManager.setGameRunning(true);
    }

    public pause() {
        this.isRunning = false;
        this.stateManager.setGameRunning(false);
        this.stateManager.sendCommand({ type: 'toggle_game' });
    }

    public togglePause() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    public addAgent(team: 'red' | 'blue') {
        this.stateManager.requestAddAgent(team);
    }

    public updateAgentBehavior(agentId: string, behaviorUpdate: any) {
        this.stateManager.updateAgentBehavior(agentId, behaviorUpdate);
    }

    public getSelectedAgent(): Agent | null {
        return this.stateManager.getSelectedAgent();
    }

    public getStats(): GameStats {
        return this.stats;
    }

    public getWorldState(): WorldState | null {
        return this.worldState;
    }

    // Camera control methods
    public centerOnAgent(agentId: string) {
        const agent = this.agents.find(a => a.id === agentId);
        if (agent) {
            this.renderer.centerOnPosition(agent.position);
        }
    }

    public resetView() {
        this.renderer.resetViewport();
    }
}