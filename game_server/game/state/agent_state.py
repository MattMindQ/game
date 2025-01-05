from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from uuid import UUID
from loguru import logger

from .base_state import BaseState
from ..models import Agent
from ..behaviors import BehaviorType
from ..vector import Vector2D
from .combat_state import CombatState

@dataclass
class AgentStateData:
    """Agent state data structure"""
    agents: Dict[str, Agent] = field(default_factory=dict)
    behaviors: Dict[str, BehaviorType] = field(default_factory=dict)
    bounds: tuple = field(default=None)

class AgentState(BaseState[AgentStateData]):
    """Enhanced agent state with component-based architecture"""
    
    def __init__(self, combat_state: CombatState, bounds: tuple):
        initial_data = AgentStateData(bounds=bounds)
        super().__init__(initial_value=initial_data)
        self.combat_state = combat_state
    
    def add_agent(self, team: str, position: Vector2D, world: 'World') -> str:
        """Add a new agent to the game"""
        try:
            data = self.get_value()
            
            # Create agent
            agent = Agent(
                team=team,
                position=position,
                world=world,
                bounds=data.bounds
            )
            
            # Store agent
            data.agents[agent.id] = agent
            self.set_value(data)
            
            # Update combat stats
            self.combat_state.update_team_count(team, 1)
            
            logger.info(f"Added new agent {agent.id} to team {team}")
            return agent.id
            
        except Exception as e:
            logger.error(f"Error adding agent: {e}")
            raise
    
    def remove_agent(self, agent_id: str, killer_team: Optional[str] = None) -> None:
        """Remove an agent from the game"""
        try:
            data = self.get_value()
            if agent_id in data.agents:
                agent = data.agents[agent_id]
                
                # Handle death in combat state
                self.combat_state.handle_agent_death(agent, killer_team)
                
                # Remove from agents
                del data.agents[agent_id]
                if agent_id in data.behaviors:
                    del data.behaviors[agent_id]
                    
                self.set_value(data)
                
        except Exception as e:
            logger.error(f"Error removing agent {agent_id}: {e}")
            raise
    
    def update_behaviors(self) -> None:
        """Update all agent behaviors"""
        data = self.get_value()
        agents_list = list(data.agents.values())
        
        for agent in agents_list:
            agent.update_behavior(agents_list)
    
    def get_agents_list(self) -> List[Agent]:
        """Get list of all active agents"""
        return list(self.get_value().agents.values())
    
    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID"""
        return self.get_value().agents.get(agent_id)
    
    def force_behavior(self, agent_id: str, behavior_type: BehaviorType) -> bool:
        """Force a specific behavior for an agent"""
        try:
            data = self.get_value()
            if agent_id in data.agents:
                agent = data.agents[agent_id]
                agent.behavior_system.current_behaviors[agent.id] = behavior_type
                agent.current_behavior = behavior_type.name
                data.behaviors[agent_id] = behavior_type
                self.set_value(data)
                logger.info(f"Forced behavior {behavior_type.name} for agent {agent_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error forcing behavior for agent {agent_id}: {e}")
            return False
    
    def get_team_count(self, team: str) -> int:
        """Get current count of agents for a team"""
        data = self.get_value()
        return sum(1 for agent in data.agents.values() if agent.team == team)
    
    def get_state(self) -> List[Dict[str, Any]]:
        """Get serializable state"""
        return [agent.to_dict() for agent in self.get_value().agents.values()]