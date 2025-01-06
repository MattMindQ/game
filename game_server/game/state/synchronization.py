from typing import Dict, Any, Optional, Set
from dataclasses import dataclass, field
from datetime import datetime
from uuid import UUID
from loguru import logger

from .interfaces import IStateSynchronizer
from .manager import StateManager

@dataclass
class StateSync:
    """State synchronization metadata"""
    last_sync: datetime
    version: int = 0
    pending_changes: bool = False

class StateSynchronizer(IStateSynchronizer):
    def __init__(self, state_manager: StateManager):
        self.state_manager = state_manager
        self._syncs: Dict[UUID, StateSync] = {}
        self._pending_updates: Set[UUID] = set()
    
    def mark_for_sync(self, state_id: UUID) -> None:
        logger.debug(f"Marking state {state_id} for sync")
        self._pending_updates.add(state_id)
        if state_id not in self._syncs:
            self._syncs[state_id] = StateSync(last_sync=datetime.now())
        sync = self._syncs[state_id]
        logger.debug(f"Sync metadata: {sync}")
        sync.pending_changes = True

    
    def synchronize(self) -> None:
        """Synchronize all pending state updates"""
        try:
            current_time = datetime.now()
            logger.debug(f"Synchronizing {len(self._pending_updates)} pending updates")
            for state_id in list(self._pending_updates):
                state = self.state_manager._states.get(state_id)
                if not state:
                    logger.warning(f"State {state_id} not found in state manager")
                    continue
                sync = self._syncs[state_id]
                logger.debug(f"Syncing state {state_id} with metadata: {sync}")
                if state.last_updated > sync.last_sync:
                    sync.version += 1
                    sync.last_sync = current_time
                    sync.pending_changes = True
                    logger.debug(f"Updated sync: {sync}")
            self._pending_updates.clear()
        except Exception as e:
            logger.exception("Error during state synchronization")
            raise

    
    def get_delta_update(self) -> Dict[str, Any]:
        """Get state changes since last sync"""
        try:
            updates = {}
            for state_id, sync in self._syncs.items():
                state = self.state_manager._states.get(state_id)
                if not state:
                    logger.warning(f"State {state_id} not found in state manager")
                    continue
                
                # Get the actual state value
                state_value = state.get_value()
                
                update_data = {
                    "value": state_value,
                    "version": sync.version,
                    "timestamp": sync.last_sync.timestamp()
                }
                logger.debug(f"Delta update for state {state_id}: {update_data}")
                updates[str(state_id)] = update_data
                
            logger.debug(f"Total updates prepared: {len(updates)}")
            return updates
        except Exception as e:
            logger.exception("Error getting delta updates")
            return {}

class StateSyncObserver:
    """Observer for state changes to trigger synchronization"""
    
    def __init__(self, synchronizer: StateSynchronizer, state_id: UUID):
        self.synchronizer = synchronizer
        self.state_id = state_id
        logger.debug(f"Created sync observer for state {state_id}")
    
    def on_state_changed(self, old_value: Any, new_value: Any) -> None:
        """Handle state change by marking for synchronization"""
        logger.debug(f"State change detected for {self.state_id}")
        self.synchronizer.mark_for_sync(self.state_id)