# game_server/game/models.py
import math
import random
import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple
from loguru import logger
from .behaviors import BehaviorSystem
from .vector import Vector2D
from .world.world import World

@dataclass
class GameStats:
    red_kills: int = 0
    blue_kills: int = 0
    red_agents: int = 0
    blue_agents: int = 0
    total_deaths: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "red_kills": self.red_kills,
            "blue_kills": self.blue_kills,
            "red_agents": self.red_agents,
            "blue_agents": self.blue_agents,
            "total_deaths": self.total_deaths,
        }

@dataclass
class DeadAgent:
    id: str
    team: str
    killer_team: Optional[str]
    lifetime: float
    death_time: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "team": self.team,
            "killer_team": self.killer_team,
            "lifetime": self.lifetime,
        }

@dataclass
class CombatStats:
    max_health: float = 100
    health: float = 100
    attack_damage: float = 15
    attack_range: float = 30
    attack_cooldown: float = 1.0
    last_attack_time: float = field(default_factory=time.time)
    
    def is_alive(self) -> bool:
        return self.health > 0
    
    def can_attack(self) -> bool:
        return time.time() - self.last_attack_time >= self.attack_cooldown
    
    def take_damage(self, damage: float) -> bool:
        """Apply damage and return True if fatal"""
        self.health = max(0, self.health - damage)
        return not self.is_alive()
    
    def get_health_percentage(self) -> float:
        return (self.health / self.max_health) * 100

@dataclass
class MovementStats:
    max_speed: float = 3.0
    max_force: float = 0.5
    awareness_radius: float = 100
    perception_radius: float = 50
    
    def clamp_position(self, position: Vector2D, bounds: tuple[float, float, float, float]) -> Vector2D:
        """Clamp position within bounds (min_x, min_y, max_x, max_y)"""
        min_x, min_y, max_x, max_y = bounds
        return Vector2D(
            x=max(min_x, min(max_x, position.x)),
            y=max(min_y, min(max_y, position.y))
        )

@dataclass
class Physics:
    position: Vector2D
    velocity: Vector2D
    acceleration: Vector2D
    radius: float = 10.0
    stored_force: Optional[Vector2D] = None
    
    def update(self, movement: MovementStats):
        """Update physics state"""
        # Apply stored force if exists
        if self.stored_force:
            self.apply_force(self.stored_force)
            self.stored_force = None

        # Update velocity with acceleration
        self.velocity = (self.velocity + self.acceleration).limit(movement.max_speed)
        # Update position with velocity
        self.position = self.position + self.velocity
        # Reset acceleration
        self.acceleration = Vector2D(0, 0)
    
    def apply_force(self, force: Vector2D):
        """Apply a force vector"""
        self.acceleration = self.acceleration + force

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
        
        # Behavior system
        self.behavior_system = BehaviorSystem()
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

    def update_behavior(self, nearby_agents: List['Agent']) -> None:
        """Update only behavior decisions"""
        try:
            behavior_force = self.behavior_system.update(self, nearby_agents)
            self.physics.stored_force = behavior_force
            
            if self.target_id:
                target = next((a for a in nearby_agents if a.id == self.target_id), None)
                if target and self.combat.can_attack():
                    distance = (target.position - self.position).magnitude()
                    if distance <= self.combat.attack_range:
                        self.attack(target)
                        
        except Exception as e:
            logger.error(f"Error updating agent behavior {self.id}: {e}")

    def update_position(self) -> None:
        """Update position based on physics"""
        try:
            self.physics.update(self.movement)
        except Exception as e:
            logger.error(f"Error updating agent position {self.id}: {e}")

    def handle_combat(self, all_agents: List['Agent']) -> None:
        """Handle combat interactions"""
        try:
            if self.target_id:
                target = next((a for a in all_agents if a.id == self.target_id), None)
                if target and self.combat.can_attack():
                    distance = (target.position - self.position).magnitude()
                    if distance <= self.combat.attack_range:
                        self.attack(target)
        except Exception as e:
            logger.error(f"Error in combat handling for agent {self.id}: {e}")

    def attack(self, target: 'Agent') -> bool:
        """Perform attack on target"""
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
        """Convert agent state to dictionary for serialization"""
        try:
            return {
                "id": self.id,
                "team": self.team,
                "position": {
                    "x": self.physics.position.x,
                    "y": self.physics.position.y
                },
                "health": self.combat.health,
                "target_id": self.target_id,
                "behavior": self.current_behavior
            }
        except Exception as e:
            logger.error(f"Error serializing agent {self.id}: {e}")
            return {
                "id": self.id,
                "error": str(e)
            }

    def __str__(self) -> str:
        return f"Agent(id={self.id[:8]}, team={self.team}, health={self.combat.health:.1f}%, behavior={self.current_behavior})"