from dataclasses import dataclass
from typing import Optional
from ..vector import Vector2D
from .stats import MovementStats

@dataclass
class Physics:
    position: Vector2D
    velocity: Vector2D
    acceleration: Vector2D
    radius: float = 10.0
    stored_force: Optional[Vector2D] = None
    
    def update(self, movement: MovementStats):
        if self.stored_force:
            self.apply_force(self.stored_force)
            self.stored_force = None

        self.velocity = (self.velocity + self.acceleration).limit(movement.max_speed)
        self.position = self.position + self.velocity
        self.acceleration = Vector2D(0, 0)
    
    def apply_force(self, force: Vector2D):
        self.acceleration = self.acceleration + force