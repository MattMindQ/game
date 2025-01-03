# Full-Stack Architecture Report
## Project Structure
### Backend Structure
```game_server/
    +-- main.py
    +-- __init__.py
    +-- data/
        +-- behavior_service.py
        +-- config_service.py
        +-- db_connector.py
        +-- user_service.py
        +-- __init__.py
    +-- game/
        +-- behaviors.py
        +-- behavior_manager.py
        +-- config_manager.py
        +-- constants.py
        +-- loop.py
        +-- models.py
        +-- services.py
        +-- state.py
        +-- user_manager.py
        +-- vector.py
        +-- __init__.py
        +-- world/
            +-- base.py
            +-- wall.py
            +-- world.py
            +-- __init__.py
    +-- llm/
        +-- context_handler.py
        +-- llm_call.py
        +-- prompts.py
        +-- __init__.py
    +-- network/
        +-- websocket.py
        +-- __init__.py```
### Frontend Structure
```game_client/
    +-- index.html    # Game canvas container
    +-- public/
    +-- src/
        +-- main.ts    # Application entry point
        +-- style.css
        +-- ui.ts
        +-- vite-env.d.ts
        +-- components/
            +-- AgentDetailsPanel.ts
            +-- BehaviorListPanel.ts
            +-- CodeEditor.ts
            +-- ControlPanel.ts
            +-- DebugInfo.ts
            +-- GamePanel.ts
        +-- editor/
            +-- setup.ts
        +-- game/
            +-- CanvasRenderer.ts
            +-- Game.ts
            +-- Renderer.ts
            +-- WorldRenderer.ts
        +-- managers/
            +-- ConfigManager.ts
            +-- StateManager.ts
            +-- UserInputManager.ts
        +-- network/
            +-- socket.ts    # WebSocket client implementation
        +-- types/
            +-- config.ts
            +-- index.ts
        +-- ui/
            +-- toggles.ts
            +-- copilot/
                +-- Copilot.ts
                +-- setup.ts```
## Backend Analysis

Total Python files: 28

### main.py

### __init__.py

### data\behavior_service.py

#### Classes:
- BehaviorService

### data\config_service.py

#### Classes:
- ConfigService

### data\db_connector.py

#### Classes:
- DatabaseConnector

### data\user_service.py

#### Classes:
- UserService

### data\__init__.py

### game\behaviors.py

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

#### Classes:
- BehaviorValidator
- CustomBehavior
- BehaviorManager

### game\config_manager.py

#### Classes:
- ConfigManager

### game\constants.py

### game\loop.py

#### Classes:
- GameLoop

### game\models.py

#### Classes:
- GameStats
- DeadAgent
- CombatStats
- MovementStats
- Physics
- Agent

### game\services.py

### game\state.py

#### Classes:
- GameState

### game\user_manager.py

#### Classes:
- UserManager

### game\vector.py

#### Classes:
- Vector2D

### game\__init__.py

### game\world\base.py

#### Classes:
- Object

### game\world\wall.py

#### Classes:
- Wall

### game\world\world.py

#### Classes:
- World

### game\world\__init__.py

### llm\context_handler.py

#### Classes:
- LLMContextHandler

### llm\llm_call.py

#### Classes:
- LLMService

### llm\prompts.py

### llm\__init__.py

### network\websocket.py

#### Classes:
- ConnectionManager

### network\__init__.py

## Frontend Analysis

Total TypeScript files: 23

### Unknown Files:

#### src\main.ts
Exports:
- export const DEFAULT_BEHAVIOR_CODE = `# Agent behavior function

#### src\ui.ts
Exports:
- export function setupToggleAgentDetails() {
- export function setupToggleCodeEditor() {
- export function setupToggleGameConfigButton() {

#### src\vite-env.d.ts

#### src\components\AgentDetailsPanel.ts
Exports:
- export function createAgentDetailsPanel() {

#### src\components\BehaviorListPanel.ts
Exports:
- export function createBehaviorListPanel() {

#### src\components\CodeEditor.ts
Exports:
- export function createCodeEditor() {

#### src\components\ControlPanel.ts
Exports:
- export function createControlPanel() {

#### src\components\DebugInfo.ts
Exports:
- export function createDebugInfo() {

#### src\components\GamePanel.ts
Exports:
- export function createGamePanel() {

#### src\editor\setup.ts
Exports:
- export async function setupMonacoEditor() {
- export const DEFAULT_BEHAVIOR_CODE = `# Agent behavior function

#### src\game\CanvasRenderer.ts

#### src\game\Game.ts
Exports:
- export class Game {
Functions:
- gameLoop

#### src\game\Renderer.ts
Exports:
- export class Renderer {
Functions:
- selectedAgent

#### src\game\WorldRenderer.ts
Exports:
- export class WorldRenderer {

#### src\managers\ConfigManager.ts
Exports:
- export class ConfigManager {
Functions:
- config

#### src\managers\StateManager.ts
Exports:
- export class StateManager {
Functions:
- updatedSelectedAgent
- agent

#### src\managers\UserInputManager.ts
Exports:
- export class UserInputManager {
Functions:
- clickedAgent

#### src\network\socket.ts
Exports:
- export class GameConnection {

#### src\types\config.ts
Exports:
- export interface GameConfig {

#### src\types\index.ts
Exports:
- export interface Position {
- export interface Agent {
- export interface GameStats {
- export interface WorldObject {
- export interface WorldState {

#### src\ui\toggles.ts
Exports:
- export function setupUIToggles() {
- export function addToggleButton(config: ToggleConfig) {
- export function removeToggleButton(buttonId: string) {
- export function updateToggleConfig(buttonId: string, updates: Partial<ToggleConfig>) {
Functions:
- setupToggle
- index
- config

#### src\ui\copilot\Copilot.ts
Exports:
- export class Copilot {
Functions:
- conversation

#### src\ui\copilot\setup.ts
Exports:
- export function setupCopilot({ connection, stateManager, editor }: CopilotSetupConfig): Copilot {
Functions:
- setupStateSubscriptions
