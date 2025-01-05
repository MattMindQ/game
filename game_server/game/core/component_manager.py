from typing import Dict, Type, TypeVar, Optional
from uuid import UUID
from loguru import logger
from ..core.base import IComponent
from ..state.registry import TypedStateRegistry

T = TypeVar('T', bound=IComponent)

class ComponentManager:
    def __init__(self, state_registry: TypedStateRegistry):
        self.components: Dict[UUID, IComponent] = {}
        self.state_registry = state_registry
    
    def register_component[T](self, component: T) -> None:
        """Register a component and its state"""
        try:
            self.components[component.component_id] = component
            # Register component state
            self.state_registry.register_component(
                type(component),
                component,
                component.component_id
            )
            logger.info(f"Registered component {component.component_id}")
        except Exception as e:
            logger.exception(f"Failed to register component: {e}")
            raise
    
    def get_component[T](self, component_id: UUID) -> Optional[T]:
        """Get a component by ID"""
        try:
            return self.components.get(component_id)
        except Exception as e:
            logger.exception(f"Failed to get component {component_id}: {e}")
            return None
    
    def update_all(self, dt: float) -> None:
        """Update all components"""
        try:
            for component in self.components.values():
                component.update(dt)
        except Exception as e:
            logger.exception("Failed to update components")
            raise