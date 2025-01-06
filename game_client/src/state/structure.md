graph TD
    %% Main Components
    WS[WebSocket Connection] --> MH[MessageHandler]
    MH --> SM[StateManager]
    
    %% State Manager Relations
    SM --> AM[AgentManager]
    SM --> WM[WorldManager]
    SM --> CM[CombatManager]
    SM --> BM[BehaviorManager]
    SM --> CFM[ConfigManager]
    
    %% Slices
    AM --> AS[AgentSlice]
    WM --> WS[WorldSlice]
    CM --> CS[CombatSlice]
    BM --> BS[BehaviorSlice]
    CFM --> CFS[ConfigSlice]
    
    %% Game Components
    SM --> Game
    Game --> Renderer
    Game --> IM[InputManager]
    
    %% Renderer Components
    Renderer --> AR[AgentRenderer]
    Renderer --> WR[WorldRenderer]
    Renderer --> DR[DebugRenderer]
    
    %% State Updates
    AS --> |Subscribe| Game
    WS --> |Subscribe| Game
    CS --> |Subscribe| Game
    BS --> |Subscribe| Game
    CFS --> |Subscribe| Game
    
    %% Input Flow
    IM --> SM
    IM --> |View Control| Renderer
    
    %% UI Updates
    Game --> |Update UI| UI[UI Components]
    UI --> |Events| IM
    
    %% WebSocket Loop
    Game --> |Commands| SM
    SM --> |Send| WS
    
    %% Styling
    classDef manager fill:#f9f,stroke:#333,stroke-width:2px
    classDef slice fill:#bbf,stroke:#333,stroke-width:2px
    classDef renderer fill:#bfb,stroke:#333,stroke-width:2px
    classDef core fill:#fbb,stroke:#333,stroke-width:2px
    classDef ui fill:#ffb,stroke:#333,stroke-width:2px
    
    class SM,AM,WM,CM,BM,CFM manager
    class AS,WS,CS,BS,CFS slice
    class Renderer,AR,WR,DR renderer
    class Game,WS,MH core
    class UI,IM ui

    %% Subgraphs for better organization
    subgraph State Management
        SM
        subgraph Managers
            AM
            WM
            CM
            BM
            CFM
        end
        subgraph Data Slices
            AS
            WS
            CS
            BS
            CFS
        end
    end
    
    subgraph Game Engine
        Game
        subgraph Rendering System
            Renderer
            AR
            WR
            DR
        end
        subgraph Input System
            IM
            UI
        end
    end
    
    subgraph Network
        WS
        MH
    end