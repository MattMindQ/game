# game_server/game/world/wall.py

from .base import Object
from ..vector import Vector2D

class Wall(Object):
    """
    A Wall is a world object that agents (and possibly projectiles) cannot pass through.
    """

    def __init__(self, position: Vector2D, width: float, height: float, name: str = "Wall"):
        super().__init__(position=position, width=width, height=height, name=name)

    def is_colliding(self, x: float, y: float) -> bool:
        """
        Check if a given point (e.g., an agent's position) is colliding with the wall.
        This can be extended to more sophisticated collision logic.
        """
        left, top, right, bottom = self.get_bounds()
        return (left <= x <= right) and (top <= y <= bottom)
