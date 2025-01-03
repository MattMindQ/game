# game_server/game/state/agent_state.py

from typing import Dict, List, Any, Optional
from loguru import logger

from ..models import Agent
from ..behaviors import BehaviorType
from ..vector import Vector2D
from .combat_state import CombatState
from ..world.world import World

class AgentState:
    def __init__(self, combat_state: CombatState, bounds: tuple):
        self.agents: Dict[str, Agent] = {}
        self.combat_state = combat_state
        self.bounds = bounds

    def add_agent(self, team: str, position: Vector2D, world: World) -> str:
        """Add a new agent to the game"""
        try:
            # Create agent with position and world reference
            agent = Agent(
                team=team,
                position=position,
                world=world,
                bounds=self.bounds
            )
            
            self.agents[agent.id] = agent
            
            # Update combat stats
            self.combat_state.update_team_count(team, 1)
            
            logger.info(f"Added new agent {agent.id} to team {team}")
            return agent.id
            
        except Exception as e:
            logger.error(f"Error adding agent: {e}")
            raise

    def remove_agent(self, agent_id: str, killer_team: Optional[str] = None) -> None:
        """Remove an agent from the game"""
        if agent_id in self.agents:
            agent = self.agents[agent_id]
            try:
                # Handle death in combat state
                self.combat_state.handle_agent_death(agent, killer_team)
                
                # Remove from active agents
                del self.agents[agent_id]
                
            except Exception as e:
                logger.error(f"Error removing agent {agent_id}: {e}")
                raise

    def update_behaviors(self) -> None:
        """Update all agent behaviors"""
        agents_list = list(self.agents.values())
        for agent in agents_list:
            agent.update_behavior(agents_list)

    def get_agents_list(self) -> List[Agent]:
        """Get list of all active agents"""
        return list(self.agents.values())

    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID"""
        return self.agents.get(agent_id)

    def force_behavior(self, agent_id: str, behavior_type: BehaviorType) -> bool:
        """Force a specific behavior for an agent"""
        try:
            if agent_id in self.agents:
                agent = self.agents[agent_id]
                agent.behavior_system.current_behaviors[agent.id] = behavior_type
                agent.current_behavior = behavior_type.name
                logger.info(f"Forced behavior {behavior_type.name} for agent {agent_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error forcing behavior for agent {agent_id}: {e}")
            return False

    def get_team_count(self, team: str) -> int:
        """Get current count of agents for a team"""
        return sum(1 for agent in self.agents.values() if agent.team == team)

    def get_state(self) -> List[Dict[str, Any]]:
        """Get current agent states for serialization"""
        return [agent.to_dict() for agent in self.agents.values()]