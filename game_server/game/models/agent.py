# game/models/agent.py

import math
import random
import uuid
from typing import Dict, List, Optional, Any, Tuple
from loguru import logger
from ..behaviors import BehaviorType, BehaviorExecutor
from ..vector import Vector2D
from ..world.world import World
from .stats import CombatStats, MovementStats
from .physics import Physics
import time

class Agent:
    def __init__(self, team: str, position: Vector2D, world: World, bounds: Tuple[float, float, float, float]):
        self.id: str = str(uuid.uuid4())
        self.team: str = team
        self.world = world
        self.bounds = bounds
        
        # Core systems
        self.physics = Physics(
            position=position,
            velocity=Vector2D(random.uniform(-1, 1), random.uniform(-1, 1)),
            acceleration=Vector2D(0, 0),
            radius=10.0
        )
        
        self.combat = CombatStats(
            attack_damage=random.uniform(10, 20)
        )
        
        self.movement = MovementStats(
            max_speed=random.uniform(2, 4),
            max_force=0.5
        )
        
        # State tracking
        self.target_id: Optional[str] = None
        self.wander_angle: float = random.uniform(0, math.pi * 2)
        
        # For behavior execution only (state managed elsewhere)
        self.behavior_executor = BehaviorExecutor()
        self.current_behavior: Optional[str] = None

    @property
    def position(self) -> Vector2D:
        return self.physics.position
    
    @position.setter
    def position(self, value: Vector2D):
        self.physics.position = value
    
    @property
    def velocity(self) -> Vector2D:
        return self.physics.velocity
    
    @velocity.setter
    def velocity(self, value: Vector2D):
        self.physics.velocity = value

    def update_behavior(self, current_behavior: BehaviorType, nearby_agents: List['Agent']) -> None:
        """Update agent behavior using current behavior from state"""
        try:
            # Execute behavior and get force
            behavior_force = self.behavior_executor.execute_behavior(
                self, 
                nearby_agents,
                current_behavior
            )
            self.physics.stored_force = behavior_force
            
            # Update current behavior for serialization
            self.current_behavior = current_behavior.name
            
            # Handle combat if we have a target
            if self.target_id:
                target = next((a for a in nearby_agents if a.id == self.target_id), None)
                if target and self.combat.can_attack():
                    distance = (target.position - self.position).magnitude()
                    if distance <= self.combat.attack_range:
                        self.attack(target)
                        
        except Exception as e:
            logger.error(f"Error updating agent behavior {self.id}: {e}")

    def update_position(self) -> None:
        try:
            self.physics.update(self.movement)
        except Exception as e:
            logger.error(f"Error updating agent position {self.id}: {e}")

    def attack(self, target: 'Agent') -> bool:
        try:
            if not self.combat.can_attack():
                return False
            
            self.combat.last_attack_time = time.time()
            was_fatal = target.combat.take_damage(self.combat.attack_damage)
            
            if was_fatal:
                logger.info(f"Agent {self.id} killed agent {target.id}")
                
            return was_fatal
        except Exception as e:
            logger.error(f"Error in attack from agent {self.id} to {target.id}: {e}")
            return False

    def to_dict(self) -> Dict[str, Any]:
        """Convert Agent to a serializable dictionary"""
        try:
            return {
                "id": self.id,
                "team": self.team,
                "position": {"x": self.position.x, "y": self.position.y},
                "velocity": {"x": self.velocity.x, "y": self.velocity.y},
                "health": self.combat.health,
                "behavior": self.current_behavior,
                "target_id": self.target_id,
            }
        except Exception as e:
            logger.error(f"Error serializing agent {self.id}: {e}")
            return {
                "id": self.id,
                "error": str(e),
            }