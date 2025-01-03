# Game Server Architecture Documentation

## Overview
The game server implements a modular state management system integrated with WebSocket communication for real-time multiplayer gameplay. The architecture separates concerns between state management, network communication, and command handling.

## State Management Architecture

### Core Components

#### GameState
The central state manager that orchestrates all game state components:
- Maintains game running state
- Coordinates between specialized state modules
- Handles high-level game flow
- Provides backward compatibility layer

#### Specialized State Modules

1. **ConfigState**
- Manages game configuration
- Handles user settings
- Applies configuration to game elements
- Manages default configurations

2. **WorldState**
- Manages game world physics
- Handles collision detection
- Controls world boundaries
- Manages wall placements
- Provides spawn positions

3. **CombatState**
- Handles combat resolution
- Tracks kills and deaths
- Maintains game statistics
- Manages combat events

4. **AgentState**
- Manages agent lifecycle
- Controls agent behaviors
- Handles agent updates
- Tracks team assignments

### State Flow
```
GameState
├─► ConfigState ──► Agent Configuration
├─► WorldState ──► Physics & Collisions
├─► CombatState ─► Combat Resolution
└─► AgentState ──► Agent Management
```

## WebSocket Architecture

### Components

#### ConnectionManager
- Manages WebSocket connections
- Handles client connect/disconnect
- Broadcasts state updates
- Initializes game services

#### CommandHandler
- Processes incoming commands
- Routes commands to appropriate handlers
- Manages command responses
- Handles error cases

### Communication Flow
```
Client ─► WebSocket ─► CommandHandler ─► GameState
   ▲                                         │
   └─────────── State Updates ◄─────────────┘
```

### Command Types
1. Game Control
   - toggle_game
   - reset_game
   - add_agent

2. Configuration
   - load_config
   - save_config
   - list_configs

3. Behavior
   - update_custom_behavior
   - force_behavior

4. LLM Integration
   - llm_query

## State Synchronization

### Update Cycle
1. State Update Generation
```python
state_update = {
    "timestamp": current_timestamp,
    "agents": agent_states,
    "stats": game_stats,
    "world": world_state
}
```

2. Event Broadcasting
```python
await broadcast({
    "type": "game_update",
    "data": state_update
})
```

### State Types

1. **Game State**
```typescript
interface GameState {
    is_running: boolean;
    team_counts: {
        red: number;
        blue: number;
    };
    stats: GameStats;
    timestamp: number;
    world: WorldState;
    config: ConfigState;
    user: UserState;
}
```

2. **Agent State**
```typescript
interface AgentState {
    id: string;
    team: string;
    position: Vector2D;
    behavior: string;
    health: number;
    // ... other properties
}
```

## Error Handling

### Network Layer
- Connection error recovery
- Message validation
- Client disconnect handling
- Broadcast failure recovery

### State Layer
- State update validation
- Command validation
- Error logging
- State recovery mechanisms

## Implementation Guidelines

### State Management
1. Always use appropriate state module for specific operations
2. Maintain state isolation
3. Use proper error handling
4. Log state changes appropriately

### WebSocket Communication
1. Validate incoming messages
2. Handle disconnections gracefully
3. Implement proper error recovery
4. Maintain connection state

### Command Handling
1. Validate command structure
2. Use proper error handling
3. Implement command timeouts
4. Log command execution

## Testing Considerations

### State Testing
1. Test state transitions
2. Verify state consistency
3. Test error conditions
4. Validate state updates

### WebSocket Testing
1. Test connection handling
2. Verify message processing
3. Test broadcast functionality
4. Validate error scenarios

### Integration Testing
1. Test full update cycle
2. Verify state synchronization
3. Test error recovery
4. Validate game flow