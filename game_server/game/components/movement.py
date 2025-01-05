# game_server/game/components/movement.py

from uuid import UUID, uuid4
from dataclasses import dataclass, field
from typing import Tuple
from ..core.base import IComponent
from ..utils.vector import Vector2D

@dataclass
class MovementComponent(IComponent):
    # Optional fields with defaults
    component_id: UUID = field(default_factory=uuid4)
    max_speed: float = 3.0
    max_force: float = 0.5
    awareness_radius: float = 100
    perception_radius: float = 50
    
    def initialize(self) -> None:
        """Initialize movement component"""
        pass
    
    def update(self, dt: float) -> None:
        """Update movement state"""
        pass  # Movement updates are handled by physics component
    
    def cleanup(self) -> None:
        """Cleanup component resources"""
        pass
    
    def clamp_position(self, position: Vector2D, bounds: Tuple[float, float, float, float]) -> Vector2D:
        """Clamp position within bounds (min_x, min_y, max_x, max_y)"""
        min_x, min_y, max_x, max_y = bounds
        return Vector2D(
            x=max(min_x, min(max_x, position.x)),
            y=max(min_y, min(max_y, position.y))
        )

class MovementComponentFactory:
    @classmethod
    def create(
        cls,
        max_speed: float = 3.0,
        max_force: float = 0.5
    ) -> MovementComponent:
        return MovementComponent(
            max_speed=max_speed,
            max_force=max_force
        )