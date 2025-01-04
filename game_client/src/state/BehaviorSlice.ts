import { BehaviorType, CustomBehavior } from '../types';

export class BehaviorSlice {
  private customBehaviors: Record<string, CustomBehavior> = {}; // Maps behaviorId -> CustomBehavior
  private agentBehaviors: Record<string, string> = {}; // Maps agentId -> behaviorId

  // Fetch all custom behaviors
  public getBehaviors(): CustomBehavior[] {
    return Object.values(this.customBehaviors);
  }

  // Fetch behavior by ID
  public getBehaviorById(behaviorId: string): CustomBehavior | null {
    return this.customBehaviors[behaviorId] || null;
  }

  // Fetch behavior assigned to an agent
  public getAgentBehavior(agentId: string): CustomBehavior | null {
    const behaviorId = this.agentBehaviors[agentId];
    return behaviorId ? this.getBehaviorById(behaviorId) : null;
  }

  // Add or update a custom behavior
  public addOrUpdateBehavior(behavior: CustomBehavior): void {
    this.customBehaviors[behavior.id] = behavior;
  }

  // Assign behavior to an agent
  public assignBehaviorToAgent(agentId: string, behaviorId: string): void {
    this.agentBehaviors[agentId] = behaviorId;
  }

  // Remove a behavior (and unassign it from all agents)
  public removeBehavior(behaviorId: string): void {
    delete this.customBehaviors[behaviorId];
    Object.keys(this.agentBehaviors).forEach((agentId) => {
      if (this.agentBehaviors[agentId] === behaviorId) {
        delete this.agentBehaviors[agentId];
      }
    });
  }
}
