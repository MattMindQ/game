// src/game/renderers/WorldRenderer.ts
import { WorldState } from '../../types';
import { BaseRenderer } from './BaseRenderer';

export class WorldRenderer extends BaseRenderer {
    // Simplified styling
    private readonly wallColor = '#374151';  // Tailwind gray-700 - single color for walls

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        super(ctx, canvas);
    }

    public render(world?: WorldState): void {
        if (!world || !world.walls) return;

        // Render walls
        this.renderWalls(world.walls);
    }

    private renderWalls(walls: Array<any>): void {
        // Set wall style once for all walls
        this.ctx.fillStyle = this.wallColor;

        walls.forEach(wall => {
            try {
                // Validate wall properties
                if (!this.isValidWall(wall)) return;

                // Draw wall as a simple filled rectangle
                this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

            } catch (error) {
                console.error('Error rendering wall:', error);
            }
        });
    }

    private isValidWall(wall: any): boolean {
        return (
            typeof wall.x === 'number' && 
            typeof wall.y === 'number' && 
            typeof wall.width === 'number' && 
            typeof wall.height === 'number'
        );
    }
}