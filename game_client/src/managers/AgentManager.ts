// src/managers/AgentManager.ts
import { Agent, GameStats, Position } from '../types';
import { AgentSlice } from '../state/AgentSlice';

type Subscriber = (data: any) => void;

export class AgentManager {
  private agentSlice: AgentSlice;
  private subscribers: Set<Subscriber> = new Set();
  private selectedAgent: Agent | null = null;

  constructor() {
    this.agentSlice = new AgentSlice();
  }

  // -----------------------------------------------------------
  // Subscriptions
  // -----------------------------------------------------------
  public subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(data: any) {
    this.subscribers.forEach((callback) => callback(data));
  }

  // -----------------------------------------------------------
  // Agent State Management
  // -----------------------------------------------------------
// Update this method in AgentManager class
// Add this helper function to validate agent objects
private isValidAgent(agent: any): agent is Agent {
    return (
      agent &&
      typeof agent === 'object' &&
      'id' in agent &&
      'team' in agent &&
      'position' in agent &&
      'health' in agent
    );
  }
  
  public updateAgents(agentData: any): void {
    try {
      let normalizedAgents: Agent[] = [];
  
      // Log the incoming data structure
      console.log('Incoming agent data structure:', agentData);
  
      // Handle the nested structure
      if (agentData.agents) {
        // We're receiving the outer structure, access the inner agents
        const agentsObj = agentData.agents;
        
        normalizedAgents = Object.entries(agentsObj)
          .filter(([key, value]) => 
            key !== 'bounds' && 
            this.isValidAgent(value)
          )
          .map(([_, agent]) => agent);
      } else {
        // We're receiving the direct agents object
        normalizedAgents = Object.entries(agentData)
          .filter(([key, value]) => 
            key !== 'bounds' && 
            this.isValidAgent(value)
          )
          .map(([_, agent]) => agent);
      }
  
      console.log('Normalized agents count:', normalizedAgents.length);
      console.log('Normalized agents:', normalizedAgents);
  
      // Update the AgentSlice only if we have valid agents
      if (normalizedAgents.length > 0) {
        this.agentSlice.setAgents(normalizedAgents);
        this.notifySubscribers(this.getAgents());
      } else {
        console.warn('No valid agents found in update data');
        console.log('Raw data received:', agentData);
      }
    } catch (error) {
      console.error('Error normalizing agents:', error);
      console.error('Agent data received:', agentData);
    }
  }

  public setSelectedAgent(agent: Agent | null): void {
    this.selectedAgent = agent;
    this.agentSlice.setSelectedAgent(agent);
    this.notifySubscribers(this.getSelectedAgent());
  }

  public updateAgentPosition(agentId: string, position: Position) {
    const agents = this.agentSlice.getAgents();
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      agent.position = position;
      this.notifySubscribers(agents);
    }
  }

  public updateTeamCounts(counts: { red: number; blue: number }) {
    this.agentSlice.updateStats({
      red_agents: counts.red,
      blue_agents: counts.blue,
    });
    this.notifySubscribers(this.agentSlice.getStats());
  }

  // -----------------------------------------------------------
  // Getters
  // -----------------------------------------------------------
  public getAgents(): Agent[] {
    return this.agentSlice.getAgents();
  }

  public getSelectedAgent(): Agent | null {
    return this.selectedAgent;
  }

  public getStats(): GameStats {
    return this.agentSlice.getStats();
  }
}
