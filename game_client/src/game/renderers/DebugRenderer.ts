// src/game/renderers/DebugRenderer.ts
import { Agent, GameStats } from '../../types';
import { BaseRenderer } from './BaseRenderer';

export class DebugRenderer extends BaseRenderer {
    private gridSize: number = 50;
    private showGrid: boolean = true;
    private showDebug: boolean = true;
    private showZones: boolean = false;
    private selectedAgentId: string | null = null;

    private zones = {
        visual: { range: 150, color: 'rgba(59, 130, 246, 0.1)' },
        recognition: { range: 100, color: 'rgba(245, 158, 11, 0.1)' },
        combat: { range: 30, color: 'rgba(239, 68, 68, 0.1)' }
    };

    public setSelectedAgent(agentId: string | null) {
        this.selectedAgentId = agentId;
    }

    public toggleGrid(show: boolean) {
        this.showGrid = show;
    }

    public toggleDebug(show: boolean) {
        this.showDebug = show;
    }

    public toggleZones(show: boolean) {
        this.showZones = show;
    }

    public render(agents: Agent[], stats?: GameStats) {
        if (this.showGrid) this.drawGrid();
        
        if (this.showZones && this.selectedAgentId) {
            const selectedAgent = agents.find(a => a.id === this.selectedAgentId);
            if (selectedAgent) {
                this.drawAwarenessZones(selectedAgent);
            }
        }

        if (this.showDebug) this.drawDebugInfo(agents, stats);
    }

    private drawGrid() {
        this.setStrokeStyle('#374151', 1);

        for (let x = 0; x < this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    private drawAwarenessZones(agent: Agent) {
        Object.entries(this.zones)
            .sort((a, b) => b[1].range - a[1].range)
            .forEach(([zoneName, zone]) => {
                this.ctx.beginPath();
                this.ctx.arc(agent.position.x, agent.position.y, zone.range, 0, Math.PI * 2);
                this.setFillStyle(zone.color);
                this.ctx.fill();

                this.setStrokeStyle(zone.color.replace('0.1', '0.3'), 1, [5, 5]);
                this.ctx.stroke();
                this.clearDash();
            });
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
            `Total Deaths: ${stats.total_deaths}`
        ];

        info.forEach((text, i) => {
            this.ctx.fillText(text, 10, 20 + i * (fontSize + 5));
        });
    }
}