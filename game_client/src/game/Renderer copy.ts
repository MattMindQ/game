// src/game/Renderer.ts

import { Agent, GameStats, WorldState } from '../types';
import { WorldRenderer } from './WorldRenderer';

export class Renderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private worldRenderer: WorldRenderer;
    private gridSize: number = 50;
    private showGrid: boolean = true;
    private showDebug: boolean = true;
    private showZones: boolean = false;
    private selectedAgentId: string | null = null;

    // Zone configurations
    private zones = {
        visual: { range: 150, color: 'rgba(59, 130, 246, 0.1)' },      // blue-500
        recognition: { range: 100, color: 'rgba(245, 158, 11, 0.1)' }, // yellow-500
        combat: { range: 30, color: 'rgba(239, 68, 68, 0.1)' }         // red-500
    };

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');
        this.ctx = context;
        this.worldRenderer = new WorldRenderer(this.ctx);

        this.setupCanvas();
        this.bindEvents();
    }

    private setupCanvas() {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientWidth * 0.6; // 3:5 aspect ratio
        }
    }

    private bindEvents() {
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }

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

    public render(agents: Agent[], stats?: GameStats, world?: WorldState) {
        this.clear();
        if (this.showGrid) this.drawGrid();

        // Render the world (walls, holes, etc.)
        this.worldRenderer.renderWorld(world);

        // Draw zones for selected agent first
        if (this.showZones && this.selectedAgentId) {
            const selectedAgent = agents.find(a => a.id === this.selectedAgentId);
            if (selectedAgent) {
                this.drawAwarenessZones(selectedAgent);
            }
        }

        this.drawAgents(agents);
        if (this.showDebug) this.drawDebugInfo(agents, stats);
    }

    private drawAwarenessZones(agent: Agent) {
        Object.entries(this.zones)
            .sort((a, b) => b[1].range - a[1].range)
            .forEach(([zoneName, zone]) => {
                this.ctx.beginPath();
                this.ctx.arc(agent.position.x, agent.position.y, zone.range, 0, Math.PI * 2);
                this.ctx.fillStyle = zone.color;
                this.ctx.fill();

                this.ctx.strokeStyle = zone.color.replace('0.1', '0.3');
                this.ctx.setLineDash([5, 5]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            });
    }

    private clear() {
        this.ctx.fillStyle = '#1f2937'; // Tailwind gray-800
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawGrid() {
        this.ctx.strokeStyle = '#374151'; // Tailwind gray-700
        this.ctx.lineWidth = 1;

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

    private drawAgents(agents: Agent[]) {
        agents.forEach(agent => {
            if (agent.customBehavior) {
                this.ctx.beginPath();
                this.ctx.arc(agent.position.x, agent.position.y, 15, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#10B981';
                this.ctx.setLineDash([2, 2]);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            this.ctx.beginPath();
            this.ctx.arc(agent.position.x, agent.position.y, 10, 0, Math.PI * 2);
            this.ctx.fillStyle = agent.team === 'red' ? '#ef4444' : '#3b82f6';
            this.ctx.fill();

            const directionX = agent.position.x + Math.cos(agent.rotation) * 15;
            const directionY = agent.position.y + Math.sin(agent.rotation) * 15;
            this.ctx.beginPath();
            this.ctx.moveTo(agent.position.x, agent.position.y);
            this.ctx.lineTo(directionX, directionY);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.drawHealthBar(agent);

            if (agent.id === this.selectedAgentId) {
                this.drawSelectionIndicator(agent);
            }
        });
    }

    private drawHealthBar(agent: Agent) {
        const barWidth = 30;
        const barHeight = 4;
        const x = agent.position.x - barWidth / 2;
        const y = agent.position.y - 20;

        this.ctx.fillStyle = '#4b5563';
        this.ctx.fillRect(x, y, barWidth, barHeight);

        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(x, y, barWidth * (agent.health / 100), barHeight);
    }

    private drawSelectionIndicator(agent: Agent) {
        this.ctx.strokeStyle = '#fbbf24';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(agent.position.x, agent.position.y, 20, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    private drawDebugInfo(agents: Agent[], stats?: GameStats) {
        if (!stats) return;

        const fontSize = 14;
        this.ctx.font = `${fontSize}px monospace`;
        this.ctx.fillStyle = '#ffffff';

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

    public canvasToGrid(x: number, y: number): { x: number, y: number } {
        return {
            x: Math.floor(x / this.gridSize),
            y: Math.floor(y / this.gridSize)
        };
    }

    public gridToCanvas(gridX: number, gridY: number): { x: number, y: number } {
        return {
            x: gridX * this.gridSize + this.gridSize / 2,
            y: gridY * this.gridSize + this.gridSize / 2
        };
    }
}
