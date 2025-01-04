// src/game/Game.ts
import { Renderer } from './Renderer';
import { StateManager } from '../managers/StateManager';
import { Agent, GameStats, Position, WorldState } from '../types';

export class Game {
    private renderer: Renderer;
    private stateManager: StateManager;
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
    private selectedAgentId: string | null = null;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        this.renderer = new Renderer('gameCanvas');
        this.setupEventListeners();
        this.initializeGameLoop();
    }

    private setupEventListeners() {
        // Canvas click handling for agent selection
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Display toggles
        const gridToggle = document.getElementById('showGrid') as HTMLInputElement;
        const debugToggle = document.getElementById('showDebugInfo') as HTMLInputElement;
        const zonesToggle = document.getElementById('showZones') as HTMLInputElement;

        // Subscribe to state changes
        this.stateManager.subscribe('gameState', (state) => {
            this.isRunning = state.isRunning;
        });

        this.stateManager.subscribe('agents', (agents) => {
            this.agents = agents;
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
                }
            }
        });
    }

    private handleCanvasClick(event: MouseEvent) {
        const canvas = event.target as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Scale coordinates if canvas is resized
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const scaledX = x * scaleX;
        const scaledY = y * scaleY;

        const clickedAgent = this.findClickedAgent({ x: scaledX, y: scaledY });
        
        if (clickedAgent) {
            this.selectedAgentId = clickedAgent.id;
            this.renderer.setSelectedAgent(clickedAgent.id);
            this.stateManager.setSelectedAgent(clickedAgent);
        } else {
            this.selectedAgentId = null;
            this.renderer.setSelectedAgent(null);
            this.stateManager.setSelectedAgent(null);
        }
    }

    private findClickedAgent(clickPos: Position): Agent | null {
        const clickRadius = 15; // Detection radius for clicks
        return this.agents.find(agent => {
            const dx = agent.position.x - clickPos.x;
            const dy = agent.position.y - clickPos.y;
            return Math.sqrt(dx * dx + dy * dy) <= clickRadius;
        }) || null;
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
        // Update local state based on deltaTime
        this.updateLocalState(deltaTime);
        // Update stats
        this.updateStats();
    }

    private updateLocalState(deltaTime: number) {
        // Smooth interpolation for agent positions if needed
        this.agents.forEach(agent => {
            if (agent.targetPosition) {
                const dx = agent.targetPosition.x - agent.position.x;
                const dy = agent.targetPosition.y - agent.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 1) {
                    const speed = 0.1; // Adjust based on your needs
                    agent.position.x += dx * speed;
                    agent.position.y += dy * speed;
                }
            }
        });
    }

    private updateStats() {
        // Update team counts
        this.stats.red_agents = this.agents.filter(a => a.team === 'red').length;
        this.stats.blue_agents = this.agents.filter(a => a.team === 'blue').length;
    }

    private render() {
        // Pass world state to renderer
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
      
        this.sendCommand({ type: 'toggle_game' });
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
        return this.agents.find(agent => agent.id === this.selectedAgentId) || null;
    }

    public getStats(): GameStats {
        return this.stats;
    }

    public getWorldState(): WorldState | null {
        return this.worldState;
    }
}
