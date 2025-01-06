// src/game/renderers/AgentRenderer.ts
import { Agent } from '../../types';
import { BaseRenderer } from './BaseRenderer';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
}

class ParticleSystem {
    private particles: Particle[] = [];
    private readonly maxParticles = 100;

    public addParticle(x: number, y: number, color: string) {
        if (this.particles.length >= this.maxParticles) return;

        const particle: Particle = {
            x,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1.0,
            maxLife: 1.0,
            color
        };

        this.particles.push(particle);
    }

    public update(deltaTime: number) {
        this.particles = this.particles.filter(p => p.life > 0);

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime * 0.001; // Decrease life over time
        });
    }

    public render(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
    }
}

export class AgentRenderer extends BaseRenderer {
    private selectedAgentId: string | null = null;
    private particleSystem: ParticleSystem;
    private lastUpdate: number = 0;

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        super(ctx, canvas);
        this.particleSystem = new ParticleSystem();
        this.initializeLayers();
    }

    private initializeLayers() {
        this.addLayer('particles', {
            zIndex: 1,
            visible: true,
            render: (ctx) => this.particleSystem.render(ctx)
        });

        this.addLayer('agents', {
            zIndex: 2,
            visible: true,
            render: (ctx) => this.renderAgents(ctx)
        });
    }

    private renderAgents(ctx: CanvasRenderingContext2D) {
        // This method is called by the agents layer
        // Implementation handled in the main render method
    }

    public setSelectedAgent(agentId: string | null) {
        this.selectedAgentId = agentId;
        this.buffer.isDirty = true;

        if (agentId !== null) {
            // Create selection effect particles
            const agent = this.getAgentById(agentId);
            if (agent) {
                this.createSelectionParticles(agent);
            }
        }
    }

    private getAgentById(id: string): Agent | undefined {
        // This should be implemented based on your agent tracking system
        return undefined;
    }

    private createSelectionParticles(agent: Agent) {
        const screenPos = this.worldToScreen(agent.position.x, agent.position.y);
        for (let i = 0; i < 10; i++) {
            this.particleSystem.addParticle(
                screenPos.x,
                screenPos.y,
                agent.team === 'red' ? '#ef4444' : '#3b82f6'
            );
        }
    }

    public render(agents: Agent[]) {
        // Ensure agents is an array
        if (!Array.isArray(agents)) {
            console.error('AgentRenderer received non-array agents:', agents);
            return;
        }

        const now = performance.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;

        // Update particle system
        this.particleSystem.update(deltaTime);

        this.transformContext();
        
        try {
            // Sort layers by zIndex
            const sortedLayers = Array.from(this.layers.values())
                .sort((a, b) => a.zIndex - b.zIndex);

            // Render each visible layer
            for (const layer of sortedLayers) {
                if (layer.visible) {
                    layer.render(this.ctx);
                }
            }

            // Render agents with safety check
            agents.forEach(agent => {
                if (!agent || !agent.position) {
                    console.warn('Invalid agent:', agent);
                    return;
                }
                const screenPos = this.worldToScreen(agent.position.x, agent.position.y);
                this.drawAgent({ ...agent, position: screenPos });
                this.drawHealthBar({ ...agent, position: screenPos });
                
                if (agent.id === this.selectedAgentId) {
                    this.drawSelectionIndicator({ ...agent, position: screenPos });
                }
            });
        } catch (error) {
            console.error('Error in AgentRenderer:', error);
        } finally {
            this.restoreContext();
        }
    }

    private drawAgent(agent: Agent) {
        // Custom behavior indicator
        if (agent.customBehavior) {
            this.ctx.beginPath();
            this.ctx.arc(agent.position.x, agent.position.y, 15 * this.viewport.scale, 0, Math.PI * 2);
            this.setStrokeStyle('#10B981', 1 * this.viewport.scale, [2, 2]);
            this.ctx.stroke();
            this.clearDash();
        }

        // Agent body
        this.ctx.beginPath();
        this.ctx.arc(
            agent.position.x,
            agent.position.y,
            10 * this.viewport.scale,
            0,
            Math.PI * 2
        );
        this.setFillStyle(agent.team === 'red' ? '#ef4444' : '#3b82f6');
        this.ctx.fill();

        // Direction indicator
        if (agent.rotation !== undefined) {
            const directionX = agent.position.x + Math.cos(agent.rotation) * 15 * this.viewport.scale;
            const directionY = agent.position.y + Math.sin(agent.rotation) * 15 * this.viewport.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(agent.position.x, agent.position.y);
            this.ctx.lineTo(directionX, directionY);
            this.setStrokeStyle('#ffffff', 2 * this.viewport.scale);
            this.ctx.stroke();
        }
    }

    private drawHealthBar(agent: Agent) {
        const barWidth = 30 * this.viewport.scale;
        const barHeight = 4 * this.viewport.scale;
        const x = agent.position.x - barWidth / 2;
        const y = agent.position.y - 20 * this.viewport.scale;

        // Background
        this.setFillStyle('#4b5563');
        this.ctx.fillRect(x, y, barWidth, barHeight);

        // Health bar
        this.setFillStyle('#10b981');
        this.ctx.fillRect(x, y, barWidth * (agent.health / 100), barHeight);
        
        // Border
        this.setStrokeStyle('#000000', 1);
        this.ctx.strokeRect(x, y, barWidth, barHeight);
    }

    private drawSelectionIndicator(agent: Agent) {
        this.setStrokeStyle('#fbbf24', 2 * this.viewport.scale, [5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(
            agent.position.x,
            agent.position.y,
            20 * this.viewport.scale,
            0,
            Math.PI * 2
        );
        this.ctx.stroke();
        this.clearDash();
    }

    // Additional helper methods for effects
    public addDamageEffect(agent: Agent, amount: number) {
        const screenPos = this.worldToScreen(agent.position.x, agent.position.y);
        const color = amount > 0 ? '#ef4444' : '#10b981';
        
        for (let i = 0; i < Math.abs(amount) / 10; i++) {
            this.particleSystem.addParticle(screenPos.x, screenPos.y, color);
        }
    }

    public addSpawnEffect(agent: Agent) {
        const screenPos = this.worldToScreen(agent.position.x, agent.position.y);
        const color = agent.team === 'red' ? '#ef4444' : '#3b82f6';
        
        for (let i = 0; i < 20; i++) {
            this.particleSystem.addParticle(screenPos.x, screenPos.y, color);
        }
    }
}