# game_server/game/physics/collision.py

from typing import Tuple, Optional
import math
from ..vector import Vector2D
from ..world.wall import Wall

class CollisionInfo:
    """Stores information about a collision"""
    def __init__(self, 
                 is_colliding: bool,
                 penetration: float = 0,
                 normal: Optional[Vector2D] = None,
                 point: Optional[Vector2D] = None):
        self.is_colliding = is_colliding
        self.penetration = penetration  # How deep the collision is
        self.normal = normal            # Surface normal at collision point
        self.point = point              # Point of collision

def circle_wall_collision(
    position: Vector2D,
    radius: float,
    wall: Wall
) -> CollisionInfo:
    """
    Check collision between a circle and a wall (AABB)
    Returns CollisionInfo with collision details
    """
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
            # Circle center is inside wall, push out in x direction
            normal = Vector2D(1.0, 0.0)
            penetration = radius
        else:
            # Calculate normal and penetration
            normal = to_circle * (1.0 / distance)
            penetration = radius - distance
            
        return CollisionInfo(
            is_colliding=True,
            penetration=penetration,
            normal=normal,
            point=Vector2D(closest_x, closest_y)
        )
    
    return CollisionInfo(is_colliding=False)

def resolve_collision(
    position: Vector2D,
    velocity: Vector2D,
    collision: CollisionInfo,
    restitution: float = 0.3  # Bounce factor
) -> Tuple[Vector2D, Vector2D]:
    """
    Resolve a collision by updating position and velocity
    Returns new position and velocity
    """
    if not collision.is_colliding or not collision.normal:
        return position, velocity
    
    # Move object out of collision
    new_position = position + (collision.normal * collision.penetration)
    
    # Calculate reflection for velocity
    dot_product = velocity.dot(collision.normal)
    new_velocity = velocity - (collision.normal * (1 + restitution) * dot_product)
    
    # Apply friction
    friction = 0.8
    tangent = Vector2D(-collision.normal.y, collision.normal.x)
    tangent_dot = velocity.dot(tangent)
    new_velocity = new_velocity + (tangent * tangent_dot * friction)
    
    return new_position, new_velocity