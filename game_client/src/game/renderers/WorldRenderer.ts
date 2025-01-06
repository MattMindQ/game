// src/game/renderers/WorldRenderer.ts
import { WorldState, WorldObject } from '../../types';
import { BaseRenderer } from './BaseRenderer';

export class WorldRenderer extends BaseRenderer {
    private readonly wallColor = '#374151';
    private spatialHash: SpatialHash;

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        super(ctx, canvas);
        this.spatialHash = new SpatialHash(50); // Grid size of 50
        this.initializeLayers();
    }

    private initializeLayers() {
        this.addLayer('background', {
            zIndex: 0,
            visible: true,
            render: (ctx) => this.renderBackground(ctx)
        });

        this.addLayer('walls', {
            zIndex: 1,
            visible: true,
            render: (ctx) => this.renderWalls(ctx)
        });
    }

    public render(world?: WorldState): void {
        if (!world || !world.walls) return;

        this.transformContext();
        
        try {
            // Update spatial hash
            this.spatialHash.clear();
            world.walls.forEach(wall => this.spatialHash.insert(wall));

            // Get visible objects based on viewport
            const visibleBounds = this.getVisibleBounds();
            const visibleObjects = this.spatialHash.query(visibleBounds);

            // Render visible objects
            this.renderVisibleObjects(visibleObjects);
        } finally {
            this.restoreContext();
        }
    }

    private renderVisibleObjects(objects: WorldObject[]) {
        this.ctx.fillStyle = this.wallColor;
        
        objects.forEach(obj => {
            if (this.isValidWall(obj)) {
                const screenPos = this.worldToScreen(obj.x, obj.y);
                const screenScale = this.viewport.scale;
                this.ctx.fillRect(
                    screenPos.x,
                    screenPos.y,
                    obj.width * screenScale,
                    obj.height * screenScale
                );
            }
        });
    }

    private getVisibleBounds() {
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(this.canvas.width, this.canvas.height);
        return {
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y
        };
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

// Add these utility classes

class ParticleSystem {
    private particles: Particle[] = [];
    
    public addParticle(particle: Particle) {
        this.particles.push(particle);
    }
    
    public update(deltaTime: number) {
        this.particles = this.particles.filter(p => p.isAlive());
        this.particles.forEach(p => p.update(deltaTime));
    }
    
    public render(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => p.render(ctx));
    }
}

class SpatialHash {
    private cells: Map<string, WorldObject[]>;
    private cellSize: number;

    constructor(cellSize: number) {
        this.cells = new Map();
        this.cellSize = cellSize;
    }

    private getCellKey(x: number, y: number): string {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    public insert(obj: WorldObject): void {
        const startX = Math.floor(obj.x / this.cellSize);
        const startY = Math.floor(obj.y / this.cellSize);
        const endX = Math.floor((obj.x + obj.width) / this.cellSize);
        const endY = Math.floor((obj.y + obj.height) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = this.getCellKey(x, y);
                if (!this.cells.has(key)) {
                    this.cells.set(key, []);
                }
                this.cells.get(key)?.push(obj);
            }
        }
    }

    public query(bounds: { x: number; y: number; width: number; height: number }): WorldObject[] {
        const startX = Math.floor(bounds.x / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

        const result = new Set<WorldObject>();

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = this.getCellKey(x, y);
                const cell = this.cells.get(key);
                if (cell) {
                    cell.forEach(obj => result.add(obj));
                }
            }
        }

        return Array.from(result);
    }

    public clear(): void {
        this.cells.clear();
    }
}