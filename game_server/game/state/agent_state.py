from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from uuid import UUID
from loguru import logger

from .base_state import BaseState
from ..models import Agent
from ..behaviors import BehaviorType
from ..vector import Vector2D
from .combat_state import CombatState
import random
from ..behaviors import BehaviorContext
from ..behaviors import AwarenessSystem
from .behavior_state import BehaviorState

@dataclass
class AgentStateData:
    """Agent state data structure"""
    agents: Dict[str, Agent] = field(default_factory=dict)
    bounds: tuple = field(default=None)

    def to_dict(self) -> Dict[str, Any]:
        """Convert AgentStateData to a serializable dictionary"""
        return {
            "agents": {agent_id: agent.to_dict() for agent_id, agent in self.agents.items()},
            "bounds": self.bounds,
        }
    
class AgentState(BaseState[AgentStateData]):
    """Enhanced agent state with component-based architecture"""
    
    def __init__(self, combat_state: CombatState, behavior_state: BehaviorState, bounds: tuple):
        initial_data = AgentStateData(bounds=bounds)
        super().__init__(initial_value=initial_data)
        self.combat_state = combat_state
        self.behavior_state = behavior_state
    
    def add_agent(self, team: str, world: 'World', position: Optional[Vector2D] = None) -> str:
        """Add a new agent to the game with optional position"""
        try:
            data = self.get_value()
            
            # Generate random position if none provided
            agent_position = position if position is not None else self._generate_random_position(data.bounds)
            
            # Create agent
            agent = Agent(
                team=team,
                position=agent_position,
                world=world,
                bounds=data.bounds
            )
            
            # Store agent
            data.agents[agent.id] = agent
            self.set_value(data)
            
            # Initialize behavior state
            self.behavior_state.update_agent_behavior(agent.id, BehaviorType.WANDER)
            
            # Update combat stats
            self.combat_state.update_team_count(team, 1)
            
            logger.info(f"Added new agent {agent.id} to team {team} at position {agent_position}")
            return agent.id
            
        except Exception as e:
            logger.error(f"Error adding agent: {e}")
            raise
    
    def _generate_random_position(self, bounds: tuple) -> Vector2D:
        """Generate a random position within bounds"""
        if not bounds or len(bounds) != 4:
            raise ValueError("Invalid bounds for position generation")
            
        min_x, max_x, min_y, max_y = bounds
        random_x = random.uniform(min_x, max_x)
        random_y = random.uniform(min_y, max_y)
        return Vector2D(random_x, random_y)


    
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
                
                # Remove from behavior state
                self.behavior_state.remove_agent(agent_id)
                
                self.set_value(data)
                
        except Exception as e:
            logger.error(f"Error removing agent {agent_id}: {e}")
            raise
    

    
    def get_agents_list(self) -> List[Agent]:
        """Get list of all active agents"""
        return list(self.get_value().agents.values())
    
    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID"""
        return self.get_value().agents.get(agent_id)
    
    def update_behaviors(self) -> None:
        """Update all agent behaviors"""
        data = self.get_value()
        agents_list = list(data.agents.values())
        
        for agent in agents_list:
            # Get behavior context
            behavior_context = self._create_behavior_context(agent, agents_list)
            
            # Let behavior state handle the update
            new_behavior = self.behavior_state.decision_maker.evaluate(behavior_context)
            self.behavior_state.update_agent_behavior(agent.id, new_behavior)

    def _create_behavior_context(self, agent: Agent, agents_list: List[Agent]) -> BehaviorContext:
        """Create behavior context for decision making"""
        awareness = AwarenessSystem()
        agents_by_zone = awareness.get_agents_by_zone(agent, agents_list)
        current_behavior = self.behavior_state.get_agent_behavior(agent.id)
        time_in_behavior = self.behavior_state.get_value().behavior_timers.get(agent.id, 0)
        
        return BehaviorContext(
            agent=agent,
            agents_by_zone=agents_by_zone,
            current_behavior=current_behavior,
            time_in_behavior=time_in_behavior
        )

    def force_behavior(self, agent_id: str, behavior_id: str) -> bool:
        try:
            # Get behavior instance from manager
            behavior = self.behavior_manager.get_behavior_instance(behavior_id)
            if not behavior:
                return False
                
            # Update state
            data = self.get_value()
            data.current_behaviors[agent_id] = behavior
            self.set_value(data)
            return True
        except Exception as e:
            logger.error(f"Error forcing behavior: {e}")
            return False
    
    def get_team_count(self, team: str) -> int:
        """Get current count of agents for a team"""
        data = self.get_value()
        return sum(1 for agent in data.agents.values() if agent.team == team)
    
    def get_state(self) -> Dict[str, Any]:
        """Get serializable state"""
        return self.get_value().to_dict()
