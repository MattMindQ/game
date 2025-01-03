// src/game/Renderer.ts
import { Agent, GameStats, WorldState } from '../types';
import { WorldRenderer } from './renderers/WorldRenderer';
import { AgentRenderer } from './renderers/AgentRenderer';
import { DebugRenderer } from './renderers/DebugRenderer';

interface RenderConfig {
    gridSize: number;
    backgroundColor: string;
}

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private worldRenderer: WorldRenderer;
    private agentRenderer: AgentRenderer;
    private debugRenderer: DebugRenderer;
    private config: RenderConfig;
    private lastRenderTime: number = 0;
    private frameCount: number = 0;
    private fps: number = 0;

    constructor(canvasId: string) {
        // Initialize canvas
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) throw new Error('Canvas element not found');
        
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');
        this.ctx = context;

        // Default configuration
        this.config = {
            gridSize: 50,
            backgroundColor: '#1f2937' // Tailwind gray-800
        };

        // Initialize renderers
        this.initializeRenderers();
        
        // Setup canvas and events
        this.setupCanvas();
        this.bindEvents();
    }

    private initializeRenderers() {
        try {
            this.worldRenderer = new WorldRenderer(this.ctx, this.canvas);
            this.agentRenderer = new AgentRenderer(this.ctx, this.canvas);
            this.debugRenderer = new DebugRenderer(this.ctx, this.canvas);
        } catch (error) {
            console.error('Error initializing renderers:', error);
            throw new Error('Failed to initialize renderers');
        }
    }

    private setupCanvas() {
        try {
            const parent = this.canvas.parentElement;
            if (!parent) throw new Error('Canvas parent element not found');

            const parentWidth = parent.clientWidth;
            this.canvas.width = parentWidth;
            this.canvas.height = parentWidth * 0.6; // 3:5 aspect ratio

            // Enable image smoothing for better rendering
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
        } catch (error) {
            console.error('Error setting up canvas:', error);
        }
    }

    private bindEvents() {
        // Debounced resize handler
        let resizeTimeout: NodeJS.Timeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setupCanvas();
                // Force re-render after resize
                this.render([], undefined, undefined);
            }, 250);
        });
    }

    public setSelectedAgent(agentId: string | null) {
        try {
            this.agentRenderer.setSelectedAgent(agentId);
            this.debugRenderer.setSelectedAgent(agentId);
        } catch (error) {
            console.error('Error setting selected agent:', error);
        }
    }

    public toggleGrid(show: boolean) {
        this.debugRenderer.toggleGrid(show);
    }

    public toggleDebug(show: boolean) {
        this.debugRenderer.toggleDebug(show);
    }

    public toggleZones(show: boolean) {
        this.debugRenderer.toggleZones(show);
    }

    public render(agents: Agent[], stats?: GameStats, world?: WorldState) {
        try {
            // Clear canvas with background
            this.clearCanvas();

            // Calculate FPS
            this.updateFPS();

            // Update stats with current FPS if provided
            if (stats) {
                stats.fps = this.fps;
            }

            // Render layers in order
            this.renderLayers(agents, stats, world);

        } catch (error) {
            console.error('Error during render:', error);
        }
    }

    private clearCanvas() {
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private updateFPS() {
        const now = performance.now();
        const delta = now - this.lastRenderTime;
        this.frameCount++;

        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0;
            this.lastRenderTime = now;
        }
    }

    private renderLayers(agents: Agent[], stats?: GameStats, world?: WorldState) {
        // Save context state
        this.ctx.save();

        try {
            // Render grid and debug info first (background layer)
            this.debugRenderer.render(agents, stats);

            // Render world elements (middle layer)
            if (world) {
                this.worldRenderer.render(world);
            }

            // Render agents (top layer)
            this.agentRenderer.render(agents);
        } finally {
            // Restore context state
            this.ctx.restore();
        }
    }

    public canvasToGrid(x: number, y: number): { x: number, y: number } {
        return {
            x: Math.floor(x / this.config.gridSize),
            y: Math.floor(y / this.config.gridSize)
        };
    }

    public gridToCanvas(gridX: number, gridY: number): { x: number, y: number } {
        return {
            x: gridX * this.config.gridSize + this.config.gridSize / 2,
            y: gridY * this.config.gridSize + this.config.gridSize / 2
        };
    }

    public getCanvasDimensions(): { width: number, height: number } {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    public setRenderConfig(config: Partial<RenderConfig>) {
        this.config = { ...this.config, ...config };
    }
}