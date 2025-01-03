# game_server/game/world/world.py

import random
from typing import List, Optional, Tuple
import math
from ..vector import Vector2D
from .base import Object
from .wall import Wall
from ..physics.collision import circle_wall_collision, CollisionInfo, resolve_collision

class World:
    """
    The World class manages all static objects (e.g., walls, obstacles)
    and topological features like lines (colines) and holes.
    """

    def __init__(self):
        self.objects: List[Object] = []
        self.walls: List[Wall] = []
        self.holes: List[Object] = []
        self.colines: List[Object] = []

    def check_collisions(self, position: Vector2D, radius: float) -> Optional[CollisionInfo]:
        """
        Check collisions between an agent and all walls
        Returns the first collision found or None
        """
        closest_collision: Optional[CollisionInfo] = None
        min_distance = float('inf')

        for wall in self.walls:
            collision = circle_wall_collision(position, radius, wall)
            if collision.is_colliding and collision.point:
                distance = (collision.point - position).magnitude()
                if distance < min_distance:
                    min_distance = distance
                    closest_collision = collision

        return closest_collision

    def resolve_agent_collision(self, position: Vector2D, velocity: Vector2D, radius: float) -> Tuple[Vector2D, Vector2D]:
        """
        Check and resolve collisions for an agent.
        Returns updated position and velocity.
        """
        collision = self.check_collisions(position, radius)
        if collision and collision.is_colliding:
            return resolve_collision(position, velocity, collision)
        return position, velocity

    def generate_world(self, world_width: float = 800, world_height: float = 600, num_walls: int = 8):
        """
        Generate a new world layout with a multi-step approach for variety,
        using only rectangular walls.
        """
        self.clear_world()

        # Step 1: Generate large corner walls
        # (e.g., bigger rectangles in each corner)
        self._generate_corner_walls(
            width=world_width,
            height=world_height,
            min_size=60,     # Larger than default
            max_size=120
        )

        # Step 2: Optionally generate a center obstacle for variety
        # (50% chance)
        if random.random() < 0.5:
            self._generate_center_obstacle(
                width=world_width,
                height=world_height,
                min_size=40,
                max_size=80
            )

        # Step 3: Randomly choose between parallel or diagonal formations
        formation_funcs = [
            self._generate_parallel_walls,
            self._generate_diagonal_walls
        ]
        random.choice(formation_funcs)(
            width=world_width,
            height=world_height,
            min_size=40,
            max_size=100
        )

        # Step 4: First pass of random walls (moderate size)
        self._add_random_walls(
            width=world_width,
            height=world_height,
            num_walls=3,         # Place a few random walls
            min_size=40,
            max_size=80,
            min_gap=50
        )

        # Step 5: Additional pass of smaller random walls for fine detail
        self._add_random_walls(
            width=world_width,
            height=world_height,
            num_walls=2,         # Fewer, smaller walls
            min_size=30,
            max_size=60,
            min_gap=30
        )

    def clear_world(self):
        """Clear all objects from the world."""
        self.objects.clear()
        self.walls.clear()
        self.holes.clear()
        self.colines.clear()

    def _generate_corner_walls(self, width: float, height: float, min_size: float, max_size: float):
        """Generate walls in the corners of the world."""
        corners = [(0, 0), (width, 0), (0, height), (width, height)]

        for i, (cx, cy) in enumerate(corners):
            wall_width = random.uniform(min_size, max_size)
            wall_height = random.uniform(min_size, max_size)

            # Adjust position based on corner
            if cx == width:
                cx -= wall_width
            if cy == height:
                cy -= wall_height

            wall = Wall(
                position=Vector2D(cx, cy),
                width=wall_width,
                height=wall_height,
                name=f"Corner-{i+1}"
            )
            self.walls.append(wall)

    def _generate_center_obstacle(self, width: float, height: float, min_size: float, max_size: float):
        """Generate a central obstacle formation."""
        center_x = width / 2
        center_y = height / 2

        # Create a cross/plus-shaped obstacle using two rectangles
        sizes = [(max_size, min_size), (min_size, max_size)]
        offsets = [(-max_size / 4, 0), (0, -max_size / 4)]

        for i, ((w, h), (ox, oy)) in enumerate(zip(sizes, offsets)):
            wall = Wall(
                position=Vector2D(
                    center_x - w / 2 + ox,
                    center_y - h / 2 + oy
                ),
                width=w,
                height=h,
                name=f"Center-{i+1}"
            )
            self.walls.append(wall)

    def _generate_parallel_walls(self, width: float, height: float, min_size: float, max_size: float):
        """Generate parallel walls to create corridors."""
        wall_width = random.uniform(min_size, max_size)
        wall_height = min_size  # Make them horizontally longer vs. height
        gap = random.uniform(60, 100)  # Gap between parallel walls

        y_pos = random.uniform(height * 0.2, height * 0.8)

        # Generate a pair of parallel walls
        for i in range(2):
            wall = Wall(
                position=Vector2D(
                    width * 0.2,
                    y_pos + (gap * i)
                ),
                width=wall_width,
                height=wall_height,
                name=f"Parallel-{i+1}"
            )
            self.walls.append(wall)

    def _generate_diagonal_walls(self, width: float, height: float, min_size: float, max_size: float):
        """Generate diagonal wall formations (still rectangular)."""
        wall_length = random.uniform(min_size, max_size)
        angle = random.uniform(30, 60)  # degrees

        # Convert angle to radians
        rad = math.radians(angle)

        # Calculate wall dimensions based on angle
        wall_width = wall_length * math.cos(rad)
        wall_height = wall_length * math.sin(rad)

        # Generate a pair of diagonal walls
        positions = [
            (width * 0.2, height * 0.2),
            (width * 0.8, height * 0.8)
        ]

        for i, (x, y) in enumerate(positions):
            wall = Wall(
                position=Vector2D(x, y),
                width=wall_width,
                height=wall_height,
                name=f"Diagonal-{i+1}"
            )
            self.walls.append(wall)

    def _add_random_walls(self, width: float, height: float, num_walls: int,
                          min_size: float, max_size: float, min_gap: float):
        """
        Add random walls while ensuring a minimum gap from existing walls.
        Tries up to max_attempts to place walls without overlap.
        """
        attempts = 0
        max_attempts = 100

        while len(self.walls) < num_walls and attempts < max_attempts:
            wall_width = random.uniform(min_size, max_size)
            wall_height = random.uniform(min_size, max_size)
            x = random.uniform(0, width - wall_width)
            y = random.uniform(0, height - wall_height)

            # Check if position is valid
            if self._is_valid_wall_position(x, y, wall_width, wall_height, min_gap):
                wall = Wall(
                    position=Vector2D(x, y),
                    width=wall_width,
                    height=wall_height,
                    name=f"Random-{len(self.walls)+1}"
                )
                self.walls.append(wall)

            attempts += 1

    def _is_valid_wall_position(self, x: float, y: float, width: float, height: float, min_gap: float) -> bool:
        """Check if a wall position is valid (not too close to other walls)."""
        for wall in self.walls:
            # Calculate distances between centers
            dx = abs((x + width / 2) - (wall.position.x + wall.width / 2))
            dy = abs((y + height / 2) - (wall.position.y + wall.height / 2))

            # Check if walls overlap or are too close
            if dx < (width + wall.width) / 2 + min_gap and dy < (height + wall.height) / 2 + min_gap:
                return False
        return True

    def add_wall(self, wall: Wall):
        """Add a wall to the world."""
        self.walls.append(wall)

    def update(self):
        """Update world state (currently a placeholder)."""
        pass

    def check_collision_with_walls(self, x: float, y: float) -> bool:
        """
        Check if a point collides with any wall.
        """
        for wall in self.walls:
            if wall.is_colliding(x, y):
                return True
        return False

    def get_bounds_for_all_objects(self) -> List[tuple[float, float, float, float]]:
        """Get bounding boxes for all objects."""
        return (
            [obj.get_bounds() for obj in self.objects]
            + [wall.get_bounds() for wall in self.walls]
            + [hole.get_bounds() for hole in self.holes]
            + [coline.get_bounds() for coline in self.colines]
        )

