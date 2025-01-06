// src/game/renderers/BaseRenderer.ts
import { Viewport, RenderLayer, RenderBuffer, Position } from './types';

export abstract class BaseRenderer {
    protected ctx: CanvasRenderingContext2D;
    protected canvas: HTMLCanvasElement;
    protected viewport: Viewport;
    protected layers: Map<string, RenderLayer>;
    protected buffer: RenderBuffer;

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.layers = new Map();
        this.viewport = {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        };
        this.initializeBuffer();
    }

    private initializeBuffer(): void {
        const bufferCanvas = document.createElement('canvas');
        bufferCanvas.width = this.canvas.width;
        bufferCanvas.height = this.canvas.height;
        const bufferCtx = bufferCanvas.getContext('2d');
        
        if (!bufferCtx) throw new Error('Could not create buffer context');
        
        this.buffer = {
            canvas: bufferCanvas,
            ctx: bufferCtx,
            isDirty: true
        };
    }

    protected setStrokeStyle(color: string, width: number = 1, dash: number[] = []): void {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.setLineDash(dash);
    }

    protected setFillStyle(color: string): void {
        this.ctx.fillStyle = color;
    }

    protected clearDash(): void {
        this.ctx.setLineDash([]);
    }

    protected transformContext(): void {
        this.ctx.save();
        this.ctx.translate(this.viewport.x, this.viewport.y);
        this.ctx.scale(this.viewport.scale, this.viewport.scale);
        this.ctx.rotate(this.viewport.rotation);
    }

    protected restoreContext(): void {
        this.ctx.restore();
    }

    protected addLayer(name: string, layer: RenderLayer): void {
        this.layers.set(name, layer);
    }

    protected removeLayer(name: string): void {
        this.layers.delete(name);
    }

    public setViewport(viewport: Partial<Viewport>): void {
        this.viewport = { ...this.viewport, ...viewport };
        this.buffer.isDirty = true;
    }

    public getViewport(): Viewport {
        return { ...this.viewport };
    }

    protected worldToScreen(x: number, y: number): Position {
        return {
            x: (x - this.viewport.x) * this.viewport.scale,
            y: (y - this.viewport.y) * this.viewport.scale
        };
    }

    protected screenToWorld(x: number, y: number): Position {
        return {
            x: x / this.viewport.scale + this.viewport.x,
            y: y / this.viewport.scale + this.viewport.y
        };
    }

    public handleResize(): void {
        if (this.buffer) {
            this.buffer.canvas.width = this.canvas.width;
            this.buffer.canvas.height = this.canvas.height;
            this.buffer.isDirty = true;
        }
    }

    protected getCanvasDimensions(): { width: number; height: number } {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }
}