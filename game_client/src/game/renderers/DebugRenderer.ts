// src/game/renderers/DebugRenderer.ts
import { Agent, GameStats, Position } from '../../types';
import { BaseRenderer } from './BaseRenderer';

interface DebugZone {
    range: number;
    color: string;
    label?: string;
}

interface DebugSettings {
    showGrid: boolean;
    showDebug: boolean;
    showZones: boolean;
    showVectors: boolean;
    showPerformance: boolean;
}

export class DebugRenderer extends BaseRenderer {
    private gridSize: number = 50;
    private selectedAgentId: string | null = null;
    private frameTime: number = 0;
    private settings: DebugSettings = {
        showGrid: true,
        showDebug: true,
        showZones: false,
        showVectors: false,
        showPerformance: true
    };

    private zones: Record<string, DebugZone> = {
        visual: { range: 150, color: 'rgba(59, 130, 246, 0.1)', label: 'Visual Range' },
        recognition: { range: 100, color: 'rgba(245, 158, 11, 0.1)', label: 'Recognition' },
        combat: { range: 30, color: 'rgba(239, 68, 68, 0.1)', label: 'Combat Range' }
    };

    public setSelectedAgent(agentId: string | null) {
        this.selectedAgentId = agentId;
    }

    public toggleGrid(show: boolean) {
        this.settings.showGrid = show;
    }

    public toggleDebug(show: boolean) {
        this.settings.showDebug = show;
    }

    public toggleZones(show: boolean) {
        this.settings.showZones = show;
    }

    public setFrameTime(time: number) {
        this.frameTime = time;
    }

    public render(agents: Agent[], stats?: GameStats) {
        this.ctx.save();
        
        try {
            // Draw world-space debug elements
            this.transformContext();
            
            if (this.settings.showGrid) {
                this.drawGrid();
            }
            
            if (this.settings.showZones && this.selectedAgentId) {
                const selectedAgent = agents.find(a => a.id === this.selectedAgentId);
                if (selectedAgent) {
                    this.drawAwarenessZones(selectedAgent);
                }
            }

            if (this.settings.showVectors) {
                this.drawAgentVectors(agents);
            }

            // Reset transform for screen-space debug elements
            this.ctx.restore();
            this.ctx.save();

            if (this.settings.showDebug) {
                this.drawDebugInfo(agents, stats);
            }

            if (this.settings.showPerformance) {
                this.drawPerformanceMetrics();
            }
        } finally {
            this.ctx.restore();
        }
    }

    private drawGrid() {
        const viewport = this.getViewport();
        const { width, height } = this.canvas;
        
        // Calculate grid boundaries in world space
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(width, height);

        // Adjust grid start/end positions
        const startX = Math.floor(topLeft.x / this.gridSize) * this.gridSize;
        const startY = Math.floor(topLeft.y / this.gridSize) * this.gridSize;
        const endX = Math.ceil(bottomRight.x / this.gridSize) * this.gridSize;
        const endY = Math.ceil(bottomRight.y / this.gridSize) * this.gridSize;

        this.setStrokeStyle('#374151', 1 / viewport.scale);

        // Draw vertical lines
        for (let x = startX; x <= endX; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = startY; y <= endY; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    private drawAwarenessZones(agent: Agent) {
        const viewport = this.getViewport();
        
        Object.entries(this.zones)
            .sort((a, b) => b[1].range - a[1].range)
            .forEach(([zoneName, zone]) => {
                // Draw zone circle
                this.ctx.beginPath();
                this.ctx.arc(
                    agent.position.x,
                    agent.position.y,
                    zone.range,
                    0,
                    Math.PI * 2
                );
                this.setFillStyle(zone.color);
                this.ctx.fill();

                // Draw zone border
                this.setStrokeStyle(
                    zone.color.replace('0.1', '0.3'),
                    1 / viewport.scale,
                    [5 / viewport.scale, 5 / viewport.scale]
                );
                this.ctx.stroke();
                this.clearDash();

                // Draw zone label if provided
                if (zone.label) {
                    const labelPos = this.getZoneLabelPosition(agent.position, zone.range, zoneName);
                    this.drawWorldText(
                        zone.label,
                        labelPos,
                        zone.color.replace('0.1', '0.8'),
                        12 / viewport.scale
                    );
                }
            });
    }

    private getZoneLabelPosition(center: Position, radius: number, zoneName: string): Position {
        const angle = {
            visual: Math.PI / 4,
            recognition: -Math.PI / 4,
            combat: 0
        }[zoneName] || 0;

        return {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius
        };
    }

    private drawAgentVectors(agents: Agent[]) {
        const viewport = this.getViewport();
        
        agents.forEach(agent => {
            if (agent.velocity) {
                // Draw velocity vector
                this.drawVector(
                    agent.position,
                    agent.velocity,
                    '#10B981',
                    30 / viewport.scale
                );
            }
            
            if (agent.targetPosition) {
                // Draw target vector
                const targetVector = {
                    x: agent.targetPosition.x - agent.position.x,
                    y: agent.targetPosition.y - agent.position.y
                };
                this.drawVector(
                    agent.position,
                    targetVector,
                    '#F59E0B',
                    30 / viewport.scale
                );
            }
        });
    }

    private drawVector(start: Position, vector: Position, color: string, scale: number = 1) {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length === 0) return;

        const normalized = {
            x: vector.x / length,
            y: vector.y / length
        };

        const end = {
            x: start.x + normalized.x * scale,
            y: start.y + normalized.y * scale
        };

        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.setStrokeStyle(color, 2 / this.getViewport().scale);
        this.ctx.stroke();

        // Draw arrowhead
        this.drawArrowhead(end, normalized, color);
    }

    private drawArrowhead(pos: Position, dir: Position, color: string) {
        const viewport = this.getViewport();
        const size = 8 / viewport.scale;
        const angle = Math.atan2(dir.y, dir.x);

        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(
            pos.x - size * Math.cos(angle - Math.PI / 6),
            pos.y - size * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            pos.x - size * Math.cos(angle + Math.PI / 6),
            pos.y - size * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.setFillStyle(color);
        this.ctx.fill();
    }

    private drawWorldText(text: string, position: Position, color: string, size: number) {
        this.ctx.font = `${size}px monospace`;
        this.setFillStyle(color);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, position.x, position.y);
    }

    private drawDebugInfo(agents: Agent[], stats?: GameStats) {
        if (!stats) return;

        const fontSize = 14;
        this.ctx.font = `${fontSize}px monospace`;
        this.setFillStyle('#ffffff');

        const info = [
            `FPS: ${Math.round(stats.fps || 0)}`,
            `Agents: ${agents.length}`,
            `Red Team: ${stats.red_agents}`,
            `Blue Team: ${stats.blue_agents}`,
            `Total Deaths: ${stats.total_deaths}`,
            `Viewport Scale: ${this.getViewport().scale.toFixed(2)}x`
        ];

        info.forEach((text, i) => {
            this.ctx.fillText(text, 10, 20 + i * (fontSize + 5));
        });
    }

    private drawPerformanceMetrics() {
        const fontSize = 12;
        this.ctx.font = `${fontSize}px monospace`;
        this.setFillStyle('#9CA3AF');

        const metrics = [
            `Frame Time: ${this.frameTime.toFixed(2)}ms`,
            `Draw Calls: ${this.ctx.drawCalls || 0}`,
        ];

        metrics.forEach((text, i) => {
            this.ctx.fillText(
                text,
                this.canvas.width - 150,
                20 + i * (fontSize + 5)
            );
        });
    }
}