from typing import Protocol, TypeVar, Generic, Dict, Any, List
from datetime import datetime
from uuid import UUID

T = TypeVar('T')

class IState(Protocol, Generic[T]):
    """Base interface for all state types"""
    state_id: UUID
    last_updated: datetime
    _observers: List['IStateObserver[T]']
    
    def get_value(self) -> T:
        """Get current state value"""
        ...
    
    def set_value(self, value: T) -> None:
        """Update state value"""
        ...
    
    def reset(self) -> None:
        """Reset to initial state"""
        ...
    
    def add_observer(self, observer: 'IStateObserver[T]') -> None:
        """Add state observer"""
        ...
    
    def remove_observer(self, observer: 'IStateObserver[T]') -> None:
        """Remove state observer"""
        ...
class IStateObserver(Protocol, Generic[T]):
    """Interface for state change observers"""
    def on_state_changed(self, old_value: T, new_value: T) -> None:
        """Handle state change event"""
        ...

class IStateSynchronizer(Protocol):
    """Interface for state synchronization"""
    def synchronize(self) -> None:
        """Synchronize state across the system"""
        ...
    
    def get_delta_update(self) -> Dict[str, Any]:
        """Get state changes since last sync"""
        ...