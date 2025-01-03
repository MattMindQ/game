# Full-Stack Architecture Report
## Project Structure
### Backend Structure
```game_server/
    +-- main.py (LOC: 69)
    +-- __init__.py (LOC: 0)
    +-- data/
        +-- behavior_service.py (LOC: 69)
        +-- config_service.py (LOC: 94)
        +-- db_connector.py (LOC: 39)
        +-- user_service.py (LOC: 43)
        +-- __init__.py (LOC: 0)
    +-- game/
        +-- behaviors.py (LOC: 287)
        +-- behavior_manager.py (LOC: 111)
        +-- config_manager.py (LOC: 30)
        +-- constants.py (LOC: 5)
        +-- loop.py (LOC: 73)
        +-- models.py (LOC: 233)
        +-- services.py (LOC: 0)
        +-- state.py (LOC: 339)
        +-- user_manager.py (LOC: 19)
        +-- vector.py (LOC: 37)
        +-- __init__.py (LOC: 0)
        +-- models/
        +-- physics/
            +-- collision.py (LOC: 88)
        +-- world/
            +-- base.py (LOC: 27)
            +-- wall.py (LOC: 20)
            +-- world.py (LOC: 271)
            +-- __init__.py (LOC: 0)
    +-- llm/
        +-- context_handler.py (LOC: 92)
        +-- llm_call.py (LOC: 159)
        +-- prompts.py (LOC: 108)
        +-- __init__.py (LOC: 0)
    +-- network/
        +-- websocket.py (LOC: 285)
        +-- __init__.py (LOC: 0)```
### Frontend Structure
```game_client/
    +-- index.html (LOC: 344)    # Game canvas container
    +-- public/
    +-- src/
        +-- main.ts (LOC: 175)    # Application entry point
        +-- style.css (LOC: 96)
        +-- ui.ts (LOC: 54)
        +-- vite-env.d.ts (LOC: 1)
        +-- components/
            +-- AgentDetailsPanel.ts (LOC: 17)
            +-- BehaviorListPanel.ts (LOC: 14)
            +-- CodeEditor.ts (LOC: 18)
            +-- ControlPanel.ts (LOC: 27)
            +-- DebugInfo.ts (LOC: 23)
            +-- GamePanel.ts (LOC: 22)
            +-- debug/
                +-- DebugPanel.ts (LOC: 83)
        +-- editor/
            +-- setup.ts (LOC: 78)
        +-- game/
            +-- CanvasRenderer.ts (LOC: 0)
            +-- Game.ts (LOC: 231)
            +-- Renderer copy.ts (LOC: 211)
            +-- Renderer.ts (LOC: 191)
            +-- WorldRenderer.ts (LOC: 53)
            +-- renderers/
                +-- AgentRenderer.ts (LOC: 69)
                +-- BaseRenderer.ts (LOC: 25)
                +-- DebugRenderer.ts (LOC: 99)
                +-- WorldRenderer.ts (LOC: 46)
        +-- managers/
            +-- ConfigManager.ts (LOC: 105)
            +-- StateManager.ts (LOC: 308)
            +-- UserInputManager.ts (LOC: 203)
        +-- network/
            +-- socket.ts (LOC: 305)    # WebSocket client implementation
        +-- types/
            +-- config.ts (LOC: 41)
            +-- index.ts (LOC: 62)
        +-- ui/
            +-- toggles.ts (LOC: 74)
            +-- copilot/
                +-- Copilot.ts (LOC: 442)
                +-- setup.ts (LOC: 108)
        +-- utils/
            +-- debug_check.ts (LOC: 135)```
## Backend Analysis

Total Python files: 29

### main.py
(LOC: 69)

### __init__.py
(LOC: 0)

### data\behavior_service.py
(LOC: 69)

#### Classes:
- BehaviorService

### data\config_service.py
(LOC: 94)

#### Classes:
- ConfigService

### data\db_connector.py
(LOC: 39)

#### Classes:
- DatabaseConnector

### data\user_service.py
(LOC: 43)

#### Classes:
- UserService

### data\__init__.py
(LOC: 0)

### game\behaviors.py
(LOC: 287)

#### Classes:
- BehaviorType
- ZoneType
- Zone
- AwarenessSystem
- BehaviorContext
- BaseBehavior
- WanderBehavior
- WanderTogetherBehavior
- AttackBehavior
- FleeBehavior
- DecisionMaker
- BehaviorSystem

### game\behavior_manager.py
(LOC: 111)

#### Classes:
- BehaviorValidator
- CustomBehavior
- BehaviorManager

### game\config_manager.py
(LOC: 30)

#### Classes:
- ConfigManager

### game\constants.py
(LOC: 5)

### game\loop.py
(LOC: 73)

#### Classes:
- GameLoop

### game\models.py
(LOC: 233)

#### Classes:
- GameStats
- DeadAgent
- CombatStats
- MovementStats
- Physics
- Agent

### game\services.py
(LOC: 0)

### game\state.py
(LOC: 339)

#### Classes:
- GameState

### game\user_manager.py
(LOC: 19)

#### Classes:
- UserManager

### game\vector.py
(LOC: 37)

#### Classes:
- Vector2D

### game\__init__.py
(LOC: 0)

### game\physics\collision.py
(LOC: 88)

#### Classes:
- CollisionInfo

### game\world\base.py
(LOC: 27)

#### Classes:
- Object

### game\world\wall.py
(LOC: 20)

#### Classes:
- Wall

### game\world\world.py
(LOC: 271)

#### Classes:
- World

### game\world\__init__.py
(LOC: 0)

### llm\context_handler.py
(LOC: 92)

#### Classes:
- LLMContextHandler

### llm\llm_call.py
(LOC: 159)

#### Classes:
- LLMService

### llm\prompts.py
(LOC: 108)

### llm\__init__.py
(LOC: 0)

### network\websocket.py
(LOC: 285)

#### Classes:
- ConnectionManager

### network\__init__.py
(LOC: 0)

**Total Python LOC:** 2498

## Frontend Analysis

Total TypeScript files: 30

### Unknown Files:

#### src\main.ts
(LOC: 175)
Exports:
- export const DEFAULT_BEHAVIOR_CODE = `# Agent behavior function
Functions:
- def
Classes:
- GameApplication

#### src\ui.ts
(LOC: 54)
Exports:
- export function setupToggleAgentDetails() {
- export function setupToggleCodeEditor() {
- export function setupToggleGameConfigButton() {
Functions:
- setupToggleAgentDetails
- setupToggleCodeEditor
- setupToggleGameConfigButton

#### src\vite-env.d.ts
(LOC: 1)

#### src\editor\setup.ts
(LOC: 78)
Exports:
- export async function setupMonacoEditor() {
- export const DEFAULT_BEHAVIOR_CODE = `# Agent behavior function
Functions:
- setupMonacoEditor
- def

#### src\managers\ConfigManager.ts
(LOC: 105)
Exports:
- export class ConfigManager {
Classes:
- ConfigManager

#### src\managers\StateManager.ts
(LOC: 308)
Exports:
- export class StateManager {
Functions:
- return
Classes:
- StateManager

#### src\managers\UserInputManager.ts
(LOC: 203)
Exports:
- export class UserInputManager {
Classes:
- UserInputManager

#### src\types\config.ts
(LOC: 41)
Exports:
- export interface GameConfig {

#### src\types\index.ts
(LOC: 62)
Exports:
- export interface Position {
- export interface Agent {
- export interface GameStats {
- export interface WorldObject {
- export interface WorldState {
- export interface Wall {
- export interface WorldState {
- export interface StateUpdate {

#### src\ui\toggles.ts
(LOC: 74)
Exports:
- export function setupUIToggles() {
- export function addToggleButton(config: ToggleConfig) {
- export function removeToggleButton(buttonId: string) {
- export function updateToggleConfig(buttonId: string, updates: Partial<ToggleConfig>) {
Functions:
- setupToggle
- setupUIToggles
- addToggleButton
- removeToggleButton
- updateToggleConfig

#### src\ui\copilot\Copilot.ts
(LOC: 442)
Exports:
- export class Copilot {
Classes:
- Copilot

#### src\ui\copilot\setup.ts
(LOC: 108)
Exports:
- export function setupCopilot({ connection, stateManager, editor }: CopilotSetupConfig): Copilot {
Functions:
- setupCopilot
- setupStateSubscriptions

### Component Files:

#### src\components\AgentDetailsPanel.ts
(LOC: 17)
Exports:
- export function createAgentDetailsPanel() {
Functions:
- createAgentDetailsPanel

#### src\components\BehaviorListPanel.ts
(LOC: 14)
Exports:
- export function createBehaviorListPanel() {
Functions:
- createBehaviorListPanel

#### src\components\CodeEditor.ts
(LOC: 18)
Exports:
- export function createCodeEditor() {
Functions:
- createCodeEditor

#### src\components\ControlPanel.ts
(LOC: 27)
Exports:
- export function createControlPanel() {
Functions:
- createControlPanel

#### src\components\DebugInfo.ts
(LOC: 23)
Exports:
- export function createDebugInfo() {
Functions:
- createDebugInfo

#### src\components\GamePanel.ts
(LOC: 22)
Exports:
- export function createGamePanel() {
Functions:
- createGamePanel

#### src\components\debug\DebugPanel.ts
(LOC: 83)
Exports:
- export class DebugPanel {
Classes:
- DebugPanel

### Game Files:

#### src\game\CanvasRenderer.ts
(LOC: 0)

#### src\game\Game.ts
(LOC: 231)
Exports:
- export class Game {
Functions:
- gameLoop
Classes:
- Game

#### src\game\Renderer copy.ts
(LOC: 211)
Exports:
- export class Renderer {
Classes:
- Renderer

#### src\game\Renderer.ts
(LOC: 191)
Exports:
- export class Renderer {
Classes:
- Renderer

#### src\game\WorldRenderer.ts
(LOC: 53)
Exports:
- export class WorldRenderer {
Classes:
- WorldRenderer

#### src\game\renderers\AgentRenderer.ts
(LOC: 69)
Exports:
- export class AgentRenderer extends BaseRenderer {
Classes:
- AgentRenderer

#### src\game\renderers\BaseRenderer.ts
(LOC: 25)
Exports:
- export abstract class BaseRenderer {
Classes:
- BaseRenderer

#### src\game\renderers\DebugRenderer.ts
(LOC: 99)
Exports:
- export class DebugRenderer extends BaseRenderer {
Classes:
- DebugRenderer

#### src\game\renderers\WorldRenderer.ts
(LOC: 46)
Exports:
- export class WorldRenderer extends BaseRenderer {
Classes:
- WorldRenderer

### Network Files:

#### src\network\socket.ts
(LOC: 305)
Exports:
- export class GameConnection {
Classes:
- GameConnection

### Utility Files:

#### src\utils\debug_check.ts
(LOC: 135)
Exports:
- export class DebugManager {
Classes:
- DebugManager

**Total TypeScript LOC:** 3220
