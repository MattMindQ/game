# game_server/game/state/update.py
from typing import Generic, TypeVar, List, Any
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID
from loguru import logger
from collections import deque

T = TypeVar('T')

@dataclass
class StateUpdate(Generic[T]):
    state_id: UUID
    old_value: T
    new_value: T
    timestamp: datetime
    priority: int = 0

class UpdateProcessor:
    def __init__(self):
        self._updates: deque[StateUpdate] = deque()
        self._processing: bool = False
    
    def queue_update(self, update: StateUpdate) -> None:
        try:
            self._updates.append(update)
            self._updates = deque(sorted(self._updates, key=lambda x: x.priority, reverse=True))
            logger.debug(f"Queued update: {update}")
        except Exception as e:
            logger.exception("Failed to queue state update")
            raise

    
    def process_updates(self) -> None:
        try:
            if self._processing:
                return
            self._processing = True
            while self._updates:
                update = self._updates.popleft()
                logger.debug(f"Processing update: {update}")
                self._apply_update(update)
            self._processing = False
        except Exception as e:
            logger.exception("Failed to process updates")
            self._processing = False
            raise

    
    def _apply_update(self, update: StateUpdate) -> None:
        try:
            # Here you would implement the actual state update logic
            # This might involve notifying observers, validating changes, etc.
            logger.info(f"Applying state update: {update.state_id}")
        except Exception as e:
            logger.exception(f"Failed to apply update {update.state_id}")
            raise