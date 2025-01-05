from dataclasses import dataclass, field
from typing import Optional, Tuple
from uuid import UUID, uuid4
from ..core.base import IComponent
from ..vector import Vector2D

@dataclass
class CollisionInfo:
    """Stores information about a collision"""
    is_colliding: bool
    penetration: float = 0
    normal: Optional[Vector2D] = None
    point: Optional[Vector2D] = None

@dataclass
class PhysicsComponent(IComponent):
    position: Vector2D
    velocity: Vector2D
    acceleration: Vector2D
    component_id: UUID = field(default_factory=uuid4)
    radius: float = 10.0
    stored_force: Optional[Vector2D] = None
    restitution: float = 0.3  # Bounce factor
    friction: float = 0.8
    
    def initialize(self) -> None:
        """Initialize physics component"""
        self.stored_force = None
        
    def update(self, dt: float) -> None:
        """Update physics state"""
        # Apply stored force if exists
        if self.stored_force:
            self.apply_force(self.stored_force)
            self.stored_force = None
            
    def cleanup(self) -> None:
        """Cleanup physics resources"""
        pass
        
    def apply_force(self, force: Vector2D) -> None:
        """Apply a force vector"""
        self.acceleration = self.acceleration + force
    
    def resolve_collision(
        self,
        collision: CollisionInfo
    ) -> Tuple[Vector2D, Vector2D]:
        """Resolve a collision by updating position and velocity"""
        if not collision.is_colliding or not collision.normal:
            return self.position, self.velocity
        
        # Move object out of collision
        new_position = self.position + (collision.normal * collision.penetration)
        
        # Calculate reflection for velocity
        dot_product = self.velocity.dot(collision.normal)
        new_velocity = self.velocity - (collision.normal * (1 + self.restitution) * dot_product)
        
        # Apply friction
        tangent = Vector2D(-collision.normal.y, collision.normal.x)
        tangent_dot = self.velocity.dot(tangent)
        new_velocity = new_velocity + (tangent * tangent_dot * self.friction)
        
        return new_position, new_velocity

class PhysicsComponentFactory:
    @classmethod
    def create(cls, position: Vector2D, velocity: Vector2D = None, acceleration: Vector2D = None) -> PhysicsComponent:
        return PhysicsComponent(
            position=position,
            velocity=velocity or Vector2D(0, 0),
            acceleration=acceleration or Vector2D(0, 0)
        )