// src/managers/CombatManager.ts
import { CombatState } from '../types';

type Subscriber = (data: CombatState) => void;

export class CombatManager {
  private combatState: CombatState;
  private subscribers: Set<Subscriber> = new Set();

  constructor() {
    this.combatState = {
      stats: {
        red_kills: 0,
        blue_kills: 0,
        red_agents: 0,
        blue_agents: 0,
        total_deaths: 0,
      },
      dead_agents: [],
      recent_kills: [],
    };
  }

  // -----------------------------------------------------------
  // Subscriptions
  // -----------------------------------------------------------
  public subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.combatState));
  }

  // -----------------------------------------------------------
  // Combat State Management
  // -----------------------------------------------------------
  public updateCombatState(partialCombat: Partial<CombatState>): void {
    this.combatState = {
      ...this.combatState,
      ...partialCombat,
      stats: { ...this.combatState.stats, ...partialCombat.stats },
    };
    this.notifySubscribers();
  }

  public recordKill(killerTeam: string, victimTeam: string): void {
    this.combatState.stats.total_deaths++;
    if (killerTeam === 'red') this.combatState.stats.red_kills++;
    if (killerTeam === 'blue') this.combatState.stats.blue_kills++;
    this.combatState.recent_kills.push({ killer_team: killerTeam, victim_team: victimTeam });

    this.notifySubscribers();
  }

  public addDeadAgent(agentId: string): void {
    this.combatState.dead_agents.push(agentId);
    this.notifySubscribers();
  }

  // -----------------------------------------------------------
  // Getters
  // -----------------------------------------------------------
  public getCombatState(): CombatState {
    return this.combatState;
  }
}
