// src/managers/BehaviorManager.ts
import { BehaviorState } from '../types';

type Subscriber = (data: BehaviorState) => void;

export class BehaviorManager {
  private behaviorState: BehaviorState;
  private subscribers: Set<Subscriber> = new Set();

  constructor() {
    this.behaviorState = {
      behaviors: {},
      timers: {},
      awareness: {},
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
    this.subscribers.forEach((callback) => callback(this.behaviorState));
  }

  // -----------------------------------------------------------
  // Behavior State Management
  // -----------------------------------------------------------
  public updateBehaviors(partialBehaviors: Partial<BehaviorState>): void {
    this.behaviorState = {
      ...this.behaviorState,
      behaviors: { ...this.behaviorState.behaviors, ...partialBehaviors.behaviors },
      timers: { ...this.behaviorState.timers, ...partialBehaviors.timers },
      awareness: { ...this.behaviorState.awareness, ...partialBehaviors.awareness },
    };
    this.notifySubscribers();
  }

  public setBehavior(agentId: string, behavior: string): void {
    this.behaviorState.behaviors[agentId] = behavior;
    this.notifySubscribers();
  }

  public updateTimer(agentId: string, time: number): void {
    this.behaviorState.timers[agentId] = time;
    this.notifySubscribers();
  }

  public setAwareness(agentId: string, zoneConfig: any): void {
    this.behaviorState.awareness[agentId] = zoneConfig;
    this.notifySubscribers();
  }

  // -----------------------------------------------------------
  // Getters
  // -----------------------------------------------------------
  public getBehaviorState(): BehaviorState {
    return this.behaviorState;
  }
}
