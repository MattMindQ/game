# Frontend Architecture Documentation

## Project Structure

```
game_client/
├── index.html         # Main HTML container
├── public/           # Static assets
└── src/
    ├── editor/
    │   └── setup.ts               # Monaco editor configuration
    ├── game/
    │   ├── CanvasRenderer.ts      # Canvas drawing operations
    │   ├── Game.ts                # Core game logic
    │   ├── Renderer.ts            # Base rendering system
    │   └── WorldRenderer.ts       # World environment rendering
    ├── managers/
    │   ├── ConfigManager.ts       # Configuration management
    │   ├── StateManager.ts        # Application state
    │   └── UserInputManager.ts    # Input handling
    ├── network/
    │   └── socket.ts             # WebSocket client
    ├── types/
    │   ├── config.ts            # Configuration types
    │   └── index.ts             # Common type definitions
    ├── ui/
    │   ├── toggles.ts           # UI toggle handlers
    │   └── copilot/
    │       ├── Copilot.ts       # Copilot implementation
    │       └── setup.ts         # Copilot initialization
    ├── main.ts                  # Application entry
    ├── style.css               # Global styles
    ├── ui.ts                   # UI utilities
    └── vite-env.d.ts          # Vite type definitions
```

## Core Components

### State Management

#### ConfigManager
Manages application configuration state and persistence.

```typescript
interface ConfigManager {
    activeConfig: GameConfig | null;
    savedConfigs: GameConfig[];
    
    loadConfig(configId: string): void;
    saveConfig(name: string, description?: string): Promise<void>;
    updateParameter<K extends keyof GameConfig['parameters']>(
        key: K,
        value: GameConfig['parameters'][K]
    ): void;
    getDefaultConfig(): GameConfig;
}
```

#### StateManager
Central state orchestrator with enhanced configuration support.

```typescript
interface GameState {
    isRunning: boolean;
    connectionStatus: ConnectionStatus;
    agents: Agent[];
    selectedAgent: Agent | null;
    stats: GameStats;
    config: GameConfig | null;
    user: UserContext | null;
}

class StateManager {
    private state: GameState;
    private configManager: ConfigManager;
    
    // State updates
    setGameRunning(isRunning: boolean): void;
    updateSimulationState(agents: Agent[], stats?: GameStats): void;
    setSelectedAgent(agent: Agent | null): void;
    
    // Config management
    loadConfig(configId: string): void;
    updateConfigParameter(key: string, value: any): void;
    
    // Subscription system
    subscribe(key: StateKey, callback: Subscriber): () => void;
}
```

### User Interface

#### Components

**1. Game Panel**
```typescript
class GamePanel {
    private canvas: HTMLCanvasElement;
    private renderer: CanvasRenderer;
    private worldRenderer: WorldRenderer;
    
    initialize(): void;
    handleResize(): void;
    updateDisplay(state: GameState): void;
}
```

**2. Control Panel**
```typescript
class ControlPanel {
    private configManager: ConfigManager;
    
    initializeControls(): void;
    handleConfigChange(config: GameConfig): void;
    updateTeamCounts(counts: TeamCounts): void;
}
```

**3. Agent Details**
```typescript
class AgentDetailsPanel {
    updateAgent(agent: Agent | null): void;
    updateBehavior(behavior: Behavior): void;
    toggleVisibility(visible: boolean): void;
}
```

**4. Code Editor**
```typescript
class CodeEditor {
    private editor: monaco.editor.IStandaloneCodeEditor;
    private configManager: ConfigManager;
    
    initialize(): void;
    updateCode(code: string): void;
    handleConfigChange(config: GameConfig): void;
}
```

### Network Layer

#### WebSocket Client
```typescript
class GameConnection {
    private socket: WebSocket;
    private messageHandlers: Map<string, MessageHandler>;
    
    connect(): Promise<void>;
    sendCommand(type: string, data?: any): void;
    
    // Config-specific methods
    sendConfigUpdate(config: GameConfig): void;
    requestConfigs(): void;
    
    // Message handlers
    handleConfigUpdate(data: ConfigUpdateMessage): void;
    handleStateUpdate(data: StateUpdateMessage): void;
}
```

### Copilot System

#### Enhanced Copilot
```typescript
class Copilot {
    private editor: monaco.editor.IStandaloneCodeEditor | null;
    private configManager: ConfigManager;
    
    // UI States
    private isExpanded: boolean;
    private isEditorVisible: boolean;
    
    // Enhanced methods
    toggleEditor(): void;
    handleCodeSuggestion(code: string): void;
    setConfig(config: GameConfig): void;
}
```

## Communication Flows

### Configuration Flow
```
User Input → ConfigManager → StateManager → WebSocket → Server
                                ↓
                          UI Components
```

### State Updates
```
Server → WebSocket → StateManager → Subscribers → UI Components
```

### Copilot Integration
```
User Query → Copilot → WebSocket → LLM Service → Response
                ↓
           Code Editor
```

## Error Handling

### Network Layer
```typescript
class ConnectionHandler {
    handleDisconnect(): void;
    attemptReconnect(): void;
    handleConfigError(error: ConfigError): void;
}
```

### Configuration
```typescript
class ConfigValidator {
    validateConfig(config: GameConfig): ValidationResult;
    handleValidationError(error: ValidationError): void;
}
```

## Development Guidelines

### State Management
1. Use TypeScript for type safety
2. Implement proper error boundaries
3. Maintain single source of truth
4. Handle config persistence
5. Validate state transitions

### UI Components
1. Follow component lifecycle
2. Implement clean-up
3. Handle config changes
4. Maintain responsiveness
5. Support accessibility

### Configuration
1. Validate all updates
2. Handle loading states
3. Maintain default values
4. Track user changes
5. Handle persistence

## Testing Strategy

### Unit Tests
- State management
- Config validation
- UI components
- Network handlers

### Integration Tests
- State synchronization
- Config persistence
- UI interactions
- WebSocket communication

### End-to-End Tests
- Game simulation
- Config management
- Copilot interaction
- Error scenarios

## Debug Features

### State Inspection
- Config viewer
- State logger
- Network monitor
- Performance metrics

### UI Tools
- Component inspector
- Layout debugger
- Event logger
- Config editor

## Performance Considerations

### Optimization
1. Efficient rendering
2. State updates batching
3. Config caching
4. Network optimization
5. Memory management

### Monitoring
1. FPS tracking
2. Network latency
3. State update frequency
4. Config change impact
5. Memory usage