import { StateManager } from '../../managers/StateManager';

describe('StateManager', () => {
    let stateManager: StateManager;

    beforeEach(() => {
        stateManager = new StateManager();
    });

    it('should update agents with partial updates', () => {
        const initialAgents = [
            { id: 'agent1', position: { x: 0, y: 0 }, health: 100, team: 'red' },
            { id: 'agent2', position: { x: 10, y: 10 }, health: 100, team: 'blue' },
        ];
        stateManager.updateAgents(initialAgents);

        const partialUpdates = [
            { id: 'agent1', position: { x: 5, y: 5 }, team: 'red' }, // Partial update
        ];
        stateManager.updateAgents(partialUpdates);

        const agents = stateManager.getAgents();
        expect(agents[0].position).toEqual({ x: 5, y: 5 });
        expect(agents[1].position).toEqual({ x: 10, y: 10 });
    });

    it('should update behaviors correctly', () => {
        const initialBehaviors = { behavior1: 'attack_code' };
        stateManager.updateBehaviors({ behaviors: initialBehaviors });

        const behaviorUpdates = { behavior1: 'aggressive_code' };
        stateManager.updateBehaviors({ behaviors: behaviorUpdates });

        const behaviors = stateManager.getBehaviors();
        expect(behaviors['behavior1']).toBe('aggressive_code');
    });
});
