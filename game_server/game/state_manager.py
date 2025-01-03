# game_server/game/state.py

import time
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from loguru import logger

from .models import Agent, DeadAgent, GameStats
from .behaviors import BehaviorType
from .state.config_state import ConfigState
from .state.world_state import WorldState
from .state.combat_state import CombatState
from .state.agent_state import AgentState

GAME_BOUNDS = (0, 0, 800, 600)

@dataclass
class GameState:
    def __init__(self):
        self.is_running: bool = False
        
        # Initialize state managers
        self.combat_state = CombatState()
        self.config_state = ConfigState()
        self.world_state = WorldState(GAME_BOUNDS)
        self.agent_state = AgentState(self.combat_state, GAME_BOUNDS)
        
        # Initialize world
        self.world_state.initialize()

        # For backward compatibility - delegate to agent_state
        self.agents = self.agent_state.agents
        self.dead_agents = self.combat_state.dead_agents
        self.stats = self.combat_state.stats
        self.recent_kills = self.combat_state.recent_kills

    async def initialize(self):
        """Initialize all state components"""
        await self.config_state.initialize()

    async def load_config(self, config_id: str) -> bool:
        """Load and apply configuration"""
        if await self.config_state.load_config(config_id):
            self.apply_config()
            return True
        return False

    def apply_config(self):
        """Apply current configuration to all game elements"""
        # Apply to existing agents
        for agent in self.agent_state.get_agents_list():
            self.config_state.apply_config_to_agent(agent)
            
        # Apply global settings
        self.config_state.apply_global_config()

    def add_agent(self, team: str) -> str:
        """Add a new agent to the game"""
        spawn_position = self.world_state.get_random_position()
        agent_id = self.agent_state.add_agent(
            team=team,
            position=spawn_position,
            world=self.world_state.get_world_reference()
        )
        
        # Apply configuration to new agent
        agent = self.agent_state.get_agent(agent_id)
        if agent:
            self.config_state.apply_config_to_agent(agent)
            
        return agent_id

    def remove_agent(self, agent_id: str, killer_team: Optional[str] = None):
        """Remove an agent and update statistics"""
        self.agent_state.remove_agent(agent_id, killer_team)

    def update(self) -> Dict[str, Any]:
        """Main update loop"""
        if not self.is_running:
            return {
                "timestamp": int(time.time() * 1000),
                "agents": [],
                "stats": self.combat_state.stats.to_dict()
            }
            
        try:
            self.combat_state.clear_recent_kills()
            agents_list = self.agent_state.get_agents_list()
            
            # 1. Behavior Update
            self.agent_state.update_behaviors()

            # 2. Physics Update
            self.world_state.update_physics(agents_list)

            # 3. Combat Resolution
            agents_to_remove, kill_events = self.combat_state.resolve_combat(agents_list)
            
            # 4. Remove dead agents
            for agent_id in agents_to_remove:
                killer_team = next(
                    (event["killer_team"] for event in kill_events 
                     if event["victim_id"] == agent_id),
                    None
                )
                self.agent_state.remove_agent(agent_id, killer_team)
                    
            state_update = {
                "timestamp": int(time.time() * 1000),
                "agents": self.agent_state.get_state(),
                "stats": self.combat_state.stats.to_dict(),
                "world": self.world_state.get_state()
            }
            
            combat_state = self.combat_state.get_state()
            if combat_state["recent_kills"]:
                state_update["recent_kills"] = combat_state["recent_kills"]
                
            return state_update
            
        except Exception as e:
            logger.error(f"Error updating game state: {e}")
            raise

    def get_state_update(self) -> Dict[str, Any]:
        """Get full state update"""
        return {
            "is_running": self.is_running,
            "team_counts": {
                "red": self.combat_state.stats.red_agents,
                "blue": self.combat_state.stats.blue_agents
            },
            "stats": self.combat_state.stats.to_dict(),
            "timestamp": int(time.time() * 1000),
            "world": self.world_state.get_state(),
            "config": self.config_state.get_config_state(),
            "user": self.config_state.get_user_state()
        }

    def add_wall(self, x: float, y: float, width: float, height: float, name: str = "Wall"):
        """Add a new wall to the world"""
        self.world_state.add_wall(x, y, width, height, name)

    def get_team_count(self, team: str) -> int:
        """Get current count of agents for a team"""
        return self.agent_state.get_team_count(team)
    
    def toggle_game_state(self) -> bool:
        """Toggle game running state"""
        try:
            self.is_running = not self.is_running
            logger.info(f"Game state toggled to: {'running' if self.is_running else 'stopped'}")
            return self.is_running
        except Exception as e:
            logger.error(f"Error toggling game state: {e}")
            raise
        
    def force_behavior(self, agent_id: str, behavior_type: BehaviorType) -> bool:
        """Force a specific behavior for an agent"""
        return self.agent_state.force_behavior(agent_id, behavior_type)