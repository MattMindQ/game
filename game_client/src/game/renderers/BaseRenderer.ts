// src/game/renderers/BaseRenderer.ts

export abstract class BaseRenderer {
    protected ctx: CanvasRenderingContext2D;
    protected canvas: HTMLCanvasElement;

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        this.ctx = ctx;
        this.canvas = canvas;
    }

    protected setStrokeStyle(color: string, width: number = 1, dash: number[] = []) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.setLineDash(dash);
    }

    protected setFillStyle(color: string) {
        this.ctx.fillStyle = color;
    }

    protected clearDash() {
        this.ctx.setLineDash([]);
    }
}