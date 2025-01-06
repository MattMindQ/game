# Game Engine Architecture Documentation

## Overview
The game server implements a modular state management system integrated with WebSocket communication for real-time multiplayer gameplay. The architecture separates concerns between state management, behavior systems, network communication, and command handling.

## State Management Architecture

### Core Components

#### GameStateManager
The central state manager that orchestrates all game state components:
- Maintains game running state
- Coordinates between specialized state modules
- Handles high-level game flow
- Manages state synchronization
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
- Handles agent updates
- Tracks team assignments
- Coordinates with behavior state

5. **BehaviorState** (New)
- Manages agent behaviors
- Tracks behavior timers
- Handles behavior transitions
- Maintains awareness zones
- Coordinates decision making

### State Flow
```
GameStateManager
├─► ConfigState ──► Agent Configuration
├─► WorldState ──► Physics & Collisions
├─► CombatState ─► Combat Resolution
├─► AgentState ──► Agent Management
└─► BehaviorState ─► Behavior Management
```

## Behavior System Architecture

### Core Components

#### BehaviorState
- Manages behavior states for all agents
- Tracks behavior execution time
- Handles behavior transitions
- Maintains behavior configuration

#### BehaviorExecutor
- Executes behavior logic
- Calculates movement forces
- Handles zone-based decisions
- Manages behavior context

#### DecisionMaker
- Evaluates agent context
- Determines optimal behaviors
- Handles behavior priorities
- Manages behavior transitions

### Behavior Types
1. **WANDER**
   - Default exploration behavior
   - Random movement patterns
   - Boundary awareness

2. **WANDER_TOGETHER**
   - Group-based movement
   - Ally proximity maintenance
   - Combined wandering

3. **ATTACK**
   - Combat engagement
   - Target pursuit
   - Attack range management

4. **FLEE**
   - Threat avoidance
   - Health-based retreat
   - Strategic positioning

### Awareness System
```
Zone Types:
├─► Visual (150 units)
├─► Recognition (100 units)
└─► Combat (30 units)

Priority Order:
1. Survival (Flee)
2. Combat (Attack)
3. Group (Wander Together)
4. Default (Wander)
```

## Game Loop Integration

### Update Cycle
```
Game Loop
├─► State Updates
│   ├─► Get Agents
│   ├─► Update Behaviors
│   ├─► Update Physics
│   └─► Update Combat
├─► State Synchronization
└─► State Broadcasting
```

### Timing
- Fixed update interval
- Behavior timer tracking
- Combat cooldown management
- State sync scheduling

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
   - fetch_behaviors

4. LLM Integration
   - llm_query

## State Synchronization

### Update Cycle
```python
state_update = {
    "timestamp": current_timestamp,
    "agents": agent_states,
    "behaviors": behavior_states,
    "stats": game_stats,
    "world": world_state
}
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
    behaviors: BehaviorState;
}
```

2. **Agent State**
```typescript
interface AgentState {
    id: string;
    team: string;
    position: Vector2D;
    velocity: Vector2D;
    health: number;
    behavior: string;
    target_id?: string;
}
```

3. **Behavior State**
```typescript
interface BehaviorState {
    behaviors: {
        [agentId: string]: string;
    };
    timers: {
        [agentId: string]: number;
    };
    awareness: {
        [agentId: string]: ZoneConfig;
    };
}
```

## Implementation Guidelines

### State Management
1. Use appropriate state module for specific operations
2. Maintain state isolation
3. Use proper error handling
4. Log state changes appropriately

### Behavior Implementation
1. Keep behavior logic pure and stateless
2. Use BehaviorState for state tracking
3. Handle behavior transitions properly
4. Validate behavior contexts

### Error Handling
1. Validate all state transitions
2. Handle network disconnections
3. Implement command timeouts
4. Log all critical operations

## Testing Strategy

### Unit Testing
1. Test individual behaviors
2. Verify state transitions
3. Test decision making
4. Validate calculations

### Integration Testing
1. Test behavior interactions
2. Verify state synchronization
3. Test error recovery
4. Validate game flow

### Performance Testing
1. Test with multiple agents
2. Verify update cycle timing
3. Test network performance
4. Monitor state sync load