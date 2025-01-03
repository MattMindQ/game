# game_server/game/state/world_state.py

from typing import Dict, Any, List, Tuple, Optional
from loguru import logger
from ..world.world import World
from ..world.wall import Wall
from ..vector import Vector2D
from ..physics.collision import CollisionInfo, resolve_collision
import random

class WorldState:
    def __init__(self, bounds: Tuple[float, float, float, float]):
        self.bounds = bounds
        self.world = World()
        
    def initialize(self) -> None:
        """Initialize world state"""
        self.world.generate_world(
            world_width=self.bounds[2],
            world_height=self.bounds[3],
            num_walls=5
        )

    def get_random_position(self) -> Vector2D:
        """Generate a valid random position away from walls"""
        for _ in range(100):  # Maximum attempts
            pos = Vector2D(
                random.uniform(self.bounds[0] + 20, self.bounds[2] - 20),
                random.uniform(self.bounds[1] + 20, self.bounds[3] - 20)
            )
            if not self.world.check_collision_with_walls(pos.x, pos.y):
                return pos
                
        # Fallback to center position
        return Vector2D(
            (self.bounds[0] + self.bounds[2]) / 2,
            (self.bounds[1] + self.bounds[3]) / 2
        )

    def update_physics(self, agents: List['Agent']) -> None:
        """Update physics and handle collisions for all agents"""
        # Store original positions
        original_positions: Dict[str, Tuple[Vector2D, Vector2D]] = {
            agent.id: (
                Vector2D(agent.position.x, agent.position.y),
                Vector2D(agent.velocity.x, agent.velocity.y)
            )
            for agent in agents
        }

        # Update positions
        for agent in agents:
            agent.physics.update(agent.movement)

        # Check and resolve collisions
        for agent in agents:
            collision = self.world.check_collisions(
                agent.position,
                agent.physics.radius
            )
            
            if collision and collision.is_colliding:
                # Restore previous position
                orig_pos, orig_vel = original_positions[agent.id]
                # Resolve collision
                new_pos, new_vel = resolve_collision(
                    position=orig_pos,
                    velocity=orig_vel,
                    collision=collision
                )
                # Update agent
                agent.position = new_pos
                agent.velocity = new_vel

    def add_wall(self, x: float, y: float, width: float, height: float, name: str = "Wall") -> None:
        """Add a new wall to the world"""
        wall = Wall(
            position=Vector2D(x, y),
            width=width,
            height=height,
            name=name
        )
        self.world.add_wall(wall)
        logger.info(f"Added wall '{name}' at ({x}, {y}), size ({width}x{height})")

    def get_state(self) -> Dict[str, Any]:
        """Get current world state for serialization"""
        return {
            "walls": [
                {
                    "name": wall.name,
                    "x": wall.position.x,
                    "y": wall.position.y,
                    "width": wall.width,
                    "height": wall.height
                }
                for wall in self.world.walls
            ],
            "bounds": self.bounds,
            "holes": [],
            "colines": []
        }

    def get_world_reference(self) -> World:
        """Get reference to world object for agent initialization"""
        return self.world

    def check_collision(self, position: Vector2D, radius: float) -> Optional[CollisionInfo]:
        """Check collision at a specific position"""
        return self.world.check_collisions(position, radius)