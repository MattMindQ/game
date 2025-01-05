from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any
from uuid import UUID
from loguru import logger

from .base_state import BaseState
from ..components.world import WorldComponent, WorldComponentFactory
from ..world.wall import Wall
from ..vector import Vector2D
from .interfaces import IStateObserver
import random
from datetime import datetime

@dataclass
class WorldStateData:
    """World state data structure"""
    bounds: Tuple[float, float, float, float]
    world_component: WorldComponent
    
@dataclass
class WorldState(BaseState[WorldStateData]):
    """Enhanced world state with component-based architecture"""
    
    def __init__(self, bounds: Tuple[float, float, float, float]):
        # Create initial data
        initial_data = WorldStateData(
            bounds=bounds,
            world_component=WorldComponentFactory.create()
        )
        # Initialize base state
        super().__init__(initial_value=initial_data)
        # Initialize observers list
        self._observers = []
        
    def initialize(self) -> None:
        """Initialize world state"""
        data = self.get_value()
        self._generate_world(
            data.bounds[2],  # width
            data.bounds[3],  # height
            5  # num_walls
        )
        self.set_value(data)
    
    def _generate_world(self, width: float, height: float, num_walls: int) -> None:
        """Generate world with walls"""
        data = self.get_value()
        
        # Clear existing walls
        data.world_component.initialize()
        
        # Generate corner walls
        self._generate_corner_walls(width, height)
        
        # Generate random walls
        self._add_random_walls(width, height, num_walls)
    
    def _generate_corner_walls(self, width: float, height: float) -> None:
        """Generate walls in corners"""
        data = self.get_value()
        corners = [(0, 0), (width, 0), (0, height), (width, height)]
        
        for i, (cx, cy) in enumerate(corners):
            wall_width = random.uniform(60, 120)
            wall_height = random.uniform(60, 120)
            
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
            data.world_component.add_wall(wall)
    
    def _add_random_walls(self, width: float, height: float, num_walls: int) -> None:
        """Add random walls"""
        data = self.get_value()
        min_gap = 50
        
        for i in range(num_walls):
            wall_width = random.uniform(40, 80)
            wall_height = random.uniform(40, 80)
            
            for _ in range(100):  # Maximum placement attempts
                x = random.uniform(0, width - wall_width)
                y = random.uniform(0, height - wall_height)
                
                # Check if position is valid
                valid = True
                for existing_wall in data.world_component.walls:
                    dx = abs((x + wall_width/2) - (existing_wall.position.x + existing_wall.width/2))
                    dy = abs((y + wall_height/2) - (existing_wall.position.y + existing_wall.height/2))
                    
                    if (dx < (wall_width + existing_wall.width)/2 + min_gap and 
                        dy < (wall_height + existing_wall.height)/2 + min_gap):
                        valid = False
                        break
                
                if valid:
                    wall = Wall(
                        position=Vector2D(x, y),
                        width=wall_width,
                        height=wall_height,
                        name=f"Random-{i+1}"
                    )
                    data.world_component.add_wall(wall)
                    break
    
    def get_random_position(self) -> Vector2D:
        """Generate a valid random position away from walls"""
        data = self.get_value()
        for _ in range(100):
            pos = Vector2D(
                random.uniform(data.bounds[0] + 20, data.bounds[2] - 20),
                random.uniform(data.bounds[1] + 20, data.bounds[3] - 20)
            )
            if not data.world_component.check_collision_with_walls(pos.x, pos.y):
                return pos
        
        # Fallback to center position
        return Vector2D(
            (data.bounds[0] + data.bounds[2]) / 2,
            (data.bounds[1] + data.bounds[3]) / 2
        )
    
    def get_state(self) -> Dict[str, Any]:
        """Get serializable state"""
        data = self.get_value()
        return {
            "walls": [
                {
                    "name": wall.name,
                    "x": wall.position.x,
                    "y": wall.position.y,
                    "width": wall.width,
                    "height": wall.height
                }
                for wall in data.world_component.walls
            ],
            "bounds": data.bounds,
            "holes": [],
            "colines": []
        }

    def add_observer(self, observer: IStateObserver[WorldStateData]) -> None:
        """Add state observer"""
        self._observers.append(observer)
        logger.debug(f"Added observer to WorldState. Total observers: {len(self._observers)}")
    
    def remove_observer(self, observer: IStateObserver[WorldStateData]) -> None:
        """Remove state observer"""
        self._observers.remove(observer)
        logger.debug(f"Removed observer from WorldState. Total observers: {len(self._observers)}")
    
    def _notify_observers(self, old_value: WorldStateData, new_value: WorldStateData) -> None:
        """Notify observers of state change"""
        try:
            if self._observers:
                logger.debug(f"Notifying {len(self._observers)} WorldState observers")
            for observer in self._observers:
                observer.on_state_changed(old_value, new_value)
        except Exception as e:
            logger.exception(f"Error notifying WorldState observers: {e}")

    def set_value(self, value: WorldStateData) -> None:
        """Set state value and notify observers"""
        try:
            old_value = self.get_value()
            self._value = value
            self.last_updated = datetime.now()
            logger.debug(f"WorldState {self.state_id} updated at {self.last_updated}")
            self._notify_observers(old_value, value)
        except Exception as e:
            logger.exception(f"Error setting WorldState value: {e}")