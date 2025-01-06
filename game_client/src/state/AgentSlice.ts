// src/state/AgentSlice.ts
import { Agent, GameStats } from '../types';

/**
 * Manages agent-related data and logic,
 * such as the agent list, selected agent, and game stats.
 */
export class AgentSlice {
  private agents: Agent[] = [];
  private selectedAgent: Agent | null = null;
  private stats: GameStats = {
    fps: 0,
    red_agents: 0,
    blue_agents: 0,
    red_kills: 0,
    blue_kills: 0,
    total_deaths: 0,
  };


  public setAgents(agents: Agent[]): void {
    if (!Array.isArray(agents)) {
      console.error('Expected an array of agents, received:', agents);
      return;
    }
  
    // Additional validation to ensure all items are valid agents
    const validAgents = agents.filter(agent => 
      agent && 
      typeof agent === 'object' &&
      'id' in agent &&
      'team' in agent &&
      'position' in agent
    );
  
    console.log('Setting valid agents:', validAgents.length);
    this.agents = validAgents;
  }
  
  public getAgents(): Agent[] {
    return this.agents;
  }

  public updateAgents(partialAgents: Partial<Agent[]>): void {
    if (!Array.isArray(partialAgents)) {
      console.error('Expected an array for partialAgents, received:', partialAgents);
      return;
    }

    partialAgents.forEach((updatedAgent) => {
      const index = this.agents.findIndex((agent) => agent.id === updatedAgent.id);
      if (index !== -1) {
        this.agents[index] = { ...this.agents[index], ...updatedAgent };
      } else {
        this.agents.push(updatedAgent as Agent);
      }
    });
  }

  public getSelectedAgent(): Agent | null {
    return this.selectedAgent;
  }

  public setSelectedAgent(agent: Agent | null): void {
    this.selectedAgent = agent;
  }

  public getStats(): GameStats {
    return this.stats;
  }

  /**
   * Updates only the fields in `stats` that are provided (partial update).
   */
  public updateStats(partialStats: Partial<GameStats>): void {
    this.stats = { ...this.stats, ...partialStats };
  }
  public debug(): void {
    console.log('Current agents:', this.agents.length, this.agents);
  }

}

