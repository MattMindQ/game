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
    total_deaths: 0
  };

  public getAgents(): Agent[] {
    return this.agents;
  }

  public setAgents(agents: Agent[]): void {
    this.agents = agents;
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
}
