from typing import Dict, List, Optional
from loguru import logger
from .vector import Vector2D
from .models import Agent
from .behaviors import BehaviorSystem, BaseBehavior, BehaviorContext, AwarenessSystem, WanderBehavior, WanderTogetherBehavior, AttackBehavior, FleeBehavior
import math
import random
class BehaviorManager:
    def __init__(self):
        self.default_behaviors = {
            "wander": WanderBehavior(),
            "wander_together": WanderTogetherBehavior(),
            "attack": AttackBehavior(),
            "flee": FleeBehavior(),
        }
        self.custom_behaviors: Dict[str, str] = {}  # Maps behavior ID -> behavior code
        self.agent_behaviors: Dict[str, str] = {}   # Maps agent ID -> behavior ID

    def get_available_behaviors(self) -> List[Dict[str, str]]:
        """Fetch all behaviors (default + custom)."""
        behaviors = []
        for behavior_name in self.default_behaviors:
            behaviors.append({
                "id": behavior_name,
                "name": behavior_name.replace("_", " ").title(),
                "type": "default",
            })
        for behavior_id, code in self.custom_behaviors.items():
            behaviors.append({
                "id": behavior_id,
                "name": f"Custom Behavior {behavior_id}",
                "type": "custom",
                "code": code,
            })
        return behaviors

    def add_behavior(self, behavior_id: str, behavior_code: str) -> bool:
        """Add or update a custom behavior."""
        try:
            # Validate the behavior code if needed
            # For example, check if it's valid Python or matches expected behavior format.
            self.custom_behaviors[behavior_id] = behavior_code
            logger.info(f"Custom behavior {behavior_id} added/updated.")
            return True
        except Exception as e:
            logger.error(f"Failed to add behavior {behavior_id}: {e}")
            return False

    def assign_behavior_to_agent(self, agent_id: str, behavior_id: str) -> bool:
        """Assign a behavior to an agent."""
        if behavior_id in self.default_behaviors or behavior_id in self.custom_behaviors:
            self.agent_behaviors[agent_id] = behavior_id
            logger.info(f"Assigned behavior {behavior_id} to agent {agent_id}.")
            return True
        logger.error(f"Behavior {behavior_id} not found.")
        return False

    def get_agent_behavior(self, agent_id: str) -> Optional[str]:
        """Get the behavior ID currently assigned to an agent."""
        return self.agent_behaviors.get(agent_id)

    def execute_behavior(self, agent: Agent, nearby_agents: List[Agent]) -> Vector2D:
        """Execute the behavior assigned to an agent."""
        behavior_id = self.get_agent_behavior(agent.id)
        if not behavior_id:
            logger.warning(f"No behavior assigned to agent {agent.id}. Defaulting to 'wander'.")
            behavior = self.default_behaviors["wander"]
        elif behavior_id in self.default_behaviors:
            behavior = self.default_behaviors[behavior_id]
        else:
            behavior_code = self.custom_behaviors.get(behavior_id)
            if not behavior_code:
                logger.warning(f"Custom behavior {behavior_id} not found. Defaulting to 'wander'.")
                behavior = self.default_behaviors["wander"]
            else:
                # Dynamically execute the custom behavior
                behavior = self._compile_and_execute_behavior(behavior_code, agent, nearby_agents)
        
        # Prepare the context
        awareness = AwarenessSystem()  # or use the existing instance
        agents_by_zone = awareness.get_agents_by_zone(agent, nearby_agents)
        context = BehaviorContext(
            agent=agent,
            agents_by_zone=agents_by_zone,
            current_behavior=behavior_id,  # Use the string ID for clarity
            time_in_behavior=0,  # Could be tracked elsewhere
        )
        return behavior.execute(context)

    def _compile_and_execute_behavior(self, behavior_code: str, agent: Agent, nearby_agents: List[Agent]) -> BaseBehavior:
        """Compile and execute custom behavior code."""
        try:
            # Create a local context for execution
            local_context = {
                "Vector2D": Vector2D,
                "math": math,
                "random": random,
                "Agent": Agent,
                "logger": logger,
                "agent": agent,
                "nearby_agents": nearby_agents,
            }
            exec(behavior_code, {}, local_context)
            behavior_class = local_context.get("CustomBehavior")
            if not behavior_class:
                logger.error("Custom behavior does not define 'CustomBehavior' class.")
                return WanderBehavior()  # Fallback
            return behavior_class()
        except Exception as e:
            logger.error(f"Error executing custom behavior: {e}")
            return WanderBehavior()  # Fallback
