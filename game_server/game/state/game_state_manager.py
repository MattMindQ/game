# game_server/game/state/game_state_manager.py
from typing import Dict, Type, Any
from uuid import UUID
from datetime import datetime
from loguru import logger

from .manager import StateManager
from .synchronization import StateSynchronizer, StateSyncObserver
from .world_state import WorldState
from .combat_state import CombatState
from .config_state import ConfigState
from .agent_state import AgentState
from .base_state import BaseState
from .behavior_state import BehaviorState

class GameStateManager:
    def __init__(self, bounds: tuple):
        self.state_manager = StateManager()
        self.synchronizer = StateSynchronizer(self.state_manager)
        
        # Initialize core states
        self.world_state = WorldState(bounds)
        self.combat_state = CombatState()
        self.config_state = ConfigState()
        self.behavior_state = BehaviorState()  # Add behavior state
        self.agent_state = AgentState(self.combat_state, self.behavior_state, bounds)  # Pass behavior state
        
        # Register states
        self.state_ids = {
            WorldState: UUID('00000000-0000-0000-0000-000000000001'),
            CombatState: UUID('00000000-0000-0000-0000-000000000002'),
            ConfigState: UUID('00000000-0000-0000-0000-000000000003'),
            BehaviorState: UUID('00000000-0000-0000-0000-000000000004'),
            AgentState: UUID('00000000-0000-0000-0000-000000000005')
        }
        
        # Register all states
        self._register_state(WorldState, self.world_state)
        self._register_state(CombatState, self.combat_state)
        self._register_state(ConfigState, self.config_state)
        self._register_state(BehaviorState, self.behavior_state)
        self._register_state(AgentState, self.agent_state)
        
        self.is_running: bool = False

    def get_state_update(self) -> Dict[str, Any]:
        try:
            state_update = {
                "is_running": self.is_running,
                "world": self.world_state.get_state(),
                "combat": self.combat_state.get_state(),
                "config": self.config_state.get_state(),
                "behaviors": self.behavior_state.get_state(),  # Add behaviors
                "team_counts": {
                    "red": self.agent_state.get_team_count("red"),
                    "blue": self.agent_state.get_team_count("blue")
                },
                "agents": self.agent_state.get_state(),
                "timestamp": int(datetime.now().timestamp() * 1000)
            }
            logger.info(f"Complete state update: {state_update}")
            return state_update
        except Exception as e:
            logger.exception("Error getting state update")
            raise
    
    def _register_state(self, state_type: Type, state: BaseState) -> None:
        """Register state and add synchronization observer"""
        state_id = self.state_ids[state_type]
        logger.debug(f"Registering state {state_type.__name__} with ID {state_id}")
        
        # Pass the state object directly
        self.state_manager.register_state(state_type, state, state_id)
        
        # Add sync observer
        observer = StateSyncObserver(self.synchronizer, state_id)
        state.add_observer(observer)
    
    async def initialize(self) -> None:
        """Initialize all states"""
        try:
            self.world_state.initialize()
            await self.config_state.initialize()
            self._initialize_agents()  # Add this line
            logger.info("Game state manager initialized")
        except Exception as e:
            logger.exception("Failed to initialize game state manager")
            raise
    
    def sync_states(self) -> Dict[str, Any]:
        try:
            self.synchronizer.synchronize()
            updates = self.synchronizer.get_delta_update()

            # Serialize updates for JSON compatibility
            serialized_updates = {
                state_id: {
                    "value": state_data["value"].to_dict() if hasattr(state_data["value"], "to_dict") else state_data["value"],
                    "version": state_data["version"],
                    "timestamp": state_data["timestamp"],
                }
                for state_id, state_data in updates.items()
            }

            logger.info(f"Synced states: {serialized_updates}")
            return serialized_updates
        except Exception as e:
            logger.exception("Error during state synchronization")
            return {}


    def _initialize_agents(self) -> None:
        """Initialize agents for both teams"""
        try:
            # Get world for collision checks
            world = self.world_state.get_value().world_component
            
            # Clear existing agents
            # We'll initialize 5 agents per team (or use config value)
            teams = ['red', 'blue']
            agents_per_team = 5
            
            for team in teams:
                for _ in range(agents_per_team):
                    # Get spawn position away from walls
                    position = self.world_state.get_random_position()
                    
                    # Create agent
                    self.agent_state.add_agent(
                        team=team,
                        position=position,
                        world=world
                    )
                    
            logger.info(f"Initialized {agents_per_team * 2} agents")
        except Exception as e:
            logger.exception("Failed to initialize agents")
            raise


