# Backend Architecture Documentation

## Project Structure

```
game_server/
├── data/                 # Data persistence layer
│   ├── behavior_service.py  # Behavior data operations
│   ├── config_service.py    # Configuration management
│   ├── db_connector.py      # Database connection handler
│   ├── user_service.py      # User management
│   └── __init__.py
├── game/                 # Game logic layer
│   ├── behaviors/        # Behavior system
│   │   ├── base.py         # Base behavior classes
│   │   ├── combat.py       # Combat behaviors
│   │   ├── movement.py     # Movement behaviors
│   │   └── __init__.py
│   ├── physics/         # Physics handling
│   │   ├── collision.py    # Collision detection/resolution
│   │   └── __init__.py
│   ├── world/           # World environment
│   │   ├── base.py        # Base world elements
│   │   ├── wall.py        # Wall implementations
│   │   ├── world.py       # World management
│   │   └── __init__.py
│   ├── models.py        # Game entities
│   ├── state.py         # Game state management
│   ├── vector.py        # Vector calculations
│   ├── constants.py     # Game constants
│   └── loop.py          # Game loop handler
└── network/             # Network layer
    ├── websocket.py     # WebSocket communication
    └── __init__.py
```

## Core Systems

### Physics System
```python
# Physics handling for agents and world interactions
class Physics:
    """
    Core physics component for entities
    - Position management
    - Velocity handling
    - Force application
    - Collision detection readiness
    """
    - position: Vector2D
    - velocity: Vector2D
    - acceleration: Vector2D
    - radius: float
    - stored_force: Optional[Vector2D]
    
    Methods:
    - update(movement: MovementStats) -> None
    - apply_force(force: Vector2D) -> None
```

### Collision System
```python
class CollisionInfo:
    """
    Collision detection and resolution data
    """
    - is_colliding: bool
    - penetration: float
    - normal: Optional[Vector2D]
    - point: Optional[Vector2D]

def resolve_collision(
    position: Vector2D,
    velocity: Vector2D,
    collision: CollisionInfo,
    restitution: float = 0.3
) -> Tuple[Vector2D, Vector2D]:
    """
    Resolves collisions between agents and world objects
    Returns new position and velocity
    """
```

### World System
```python
class World:
    """
    Manages all static world elements and collision handling
    """
    - objects: List[Object]
    - walls: List[Wall]
    - bounds: Tuple[float, float, float, float]

    Methods:
    - generate_world(width: float, height: float, num_walls: int)
    - check_collisions(position: Vector2D, radius: float) -> CollisionInfo
    - resolve_agent_collision(position: Vector2D, velocity: Vector2D, radius: float)
    - update() -> None
```

### Agent System
```python
class Agent:
    """
    Core agent implementation with physics and behavior
    """
    - id: str
    - team: str
    - physics: Physics
    - combat: CombatStats
    - movement: MovementStats
    - behavior_system: BehaviorSystem
    - world: World  # Reference to world for collision
    - bounds: Tuple[float, float, float, float]

    Methods:
    - update_behavior(nearby_agents: List[Agent]) -> None
    - update_position() -> None
    - handle_combat(all_agents: List[Agent]) -> None
```

### State Management System
```python
class GameState:
    """
    Central game state manager
    """
    - agents: Dict[str, Agent]
    - world: World
    - stats: GameStats
    - is_running: bool
    - active_config: Optional[Dict]
    
    Core Update Cycle:
    1. Behavior Update:
       - Update agent behaviors
       - Calculate forces
    
    2. Physics Update:
       - Store original positions
       - Update positions
       - Detect collisions
       - Resolve collisions
    
    3. Combat Resolution:
       - Process attacks
       - Handle agent deaths
       - Update statistics
```

## Game Loop

```python
class GameLoop:
    """
    Main game loop implementation
    """
    def _loop(self):
        while self.is_running:
            if self.game_state.is_running:
                # 1. State Update
                state = self.game_state.update()
                
                # 2. Broadcast Updates
                await self.broadcast_callback({
                    "type": "game_update",
                    "data": {
                        "timestamp": state["timestamp"],
                        "agents": state["agents"],
                        "stats": state["stats"]
                    }
                })
                
                # 3. Handle Combat Events
                if state["recent_kills"]:
                    await self.broadcast_combat_event(state)
                    
            await asyncio.sleep(UPDATE_INTERVAL)
```

## State Synchronization

### World State
```python
{
    "walls": [
        {
            "name": str,
            "x": float,
            "y": float,
            "width": float,
            "height": float
        }
    ],
    "bounds": tuple[float, float, float, float],
    "holes": [],
    "colines": []
}
```

### Agent State
```python
{
    "id": str,
    "team": str,
    "position": {
        "x": float,
        "y": float
    },
    "health": float,
    "target_id": Optional[str],
    "behavior": Optional[str]
}
```

## Physics Pipeline

1. **Pre-Update**
   - Store original positions
   - Calculate forces from behaviors

2. **Update**
   - Apply forces
   - Update velocities
   - Update positions

3. **Collision Resolution**
   - Detect collisions
   - Calculate collision responses
   - Apply position corrections
   - Update velocities

4. **Post-Update**
   - Apply bounds checking
   - Update agent states
   - Broadcast updates

## Development Guidelines

### Physics Handling
1. Use vector operations for all calculations
2. Handle collisions in world space
3. Maintain proper collision resolution order
4. Cache collision results when possible

### State Management
1. Centralize state updates in GameState
2. Use proper type hints
3. Handle all edge cases
4. Maintain consistent state broadcasting

### Error Handling
1. Validate all physics calculations
2. Handle collision edge cases
3. Maintain proper error logging
4. Use appropriate error recovery

## Testing Focus Areas

1. **Physics Tests**
   - Collision detection accuracy
   - Resolution correctness
   - Edge case handling
   - Vector calculations

2. **State Tests**
   - Update cycle correctness
   - State consistency
   - Event handling
   - Data validation

3. **Integration Tests**
   - Full update cycle
   - Multi-agent interactions
   - World-agent interactions
   - State synchronization