// src/renderer/WorldRenderer.ts

import { WorldState } from '../types';

export class WorldRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public renderWorld(world?: WorldState) {
        if (!world) return;

        // Draw walls
        if (world.walls && Array.isArray(world.walls)) {
            world.walls.forEach(wall => {
                this.ctx.fillStyle = '#9CA3AF'; // Tailwind gray-400
                this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

                this.ctx.strokeStyle = '#6B7280'; // Tailwind gray-500
                this.ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);

                // Optional label
                if (wall.name) {
                    this.ctx.font = '12px sans-serif';
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillText(wall.name, wall.x + 5, wall.y + 15);
                }
            });
        }

        // Draw holes, colines, or other objects similarly, if desired
        if (world.holes && Array.isArray(world.holes)) {
            // Example: just outline a hole in red
            world.holes.forEach(hole => {
                this.ctx.strokeStyle = 'red';
                this.ctx.strokeRect(hole.x, hole.y, hole.width, hole.height);
            });
        }

        if (world.colines && Array.isArray(world.colines)) {
            // Example: draw lines
            world.colines.forEach(line => {
                this.ctx.strokeStyle = '#FBBF24'; // amber
                this.ctx.beginPath();
                this.ctx.moveTo(line.x, line.y);
                this.ctx.lineTo(line.x + line.width, line.y + line.height);
                this.ctx.stroke();
            });
        }
    }
}
