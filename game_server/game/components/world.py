from typing import List, Optional
from dataclasses import dataclass, field
from uuid import UUID, uuid4

from ..core.base import IComponent
from ..vector import Vector2D
from ..world.wall import Wall
from ..world.base import Object
from .physics import CollisionInfo

@dataclass
class WorldComponent(IComponent):
    component_id: UUID = field(default_factory=uuid4)
    objects: List[Object] = field(default_factory=list)
    walls: List[Wall] = field(default_factory=list)
    holes: List[Object] = field(default_factory=list)
    colines: List[Object] = field(default_factory=list)
    
    def initialize(self) -> None:
        """Initialize world component"""
        self.objects.clear()
        self.walls.clear()
        self.holes.clear()
        self.colines.clear()
    
    def update(self, dt: float) -> None:
        """Update world state"""
        pass
    
    def cleanup(self) -> None:
        """Cleanup world resources"""
        self.initialize()
    
    def add_wall(self, wall: Wall) -> None:
        """Add a wall to the world"""
        self.walls.append(wall)
    
    def check_collision_with_walls(self, x: float, y: float) -> bool:
        """Check if a point collides with any wall"""
        return any(wall.is_colliding(x, y) for wall in self.walls)
    
    def check_collisions(self, position: Vector2D, radius: float) -> Optional[CollisionInfo]:
        """Check collisions between a circle and all walls"""
        closest_collision: Optional[CollisionInfo] = None
        min_distance = float('inf')

        for wall in self.walls:
            collision = self._circle_wall_collision(position, radius, wall)
            if collision.is_colliding and collision.point:
                distance = (collision.point - position).magnitude()
                if distance < min_distance:
                    min_distance = distance
                    closest_collision = collision

        return closest_collision
    
    def _circle_wall_collision(
        self,
        position: Vector2D,
        radius: float,
        wall: Wall
    ) -> CollisionInfo:
        """Check collision between a circle and a wall"""
        # Find closest point on wall to circle center
        closest_x = max(wall.position.x, min(position.x, wall.position.x + wall.width))
        closest_y = max(wall.position.y, min(position.y, wall.position.y + wall.height))
        
        # Get vector from closest point to circle center
        to_circle = Vector2D(
            position.x - closest_x,
            position.y - closest_y
        )
        
        # Calculate distance
        distance = to_circle.magnitude()
        
        # If distance is less than radius, we have a collision
        if distance <= radius:
            if distance < 0.0001:  # Prevent division by zero
                normal = Vector2D(1.0, 0.0)
                penetration = radius
            else:
                normal = to_circle * (1.0 / distance)
                penetration = radius - distance
                
            return CollisionInfo(
                is_colliding=True,
                penetration=penetration,
                normal=normal,
                point=Vector2D(closest_x, closest_y)
            )
        
        return CollisionInfo(is_colliding=False)

class WorldComponentFactory:
    @classmethod
    def create(cls) -> WorldComponent:
        return WorldComponent()