// src/state/GameSlice.ts

import { GameStats } from '../types';

/**
 * Manages high-level game state such as whether the game
 * is running, and the connection status.
 */
export class GameSlice {
  private isRunning = false;
  private connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public setIsRunning(value: boolean): void {
    this.isRunning = value;
  }

  public getConnectionStatus(): 'connected' | 'disconnected' | 'error' {
    return this.connectionStatus;
  }

  public setConnectionStatus(status: 'connected' | 'disconnected' | 'error'): void {
    this.connectionStatus = status;
  }
}
