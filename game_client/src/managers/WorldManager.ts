// src/managers/WorldManager.ts
import { WorldState } from '../types';
import { WorldSlice } from '../state/WorldSlice';

type Subscriber = (data: any) => void;

export class WorldManager {
  private worldSlice: WorldSlice;
  private subscribers: Set<Subscriber> = new Set();

  constructor() {
    this.worldSlice = new WorldSlice();
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
  // World State Management
  // -----------------------------------------------------------
  public updateWorldState(partialWorld: Partial<WorldState>): void {
    this.worldSlice.updateWorld(partialWorld);
    this.notifySubscribers(this.worldSlice.getWorld());
  }

  public clearWorldState(): void {
    this.worldSlice.clearWorld();
    this.notifySubscribers(null);
  }

  // -----------------------------------------------------------
  // Getters
  // -----------------------------------------------------------
  public getWorldState(): WorldState | null {
    return this.worldSlice.getWorld();
  }

  public setWorldState(world: WorldState): void {
    this.worldSlice.setWorld(world);
    this.notifySubscribers(this.worldSlice.getWorld());
  }
}
