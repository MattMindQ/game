# game_server/game/world/base.py

from dataclasses import dataclass
from typing import Optional
from ..vector import Vector2D

@dataclass
class Object:
    """
    Base class for all world objects.
    """
    position: Vector2D
    width: float
    height: float
    name: Optional[str] = None

    def get_bounds(self) -> tuple[float, float, float, float]:
        """
        Return bounding rectangle (min_x, min_y, max_x, max_y).
        Useful for collision or overlap checks.
        """
        return (
            self.position.x,
            self.position.y,
            self.position.x + self.width,
            self.position.y + self.height
        )
