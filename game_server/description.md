# Backend Architecture Documentation

## Project Structure

```
game_server/
├── data/                # Data persistence layer
│   ├── behavior_service.py  # Behavior data operations
│   ├── config_service.py    # Configuration management
│   ├── db_connector.py      # Database connection handler
│   ├── user_service.py      # User management
│   └── __init__.py
├── game/                # Game logic layer
│   ├── behaviors.py         # Core behavior definitions
│   ├── behavior_manager.py  # Behavior orchestration
│   ├── config_manager.py    # Runtime config management
│   ├── constants.py         # Game constants
│   ├── loop.py             # Game loop handler
│   ├── models.py           # Game entities
│   ├── services.py         # Game service integrations
│   ├── state.py           # Game state management
│   ├── user_manager.py    # User session management
│   ├── vector.py          # Vector calculations
│   └── world/            # World environment
│       ├── base.py       # Base world elements
│       ├── wall.py       # Wall implementations
│       ├── world.py      # World management
│       └── __init__.py
├── llm/                 # LLM Integration
│   ├── context_handler.py  # Context processing
│   ├── llm_call.py        # LLM service calls
│   ├── prompts.py         # LLM prompt templates
│   └── __init__.py
├── network/             # Network layer
│   ├── websocket.py     # WebSocket communication
│   └── __init__.py
└── main.py             # Application entry point
```

## Core Components

### Data Layer (data/)
Handles all data persistence and database operations.

**1. Database Connector (db_connector.py)**
```python
class DatabaseConnector:
    - MongoDB connection management
    - Collection access
    - ID formatting and validation
    - Error handling
```

**2. Behavior Service (behavior_service.py)**
```python
class BehaviorService:
    - save_behavior(behavior_data: dict) -> str
    - get_behavior(behavior_id: str) -> dict
    - list_behaviors() -> List[Dict]
    - update_behavior(behavior_id: str, updates: dict) -> bool
    - delete_behavior(behavior_id: str) -> bool
```

**3. Config Service (config_service.py)**
```python
class ConfigService:
    - save_config(config_data: dict, user_id: str) -> str
    - get_config(config_id: str) -> dict
    - list_configs(user_id: Optional[str]) -> List[Dict]
    - update_config(config_id: str, updates: dict) -> bool
    - delete_config(config_id: str, user_id: str) -> bool
    - get_default_config() -> dict
```

**4. User Service (user_service.py)**
```python
class UserService:
    - get_or_create_default_user() -> Dict
    - get_user(user_id: str) -> Dict
    - update_user_settings(user_id: str, settings: dict) -> bool
```

### Game Layer (game/)

**1. Game State (state.py)**
```python
class GameState:
    - Manages active game session
    - Handles agent lifecycle
    - Tracks performance metrics
    - Manages user context
    - Handles configuration state
```

**2. Behavior System (behaviors.py, behavior_manager.py)**
```python
class BehaviorManager:
    - Behavior registration
    - Custom behavior validation
    - Behavior execution
    - State management
```

**3. Config Management (config_manager.py)**
```python
class ConfigManager:
    - Runtime config updates
    - Config validation
    - Default config management
    - User config handling
```

**4. World System (world/)**
```python
class World:
    - Environment management
    - Collision detection
    - Obstacle handling
    - Boundary management
```

### LLM Integration (llm/)

**1. Context Handler (context_handler.py)**
```python
class LLMContextHandler:
    - Context preprocessing
    - Query validation
    - Response formatting
    - Code generation context
```

**2. LLM Service (llm_call.py)**
```python
class LLMService:
    - API communication
    - Response processing
    - Error handling
    - Context management
```

### Network Layer (network/)

**WebSocket Handler (websocket.py)**
```python
class ConnectionManager:
    - Client connection management
    - Message routing
    - State synchronization
    - Event broadcasting
```

## Communication Flow

### Configuration Flow
```
Client Request → WebSocket → ConfigManager → ConfigService → Database
                                ↓
                          State Update → Broadcast → Clients
```

### User Management Flow
```
Connection → UserService → Default User → ConfigService → Initial State
                                               ↓
                                         State Update → Client
```

### Behavior Management Flow
```
Custom Behavior → BehaviorManager → Validation → BehaviorService → Database
                       ↓
                 State Update → Broadcast → Clients
```

## State Management

### User Context
- Default user handling
- User-specific configurations
- Session management
- Permission validation

### Configuration State
- Active configuration tracking
- User-specific settings
- Default fallbacks
- Runtime updates

### Game State
- World state
- Agent states
- Team statistics
- Performance metrics

## Error Handling

### Database Operations
- Connection error recovery
- Transaction management
- Validation errors
- Constraint violations

### User Operations
- Authentication errors
- Permission errors
- Session handling
- State recovery

### Configuration
- Validation errors
- Update conflicts
- Default config handling
- User config access

## Development Guidelines

### Data Layer
1. Use service abstractions
2. Handle database transactions
3. Validate all operations
4. Maintain type safety

### Game Logic
1. Separate concerns
2. Use manager classes
3. Maintain state consistency
4. Handle edge cases

### Configuration
1. Validate configs
2. Handle user context
3. Maintain defaults
4. Track changes

## Testing Strategy

### Components to Test
- Database operations
- Game state management
- Configuration handling
- User management
- World physics
- Network communication

### Test Types
1. Unit Tests
   - Service operations
   - Game logic
   - Data validation

2. Integration Tests
   - Database operations
   - State synchronization
   - Config management

3. System Tests
   - End-to-end flows
   - Error scenarios
   - Performance tests