from typing import Dict, Type, Optional
from uuid import UUID
from loguru import logger
from .base import IComponent

class GameEngine:
    def __init__(self):
        self.components: Dict[UUID, IComponent] = {}
        self.systems: Dict[str, object] = {}
        self._initialized: bool = False
    
    def initialize(self) -> None:
        try:
            if self._initialized:
                return
                
            logger.info("Initializing game engine")
            for component in self.components.values():
                component.initialize()
            self._initialized = True
            
        except Exception as e:
            logger.exception("Failed to initialize game engine")
            raise
    
    def register_component(self, component: IComponent) -> None:
        try:
            self.components[component.component_id] = component
        except Exception as e:
            logger.exception(f"Failed to register component: {component.component_id}")
            raise
    
    def update(self, dt: float) -> None:
        try:
            for component in self.components.values():
                component.update(dt)
        except Exception as e:
            logger.exception("Error during engine update")
            raise