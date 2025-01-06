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

  // -----------------------------------------------------------
  // Delta Update Methods
  // -----------------------------------------------------------

  /**
   * Update or merge partial custom behaviors into the state.
   * @param partialBehaviors Array of partially updated behaviors.
   */
  public updateBehaviors(partialBehaviors: Partial<CustomBehavior>[]): void {
    partialBehaviors.forEach((partialBehavior) => {
      const existingBehavior = this.customBehaviors[partialBehavior.id];
      if (existingBehavior) {
        this.customBehaviors[partialBehavior.id] = {
          ...existingBehavior,
          ...partialBehavior,
        };
      } else {
        this.customBehaviors[partialBehavior.id] = partialBehavior as CustomBehavior;
      }
    });
  }

  /**
   * Update or merge partial agent behavior assignments into the state.
   * @param partialAgentBehaviors Array of agent-behavior mappings.
   */
  public updateAgentBehaviors(
    partialAgentBehaviors: { agentId: string; behaviorId: string }[]
  ): void {
    partialAgentBehaviors.forEach(({ agentId, behaviorId }) => {
      this.agentBehaviors[agentId] = behaviorId;
    });
  }

  /**
   * Remove behaviors and unassign from agents as needed.
   * @param behaviorIds Array of behavior IDs to remove.
   */
  public removeBehaviors(behaviorIds: string[]): void {
    behaviorIds.forEach((behaviorId) => {
      this.removeBehavior(behaviorId);
    });
  }
}
