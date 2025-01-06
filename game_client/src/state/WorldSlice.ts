// src/state/WorldSlice.ts
import { WorldState } from '../types';

/**
 * Manages the world data, such as walls or other map information.
 */
export class WorldSlice {
  private world: WorldState | null = null;

  public getWorld(): WorldState | null {
    return this.world;
  }

  public setWorld(newWorld: WorldState): void {
    this.world = newWorld;
  }

  public updateWorld(partialWorld: Partial<WorldState>): void {
    if (!this.world) {
      this.world = partialWorld as WorldState;
    } else {
      this.world = { ...this.world, ...partialWorld };
    }
  }

  public clearWorld(): void {
    this.world = null;
  }
}
