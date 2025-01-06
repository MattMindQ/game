# game_server/game/state/manager.py
from typing import Dict, Type, TypeVar, Optional
from uuid import UUID
from datetime import datetime
from loguru import logger

from .interfaces import IState
from .world_state import WorldState, WorldStateData
from .base_state import BaseState

T = TypeVar('T')

class StateManager:
    """Manages all game states"""
    
    def __init__(self):
        self._states: Dict[UUID, BaseState] = {}
        self._type_registry: Dict[Type, Dict[UUID, BaseState]] = {}
    
    def register_state[T](
        self,
        state_type: Type[T], 
        state: BaseState[T],  # Changed to accept state object
        owner_id: UUID
    ) -> BaseState[T]:
        """Register an existing state instance"""
        try:
            # Store the actual state object
            self._states[owner_id] = state
            
            # Register in type registry
            if state_type not in self._type_registry:
                self._type_registry[state_type] = {}
            self._type_registry[state_type][owner_id] = state
            
            logger.info(f"Registered state {owner_id} for {state_type.__name__}")
            return state
        except Exception as e:
            logger.exception(f"Failed to register state: {e}")
            raise
    
    def get_state[T](
        self,
        state_type: Type[T],
        owner_id: UUID
    ) -> Optional[BaseState[T]]:
        """Get state by type and owner"""
        try:
            type_states = self._type_registry.get(state_type, {})
            return type_states.get(owner_id)
        except Exception as e:
            logger.exception(f"Failed to get state: {e}")
            return None