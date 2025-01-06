# game/state/behavior_state.py

from dataclasses import dataclass, field
from typing import Dict, Any
from uuid import UUID
from datetime import datetime
from loguru import logger

from .base_state import BaseState
from ..behaviors import BehaviorType, DecisionMaker, AwarenessSystem

@dataclass
class BehaviorStateData:
    """Data structure for behavior state"""
    # Current behaviors for each agent
    current_behaviors: Dict[str, BehaviorType] = field(default_factory=dict)
    
    # Time spent in current behavior
    behavior_timers: Dict[str, float] = field(default_factory=dict)
    
    # Awareness system configuration
    awareness_configs: Dict[str, Dict[str, float]] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert state to serializable dictionary"""
        return {
            "current_behaviors": {
                agent_id: behavior.name 
                for agent_id, behavior in self.current_behaviors.items()
            },
            "behavior_timers": dict(self.behavior_timers),
            "awareness_configs": dict(self.awareness_configs)
        }

# game/state/behavior_state.py

class BehaviorState(BaseState[BehaviorStateData]):
    """Manages behavior state for all agents"""
    
    def __init__(self):
        initial_data = BehaviorStateData()
        super().__init__(initial_value=initial_data)
        self.decision_maker = DecisionMaker()
    
    def get_state(self) -> Dict[str, Any]:
        """Get serializable state for websocket communication"""
        try:
            data = self.get_value()
            return {
                "behaviors": {
                    agent_id: behavior.name 
                    for agent_id, behavior in data.current_behaviors.items()
                },
                "timers": data.behavior_timers,
                "awareness": data.awareness_configs
            }
        except Exception as e:
            logger.error(f"Error getting behavior state: {e}")
            return {
                "behaviors": {},
                "timers": {},
                "awareness": {}
            }

    def update_agent_behavior(self, agent_id: str, behavior: BehaviorType) -> None:
        """Update behavior for an agent"""
        try:
            data = self.get_value()
            
            # Record new behavior
            data.current_behaviors[agent_id] = behavior
            
            # Reset timer for new behavior
            data.behavior_timers[agent_id] = 0.0
            
            self.set_value(data)
            
            logger.info(f"Updated behavior for agent {agent_id} to {behavior.name}")
            
        except Exception as e:
            logger.error(f"Error updating agent behavior: {e}")
            raise

    def get_agent_behavior(self, agent_id: str) -> BehaviorType:
        """Get current behavior for an agent"""
        return self.get_value().current_behaviors.get(agent_id, BehaviorType.WANDER)
    
    def increment_behavior_timer(self, agent_id: str, delta_time: float) -> None:
        """Update time spent in current behavior"""
        try:
            data = self.get_value()
            current_time = data.behavior_timers.get(agent_id, 0.0)
            data.behavior_timers[agent_id] = current_time + delta_time
            self.set_value(data)
        except Exception as e:
            logger.error(f"Error updating behavior timer: {e}")
            raise
    
    def remove_agent(self, agent_id: str) -> None:
        """Clean up state when agent is removed"""
        try:
            data = self.get_value()
            data.current_behaviors.pop(agent_id, None)
            data.behavior_timers.pop(agent_id, None)
            self.set_value(data)
            logger.info(f"Removed behavior state for agent {agent_id}")
        except Exception as e:
            logger.error(f"Error removing agent behavior state: {e}")
            raise