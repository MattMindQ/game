import { StateManager } from '../../managers/StateManager';
import { GameConnection } from '../../network/socket';

describe('GameConnection WebSocket Handling', () => {
    let mockSocket: WebSocket;
    let stateManager: StateManager;
    let gameConnection: GameConnection;

    beforeEach(() => {
        mockSocket = new WebSocket('ws://localhost:8000/ws');
        stateManager = new StateManager();
        gameConnection = new GameConnection(stateManager);
        (gameConnection as any).socket = mockSocket; // Replace real socket with mock
    });

    it('should handle state_update messages', () => {
        const stateUpdateMessage = {
            type: 'state_update',
            data: {
                agents: [
                    { id: 'agent1', health: 80, team: 'red', position: { x: 0, y: 0 } },
                ],
                world: { bounds: [0, 0, 800, 600], walls: [], holes: [], colines: [] },
            },
        };

        mockSocket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(stateUpdateMessage) }));

        const agents = stateManager.getAgents();
        const world = stateManager.getWorldState();

        expect(agents[0].health).toBe(80);
        expect(world?.bounds).toEqual([0, 0, 800, 600]);
    });
});
