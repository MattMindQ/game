# tests/test_state_system.py

import pytest
from uuid import UUID
from datetime import datetime
from typing import Dict, Any, Type, Tuple

from game_server.game.state.interfaces import IState
from game_server.game.state.base_state import BaseState
from game_server.game.state.manager import StateManager
from game_server.game.state.game_state_manager import GameStateManager
from game_server.game.state.world_state import WorldState
from game_server.game.state.combat_state import CombatState
from game_server.game.state.agent_state import AgentState
from game_server.game.state.synchronization import StateSynchronizer
from game_server.game.vector import Vector2D
from game_server.game.behaviors import BehaviorType
from game_server.game.state.config_state import ConfigState
from game_server.game.vector import Vector2D
from game_server.game.world.wall import Wall  # Add this import
from loguru import logger
from game_server.game.state.interfaces import IStateObserver
@pytest.fixture
def state_manager():
    return StateManager()

@pytest.fixture
def game_state_manager():
    return GameStateManager(bounds=(0, 0, 800, 600))

@pytest.fixture
def synchronizer(state_manager):
    return StateSynchronizer(state_manager)

def test_base_state():
    """Test basic state functionality"""
    initial_value = {"test": "value"}
    state = BaseState(initial_value=initial_value)
    
    # Create a test observer
    class TestObserver(IStateObserver[Dict]):
        def __init__(self):
            self.called = False
            self.last_old = None
            self.last_new = None
            
        def on_state_changed(self, old_value: Dict, new_value: Dict) -> None:
            self.called = True
            self.last_old = old_value
            self.last_new = new_value
    
    observer = TestObserver()
    state.add_observer(observer)
    
    # Test initial value
    assert state.get_value() == initial_value
    
    # Test value update
    new_value = {"test": "updated"}
    state.set_value(new_value)
    assert state.get_value() == new_value
    assert observer.called
    assert observer.last_old == initial_value
    assert observer.last_new == new_value
    
    # Test reset
    state.reset()
    assert state.get_value() == initial_value
    assert observer.last_new == initial_value

def test_world_state():
    """Test world state functionality"""
    bounds = (0, 0, 800, 600)
    world_state = WorldState(bounds)
    
    # Test initialization
    world_state.initialize()
    state = world_state.get_value()
    assert state.bounds == bounds
    assert len(state.world_component.walls) > 0
    
    # Test random position generation
    position = world_state.get_random_position()
    assert isinstance(position, Vector2D)
    assert 0 <= position.x <= 800
    assert 0 <= position.y <= 600

def test_combat_state():
    """Test combat state functionality"""
    combat_state = CombatState()
    data = combat_state.get_value()
    
    # Test initial stats
    assert data.stats.red_kills == 0
    assert data.stats.blue_kills == 0
    
    # Test team count update
    combat_state.update_team_count("red", 1)
    data = combat_state.get_value()
    assert data.stats.red_agents == 1

def test_agent_state_management():
    """Test agent state management"""
    combat_state = CombatState()
    bounds = (0, 0, 800, 600)
    agent_state = AgentState(combat_state, bounds)
    
    # Test agent addition
    from game_server.game.world.world import World
    world = World()
    agent_id = agent_state.add_agent(
        team="red",
        position=Vector2D(100, 100),
        world=world
    )
    
    assert agent_id is not None
    assert agent_state.get_team_count("red") == 1
    
    # Test agent retrieval
    agent = agent_state.get_agent(agent_id)
    assert agent is not None
    assert agent.team == "red"
    
    # Test force behavior
    success = agent_state.force_behavior(agent_id, BehaviorType.WANDER)
    assert success
    agent = agent_state.get_agent(agent_id)
    assert agent.current_behavior == BehaviorType.WANDER.name

def test_state_synchronization(game_state_manager, synchronizer):
    """Test state synchronization"""
    # Make some state changes
    world_state = game_state_manager.world_state
    world_state_id = game_state_manager.state_ids[WorldState]
    
    # Verify observer setup
    assert len(world_state._observers) > 0, "World state should have observers"
    
    # Initial state
    world_state.initialize()
    initial_wall_count = len(world_state.get_value().world_component.walls)
    
    # Force a state change
    data = world_state.get_value()
    test_wall = Wall(
        position=Vector2D(100, 100),
        width=10,
        height=10
    )
    data.world_component.add_wall(test_wall)
    world_state.set_value(data)
    
    # Verify wall was added
    current_wall_count = len(world_state.get_value().world_component.walls)
    assert current_wall_count == initial_wall_count + 1, "Wall should be added"
    
    # Verify synchronization
    game_state_manager.synchronizer.synchronize()
    updates = game_state_manager.sync_states()
    
    # Debug output
    logger.info(f"World state ID: {world_state_id}")
    logger.info(f"Pending updates: {game_state_manager.synchronizer._pending_updates}")
    logger.info(f"Sync states: {game_state_manager.synchronizer._syncs}")
    logger.info(f"Initial wall count: {initial_wall_count}")
    logger.info(f"Current wall count: {current_wall_count}")
    logger.info(f"Updates: {updates}")
    
    assert len(updates) > 0, "Should have updates after state change"

def test_game_state_manager_integration():
    """Test full game state manager integration"""
    manager = GameStateManager(bounds=(0, 0, 800, 600))
    
    # Initialize states
    pytest.mark.asyncio
    async def test_init():
        await manager.initialize()
    
    # Add an agent
    world_component = manager.world_state.get_value().world_component
    agent_id = manager.agent_state.add_agent(
        team="red",
        position=Vector2D(100, 100),
        world=world_component
    )

@pytest.mark.asyncio
async def test_config_state():
    """Test configuration state management"""
    config_state = ConfigState()
    
    # Test initialization
    await config_state.initialize()
    data = config_state.get_value()
    
    assert data.active_user_id is not None
    
    # Test user state
    user_state = config_state.get_user_state()
    assert "id" in user_state
    assert "is_default" in user_state

def test_error_handling():
    """Test error handling in state management"""
    manager = StateManager()
    
    # Test invalid state access
    invalid_id = UUID('00000000-0000-0000-0000-000000000000')
    state = manager.get_state(dict, invalid_id)
    assert state is None
    
    # Test invalid behavior assignment
    agent_state = AgentState(CombatState(), (0, 0, 800, 600))
    success = agent_state.force_behavior("invalid_id", BehaviorType.WANDER)
    assert not success