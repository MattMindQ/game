# game_server/game/components/base.py

from typing import Protocol, TypeVar, Generic, Any
from datetime import datetime
from uuid import UUID

T = TypeVar('T')

class IComponent(Protocol):
    """Base interface for all game components"""
    component_id: UUID
    
    def initialize(self) -> None:
        """Initialize the component"""
        ...
    
    def update(self, dt: float) -> None:
        """Update component state"""
        ...
    
    def cleanup(self) -> None:
        """Cleanup component resources"""
        ...

class IState(Protocol, Generic[T]):
    """Interface for state management"""
    state_id: UUID
    value: T
    last_updated: datetime
    
    def get_value(self) -> T:
        """Get current state value"""
        ...
    
    def set_value(self, new_value: T) -> None:
        """Update state value"""
        ...
    
    def reset(self) -> None:
        """Reset to initial state"""
        ...

class IBehavior(Protocol):
    """Interface for component behaviors"""
    behavior_id: UUID
    
    def execute(self, context: dict[str, Any]) -> None:
        """Execute behavior logic"""
        ...
    
    def validate(self) -> bool:
        """Validate behavior configuration"""
        ...