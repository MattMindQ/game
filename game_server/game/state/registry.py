# game_server/game/state/registry.py
from typing import Dict, Type, TypeVar, Generic, Optional
from uuid import UUID, uuid4
from dataclasses import dataclass
from loguru import logger
from .interfaces import IState
from datetime import datetime

T = TypeVar('T')

@dataclass
class StateContainer(Generic[T], IState[T]):
    """Container for state values"""
    state_id: UUID
    value: T
    
    def get_value(self) -> T:
        return self.value
    
    def set_value(self, value: T) -> None:
        self.value = value
    
    def reset(self) -> None:
        # Implement reset logic based on type
        pass

class TypedStateRegistry:
    def __init__(self):
        self._states: Dict[UUID, StateContainer] = {}
        self._type_registry: Dict[Type, Dict[UUID, StateContainer]] = {}
    
    def register_component[T](
        self,
        component_type: Type[T],
        initial_state: T,
        owner_id: UUID
    ) -> IState[T]:
        try:
            state_id = uuid4()
            state = StateContainer(
                state_id=state_id,
                value=initial_state
            )
            
            # Store in main registry
            self._states[state_id] = state
            
            # Store in type registry
            if component_type not in self._type_registry:
                self._type_registry[component_type] = {}
            self._type_registry[component_type][owner_id] = state
            
            logger.info(f"Registered state for component {component_type.__name__}")
            return state
            
        except Exception as e:
            logger.exception(f"Failed to register component state")
            raise
    
    def get_component[T](
        self,
        component_type: Type[T],
        owner_id: UUID
    ) -> Optional[T]:
        try:
            type_states = self._type_registry.get(component_type, {})
            state = type_states.get(owner_id)
            return state.get_value() if state else None
        except Exception as e:
            logger.exception(f"Failed to get component state")
            raise
class ComponentState(Generic[T], IState[T]):
    def __init__(self, state_id: UUID, initial_value: T, owner_id: UUID):
        self.state_id = state_id
        self.value = initial_value
        self.owner_id = owner_id
        self.last_updated = datetime.now()