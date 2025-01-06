from typing import Generic, TypeVar, List, Optional
from datetime import datetime
from uuid import UUID, uuid4
from dataclasses import dataclass, field
from .interfaces import IState, IStateObserver
from loguru import logger

T = TypeVar('T')


@dataclass
class BaseState(Generic[T], IState[T]):
    """Base implementation of IState"""
    initial_value: T
    state_id: UUID = field(default_factory=uuid4)
    last_updated: datetime = field(default_factory=datetime.now)
    _value: Optional[T] = None
    _observers: List[IStateObserver[T]] = field(default_factory=list)
    
    def __post_init__(self):
        self._value = self.initial_value
        # Don't override state_id if already set
        if not self.state_id:
            self.state_id = uuid4()
    
    def get_value(self) -> T:
        return self._value
    
    def set_value(self, value: T) -> None:
        try:
            old_value = self._value
            self._value = value
            self.last_updated = datetime.now()
            logger.debug(f"State {self.state_id} updated at {self.last_updated}")
            self.notify_observers(old_value, value)
        except Exception as e:
            logger.exception(f"Error setting state value: {e}")
    
    def reset(self) -> None:
        """Reset to initial state and notify observers"""
        try:
            old_value = self._value
            self._value = self.initial_value
            self.last_updated = datetime.now()
            logger.debug(f"State {self.state_id} reset at {self.last_updated}")
            self.notify_observers(old_value, self.initial_value)
        except Exception as e:
            logger.exception(f"Error resetting state: {e}")
    
    def add_observer(self, observer: IStateObserver[T]) -> None:
        """Add state observer"""
        self._observers.append(observer)
        logger.debug(f"Added observer to {self.state_id}. Total observers: {len(self._observers)}")
    
    def remove_observer(self, observer: IStateObserver[T]) -> None:
        """Remove state observer"""
        self._observers.remove(observer)
        logger.debug(f"Removed observer from {self.state_id}")
    
    def notify_observers(self, old_value: T, new_value: T) -> None:
        """Notify observers of state change"""
        try:
            if self._observers:
                logger.debug(f"Notifying {len(self._observers)} observers for state {self.state_id}")
            for observer in self._observers:
                observer.on_state_changed(old_value, new_value)
        except Exception as e:
            logger.exception(f"Error notifying observers: {e}")