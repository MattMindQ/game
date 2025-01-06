from uuid import UUID
from datetime import datetime
from loguru import logger
from game_server.game.state.manager import StateManager
from game_server.game.state.synchronization import StateSynchronizer
from game_server.game.state.world_state import WorldState
from game_server.game.state.combat_state import CombatState
from game_server.game.state.config_state import ConfigState
from game_server.game.state.agent_state import AgentState
from game_server.game.state.base_state import BaseState
from game_server.game.vector import Vector2D

class WebSocketDebugger:
    def __init__(self):
        # Initialize components
        self.state_manager = StateManager()
        self.synchronizer = StateSynchronizer(self.state_manager)
        
        # Initialize core states
        bounds = (0, 0, 800, 600)
        self.world_state = WorldState(bounds)
        self.combat_state = CombatState()
        self.config_state = ConfigState()
        self.agent_state = AgentState(self.combat_state, bounds)
        
        # Register states
        self.state_ids = {
            "world_state": UUID('00000000-0000-0000-0000-000000000001'),
            "combat_state": UUID('00000000-0000-0000-0000-000000000002'),
            "config_state": UUID('00000000-0000-0000-0000-000000000003'),
            "agent_state": UUID('00000000-0000-0000-0000-000000000004')
        }
        
        self._register_state("world_state", self.world_state)
        self._register_state("combat_state", self.combat_state)
        self._register_state("config_state", self.config_state)
        self._register_state("agent_state", self.agent_state)
    
    def _register_state(self, state_name: str, state: BaseState) -> None:
        """Register a state and add synchronization observer."""
        state_id = self.state_ids[state_name]
        logger.debug(f"Registering state {state_name} with ID {state_id}")
        self.state_manager.register_state(type(state), state.get_value(), state_id)
        self.synchronizer.mark_for_sync(state_id)
    
    def simulate_state_changes(self):
        """Simulate changes in the game states to see WebSocket data structure."""
        # Modify world state
        self.world_state.initialize()
        logger.info("Initialized world state")
        
        # Add a wall to the world state
        world_value = self.world_state.get_value()
        wall = {
            "position": {"x": 100, "y": 100},
            "width": 10,
            "height": 10
        }
        world_value.world_component.add_wall(wall)
        self.world_state.set_value(world_value)
        logger.info("Added a wall to the world state")
        
        # Simulate adding an agent
        agent_id = self.agent_state.add_agent(
            team="red",
            position=Vector2D(200, 200),
            world=self.world_state.get_value().world_component
        )
        logger.info(f"Added agent {agent_id} to the agent state")


    
    def get_websocket_data(self):
        """Retrieve and log the data structure passed to the frontend."""
        logger.info("Synchronizing states and retrieving data for WebSocket")
        self.synchronizer.synchronize()
        updates = self.synchronizer.get_delta_update()
        
        logger.info("Final WebSocket Data:")
        logger.info(updates)
        return updates

if __name__ == "__main__":
    # Initialize debugger
    debugger = WebSocketDebugger()
    
    # Simulate state changes
    debugger.simulate_state_changes()
    
    # Retrieve and display WebSocket data structure
    websocket_data = debugger.get_websocket_data()
    print("WebSocket Data Structure:")
    print(websocket_data)
