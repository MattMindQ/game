// src/game/Renderer.ts
import { Agent, GameStats, WorldState, Position } from '../types';
import { WorldRenderer } from './renderers/WorldRenderer';
import { AgentRenderer } from './renderers/AgentRenderer';
import { DebugRenderer } from './renderers/DebugRenderer';
import { Viewport, RenderStats } from './renderers/types';

interface RenderConfig {
    gridSize: number;
    backgroundColor: string;
    minZoom: number;
    maxZoom: number;
}

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private worldRenderer: WorldRenderer;
    private agentRenderer: AgentRenderer;
    private debugRenderer: DebugRenderer;
    private config: RenderConfig;
    private viewport: Viewport;
    private lastRenderTime: number = 0;
    private frameCount: number = 0;
    private fps: number = 0;

    // Camera control
    private isDragging: boolean = false;
    private lastMousePos: Position | null = null;
    private renderStats: RenderStats = {
        fps: 0,
        frameTime: 0,
        drawCalls: 0
    };

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) throw new Error('Canvas element not found');
        
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');
        this.ctx = context;

        this.config = {
            gridSize: 50,
            backgroundColor: '#1f2937',
            minZoom: 0.5,
            maxZoom: 2.0
        };

        this.viewport = {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        };

        this.initializeRenderers();
        this.setupCanvas();
        this.bindEvents();
    }

    public handleResize(): void {
        this.setupCanvas();
        this.updateRenderersViewport();
    }

    private initializeRenderers(): void {
        try {
            this.worldRenderer = new WorldRenderer(this.ctx, this.canvas);
            this.agentRenderer = new AgentRenderer(this.ctx, this.canvas);
            this.debugRenderer = new DebugRenderer(this.ctx, this.canvas);
            this.updateRenderersViewport();
        } catch (error) {
            console.error('Error initializing renderers:', error);
            throw new Error('Failed to initialize renderers');
        }
    }

    private setupCanvas(): void {
        try {
            const parent = this.canvas.parentElement;
            if (!parent) throw new Error('Canvas parent element not found');

            const parentWidth = parent.clientWidth;
            this.canvas.width = parentWidth;
            this.canvas.height = parentWidth * 0.6;

            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
        } catch (error) {
            console.error('Error setting up canvas:', error);
        }
    }

    private bindEvents(): void {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }

    private handleMouseDown(event: MouseEvent): void {
        if (event.button === 1) {
            this.isDragging = true;
            this.lastMousePos = { x: event.clientX, y: event.clientY };
        }
    }

    private handleMouseMove(event: MouseEvent): void {
        if (this.isDragging && this.lastMousePos) {
            const dx = event.clientX - this.lastMousePos.x;
            const dy = event.clientY - this.lastMousePos.y;
            
            this.viewport.x += dx / this.viewport.scale;
            this.viewport.y += dy / this.viewport.scale;
            
            this.lastMousePos = { x: event.clientX, y: event.clientY };
            this.updateRenderersViewport();
        }
    }

    private handleMouseUp(): void {
        this.isDragging = false;
        this.lastMousePos = null;
    }

    private handleWheel(event: WheelEvent): void {
        event.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const worldPos = this.canvasToWorld(mouseX, mouseY);
        
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(
            Math.max(this.viewport.scale * zoomFactor, this.config.minZoom),
            this.config.maxZoom
        );

        this.viewport.scale = newScale;
        this.viewport.x = mouseX - worldPos.x * this.viewport.scale;
        this.viewport.y = mouseY - worldPos.y * this.viewport.scale;

        this.updateRenderersViewport();
    }

    public centerOnPosition(position: Position): void {
        const canvas = this.getCanvasDimensions();
        this.viewport.x = canvas.width / 2 - position.x * this.viewport.scale;
        this.viewport.y = canvas.height / 2 - position.y * this.viewport.scale;
        this.updateRenderersViewport();
    }

    private updateRenderersViewport(): void {
        [this.worldRenderer, this.agentRenderer, this.debugRenderer].forEach(renderer => {
            renderer.setViewport(this.viewport);
        });
    }

    public setSelectedAgent(agentId: string | null): void {
        this.agentRenderer.setSelectedAgent(agentId);
        this.debugRenderer.setSelectedAgent(agentId);
    }

    public toggleGrid(show: boolean): void {
        this.debugRenderer.toggleGrid(show);
    }

    public toggleDebug(show: boolean): void {
        this.debugRenderer.toggleDebug(show);
    }

    public toggleZones(show: boolean): void {
        this.debugRenderer.toggleZones(show);
    }

    private updateFPS(deltaTime: number): void {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastRenderTime >= 1000) {
            this.renderStats.fps = this.frameCount;
            this.renderStats.frameTime = deltaTime;
            this.frameCount = 0;
            this.lastRenderTime = now;
        }
    }

    public render(agents: Agent[], stats?: GameStats, world?: WorldState): void {
        const startTime = performance.now();

        try {
            this.clearCanvas();
            this.renderLayers(agents, stats, world);
            this.updateFPS(performance.now() - startTime);

            if (stats) {
                stats.fps = this.renderStats.fps;
            }
        } catch (error) {
            console.error('Error during render:', error);
        }
    }

    private clearCanvas(): void {
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private renderLayers(agents: Agent[], stats?: GameStats, world?: WorldState): void {
        this.ctx.save();
        try {
            this.debugRenderer.render(agents, stats);
            if (world) {
                this.worldRenderer.render(world);
            }
            this.agentRenderer.render(agents);
        } finally {
            this.ctx.restore();
        }
    }

    // Coordinate conversion utilities
    public canvasToWorld(x: number, y: number): Position {
        return {
            x: (x - this.viewport.x) / this.viewport.scale,
            y: (y - this.viewport.y) / this.viewport.scale
        };
    }

    public worldToCanvas(x: number, y: number): Position {
        return {
            x: x * this.viewport.scale + this.viewport.x,
            y: y * this.viewport.scale + this.viewport.y
        };
    }

    public canvasToGrid(x: number, y: number): Position {
        const worldPos = this.canvasToWorld(x, y);
        return {
            x: Math.floor(worldPos.x / this.config.gridSize),
            y: Math.floor(worldPos.y / this.config.gridSize)
        };
    }

    public gridToCanvas(gridX: number, gridY: number): Position {
        const worldX = gridX * this.config.gridSize + this.config.gridSize / 2;
        const worldY = gridY * this.config.gridSize + this.config.gridSize / 2;
        return this.worldToCanvas(worldX, worldY);
    }

    public getCanvasDimensions(): { width: number, height: number } {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    public getViewport(): Viewport {
        return { ...this.viewport };
    }

    public setViewport(viewport: Partial<Viewport>): void {
        this.viewport = { ...this.viewport, ...viewport };
        this.updateRenderersViewport();
    }

    public resetViewport(): void {
        this.viewport = {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        };
        this.updateRenderersViewport();
    }
}