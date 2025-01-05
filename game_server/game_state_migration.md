# State System Migration Guide

## Overview
This guide outlines the step-by-step process to migrate from the current direct state management system to a component-based state management system using TypedStateRegistry.

## Current Architecture
```python
GameState
├── AgentState
│   └── Manages agent lifecycle and behaviors
├── CombatState
│   └── Handles combat interactions and statistics
├── ConfigState
│   └── Manages game configuration
└── WorldState
    └── Handles world physics and collisions
Target Architecture
pythonCopyGameState
├── GlobalState
│   ├── WorldState
│   └── ConfigState
├── AgentStates
│   ├── LocalState
│   └── BehaviorState
└── SystemState
Migration Steps
1. Define State Interfaces
pythonCopy# state/interfaces.py
from typing import Protocol, TypeVar, Generic

T = TypeVar('T')

class IState(Protocol, Generic[T]):
    """Base interface for all state types"""
    def get_value(self) -> T: ...
    def set_value(self, value: T) -> None: ...
    def reset(self) -> None: ...

class IStateObserver(Protocol, Generic[T]):
    """Interface for state change observers"""
    def on_state_changed(self, old_value: T, new_value: T) -> None: ...

class IStateSynchronizer(Protocol):
    """Interface for state synchronization"""
    def synchronize(self) -> None: ...
    def get_delta_update(self) -> dict: ...
2. Implement Core State Components
2.1 State Registry
pythonCopy# state/registry.py
class TypedStateRegistry:
    def __init__(self):
        self._states: Dict[UUID, IState] = {}
        self._observers: Dict[UUID, List[IStateObserver]] = {}
    
    def register_state[T](
        self,
        state_type: Type[T],
        initial_value: T,
        owner_id: UUID
    ) -> IState[T]: ...
    
    def get_state[T](
        self,
        state_type: Type[T],
        owner_id: UUID
    ) -> Optional[IState[T]]: ...
2.2 State Manager
pythonCopy# state/manager.py
class StateManager:
    def __init__(self, registry: TypedStateRegistry):
        self.registry = registry
        self.update_processor = UpdateProcessor()
    
    def queue_update[T](
        self,
        state_type: Type[T],
        owner_id: UUID,
        new_value: T,
        priority: int = 0
    ) -> None: ...
3. Migrate Individual States
3.1 World State
pythonCopy# state/world_state.py
@dataclass
class WorldStateData:
    bounds: Tuple[float, float, float, float]
    walls: List[Wall]
    collision_grid: CollisionGrid

class WorldState(IState[WorldStateData]):
    def __init__(self, registry: TypedStateRegistry):
        self.registry = registry
        self._data = WorldStateData(...)
3.2 Combat State
pythonCopy# state/combat_state.py
@dataclass
class CombatStateData:
    stats: GameStats
    dead_agents: List[DeadAgent]
    recent_kills: List[Dict[str, Any]]

class CombatState(IState[CombatStateData]):
    def __init__(self, registry: TypedStateRegistry):
        self.registry = registry
        self._data = CombatStateData(...)
4. Implement State Updates
4.1 Define Update Types
pythonCopy# state/updates.py
@dataclass
class StateUpdate(Generic[T]):
    state_id: UUID
    old_value: T
    new_value: T
    timestamp: datetime
    priority: int = 0
4.2 Update Processor
pythonCopyclass UpdateProcessor:
    def __init__(self):
        self._updates: PriorityQueue[StateUpdate] = PriorityQueue()
        
    def queue_update[T](self, update: StateUpdate[T]) -> None: ...
    def process_updates(self) -> None: ...
5. Add State Synchronization
5.1 Synchronizer Implementation
pythonCopy# state/synchronization.py
class StateSynchronizer:
    def __init__(self, registry: TypedStateRegistry):
        self.registry = registry
        self.last_sync: Dict[UUID, datetime] = {}
    
    def get_delta_updates(self) -> Dict[str, Any]: ...
    def apply_delta_updates(self, updates: Dict[str, Any]) -> None: ...
6. Migration Process

Create New State Classes:

Implement interfaces for each state type
Convert existing data structures to proper state classes
Add validation and type safety


Update Entity References:
pythonCopy# Before
agent.combat.health = 100

# After
combat_state = state_registry.get_state(CombatState, agent.id)
combat_state.set_value(CombatStateData(health=100))

Implement State Updates:
pythonCopy# Add update handling
update = StateUpdate(
    state_id=combat_state.id,
    old_value=old_data,
    new_value=new_data,
    priority=1
)
update_processor.queue_update(update)

Add State Synchronization:
pythonCopy# Synchronize states
delta_updates = state_synchronizer.get_delta_updates()
network_manager.send_updates(delta_updates)


7. Testing Strategy

Unit Tests:
pythonCopydef test_state_updates():
    registry = TypedStateRegistry()
    combat_state = registry.register_state(
        CombatState,
        CombatStateData(health=100),
        agent_id
    )
    # Test state updates
    ...

Integration Tests:
pythonCopydef test_state_synchronization():
    manager = StateManager(registry)
    synchronizer = StateSynchronizer(registry)
    # Test full update cycle
    ...


8. Verification Checklist

 All states implement IState interface
 State updates are processed in priority order
 State synchronization works across components
 Type safety is maintained throughout
 Existing functionality is preserved
 Performance metrics are within acceptable range

Notes

Gradual Migration:

Migrate one state type at a time
Maintain backward compatibility
Add comprehensive testing