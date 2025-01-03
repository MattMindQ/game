// src/game/renderers/AgentRenderer.ts
import { Agent } from '../../types';
import { BaseRenderer } from './BaseRenderer';

export class AgentRenderer extends BaseRenderer {
    private selectedAgentId: string | null = null;

    public setSelectedAgent(agentId: string | null) {
        this.selectedAgentId = agentId;
    }

    public render(agents: Agent[]) {
        agents.forEach(agent => {
            this.drawAgent(agent);
            this.drawHealthBar(agent);
            
            if (agent.id === this.selectedAgentId) {
                this.drawSelectionIndicator(agent);
            }
        });
    }

    private drawAgent(agent: Agent) {
        // Custom behavior indicator
        if (agent.customBehavior) {
            this.ctx.beginPath();
            this.ctx.arc(agent.position.x, agent.position.y, 15, 0, Math.PI * 2);
            this.setStrokeStyle('#10B981', 1, [2, 2]);
            this.ctx.stroke();
            this.clearDash();
        }

        // Agent body
        this.ctx.beginPath();
        this.ctx.arc(agent.position.x, agent.position.y, 10, 0, Math.PI * 2);
        this.setFillStyle(agent.team === 'red' ? '#ef4444' : '#3b82f6');
        this.ctx.fill();

        // Direction indicator
        const directionX = agent.position.x + Math.cos(agent.rotation) * 15;
        const directionY = agent.position.y + Math.sin(agent.rotation) * 15;
        this.ctx.beginPath();
        this.ctx.moveTo(agent.position.x, agent.position.y);
        this.ctx.lineTo(directionX, directionY);
        this.setStrokeStyle('#ffffff', 2);
        this.ctx.stroke();
    }

    private drawHealthBar(agent: Agent) {
        const barWidth = 30;
        const barHeight = 4;
        const x = agent.position.x - barWidth / 2;
        const y = agent.position.y - 20;

        this.setFillStyle('#4b5563');
        this.ctx.fillRect(x, y, barWidth, barHeight);

        this.setFillStyle('#10b981');
        this.ctx.fillRect(x, y, barWidth * (agent.health / 100), barHeight);
    }

    private drawSelectionIndicator(agent: Agent) {
        this.setStrokeStyle('#fbbf24', 2, [5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(agent.position.x, agent.position.y, 20, 0, Math.PI * 2);
        this.ctx.stroke();
        this.clearDash();
    }
}