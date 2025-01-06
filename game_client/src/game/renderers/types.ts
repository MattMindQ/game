// src/game/renderers/types.ts
export interface Position {
    x: number;
    y: number;
}

export interface Viewport {
    x: number;
    y: number;
    scale: number;
    rotation: number;
}

export interface RenderLayer {
    zIndex: number;
    visible: boolean;
    render: (ctx: CanvasRenderingContext2D) => void;
}

export interface RenderBuffer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    isDirty: boolean;
}

export interface Camera {
    position: Position;
    scale: number;
    rotation: number;
}

export interface RenderStats {
    fps: number;
    frameTime: number;
    drawCalls: number;
}