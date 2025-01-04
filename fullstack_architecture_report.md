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
        +-- loop.py (LOC: 76)
        +-- models.py (LOC: 233)
        +-- state_manager.py (LOC: 161)
        +-- user_manager.py (LOC: 20)
        +-- vector.py (LOC: 37)
        +-- __init__.py (LOC: 0)
        +-- models/
        +-- physics/
            +-- collision.py (LOC: 88)
        +-- state/
            +-- agent_state.py (LOC: 90)
            +-- combat_state.py (LOC: 97)
            +-- config_state.py (LOC: 97)
            +-- world_state.py (LOC: 110)
            +-- __init__.py (LOC: 0)
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
        +-- command_handler.py (LOC: 261)
        +-- websocket.py (LOC: 149)
        +-- __init__.py (LOC: 0)```
### Frontend Structure
```game_client/
    +-- index copy.html (LOC: 344)
    +-- index.html (LOC: 47)    # Game canvas container
    +-- public/
    +-- src/
        +-- main.ts (LOC: 104)    # Application entry point
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
        +-- constants/
            +-- events.ts (LOC: 95)
        +-- editor/
            +-- constants.ts (LOC: 35)
            +-- EditorManager.ts (LOC: 75)
            +-- setup.ts (LOC: 43)
            +-- types.ts (LOC: 18)
        +-- game/
            +-- CanvasRenderer.ts (LOC: 0)
            +-- Game.ts (LOC: 230)
            +-- Renderer.ts (LOC: 191)
            +-- WorldRenderer.ts (LOC: 53)
            +-- renderers/
                +-- AgentRenderer.ts (LOC: 69)
                +-- BaseRenderer.ts (LOC: 25)
                +-- DebugRenderer.ts (LOC: 99)
                +-- WorldRenderer.ts (LOC: 46)
        +-- managers/
            +-- BehaviorCustomizationManager.ts (LOC: 83)
            +-- ConfigManager.ts (LOC: 105)
            +-- StateManager.ts (LOC: 378)
            +-- UIManager.ts (LOC: 214)
            +-- UserInputManager.ts (LOC: 203)
        +-- network/
            +-- MessageHandler.ts (LOC: 86)
            +-- NotificationService.ts (LOC: 21)
            +-- socket copy.ts (LOC: 305)
            +-- socket.ts (LOC: 135)    # WebSocket client implementation
            +-- types.ts (LOC: 52)
        +-- state/
            +-- AgentSlice.ts (LOC: 46)
            +-- BehaviorSlice.ts (LOC: 42)
            +-- ConfigSlice.ts (LOC: 75)
            +-- GameSlice.ts (LOC: 28)
            +-- WorldSlice.ts (LOC: 22)
        +-- templates/
            +-- partials/
                +-- behavior-panel.html (LOC: 66)
                +-- code-editor.html (LOC: 25)
                +-- control-panel.html (LOC: 80)
                +-- game-header.html (LOC: 139)
                +-- game-panel/
                    +-- canvas.html (LOC: 4)
                    +-- config.html (LOC: 105)
        +-- types/
            +-- config.ts (LOC: 41)
            +-- index.ts (LOC: 58)
        +-- ui/
            +-- BehaviorPanelManager.ts (LOC: 159)
            +-- toggles.ts (LOC: 74)
            +-- copilot/
                +-- Copilot.ts (LOC: 442)
                +-- setup.ts (LOC: 108)
        +-- utils/
            +-- debug_check.ts (LOC: 135)
            +-- EventBus.ts (LOC: 75)
            +-- templateLoader.ts (LOC: 20)```
## Backend Analysis

Total Python files: 34

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
- BehaviorManager

### game\config_manager.py
(LOC: 30)

#### Classes:
- ConfigManager

### game\constants.py
(LOC: 5)

### game\loop.py
(LOC: 76)

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

### game\state_manager.py
(LOC: 161)

#### Classes:
- GameState

### game\user_manager.py
(LOC: 20)

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

### game\state\agent_state.py
(LOC: 90)

#### Classes:
- AgentState

### game\state\combat_state.py
(LOC: 97)

#### Classes:
- CombatState

### game\state\config_state.py
(LOC: 97)

#### Classes:
- ConfigState

### game\state\world_state.py
(LOC: 110)

#### Classes:
- WorldState

### game\state\__init__.py
(LOC: 0)

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

### network\command_handler.py
(LOC: 261)

#### Classes:
- CommandHandler

### network\websocket.py
(LOC: 149)

#### Classes:
- ConnectionManager

### network\__init__.py
(LOC: 0)

**Total Python LOC:** 2843

## Frontend Analysis

Total TypeScript files: 47

### Unknown Files:

#### src\main.ts
(LOC: 104)
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

#### src\constants\events.ts
(LOC: 95)
Exports:
- export interface GameState {
- export interface TeamCounts {
- export type UIEventPayloads = {
- export type StateEventPayloads = {
- export type SocketEventPayloads = {
- export const UI_EVENTS = {
- export const STATE_EVENTS = {
- export const SOCKET_EVENTS = {
- export const emit = <T extends keyof UIEventPayloads | keyof StateEventPayloads | keyof SocketEventPayloads>(

#### src\editor\constants.ts
(LOC: 35)
Exports:
- export const DEFAULT_BEHAVIOR_CODE = `# Agent behavior function
Functions:
- def

#### src\editor\EditorManager.ts
(LOC: 75)
Exports:
- export class EditorManager {
Classes:
- EditorManager

#### src\editor\setup.ts
(LOC: 43)
Exports:
- export async function setupMonacoEditor() {
Functions:
- setupMonacoEditor

#### src\editor\types.ts
(LOC: 18)
Exports:
- export interface Agent {
- export interface EditorState {

#### src\managers\BehaviorCustomizationManager.ts
(LOC: 83)
Exports:
- export class BehaviorCustomizationManager {
Classes:
- BehaviorCustomizationManager

#### src\managers\ConfigManager.ts
(LOC: 105)
Exports:
- export class ConfigManager {
Classes:
- ConfigManager

#### src\managers\StateManager.ts
(LOC: 378)
Exports:
- export class StateManager {
Classes:
- StateManager

#### src\managers\UIManager.ts
(LOC: 214)
Exports:
- export interface UIState {
- export class UIManager {
Classes:
- UIManager

#### src\managers\UserInputManager.ts
(LOC: 203)
Exports:
- export class UserInputManager {
Classes:
- UserInputManager

#### src\state\AgentSlice.ts
(LOC: 46)
Exports:
- export class AgentSlice {
Classes:
- AgentSlice

#### src\state\BehaviorSlice.ts
(LOC: 42)
Exports:
- export class BehaviorSlice {
Classes:
- BehaviorSlice

#### src\state\ConfigSlice.ts
(LOC: 75)
Exports:
- export class ConfigSlice {
Classes:
- ConfigSlice

#### src\state\GameSlice.ts
(LOC: 28)
Exports:
- export class GameSlice {
Classes:
- GameSlice

#### src\state\WorldSlice.ts
(LOC: 22)
Exports:
- export class WorldSlice {
Classes:
- WorldSlice

#### src\types\config.ts
(LOC: 41)
Exports:
- export interface GameConfig {

#### src\types\index.ts
(LOC: 58)
Exports:
- export interface Position {
- export interface Agent {
- export interface CustomBehavior {
- export interface GameStats {
- export interface WorldObject {
- export interface WorldState {
- export interface StateUpdate {

#### src\ui\BehaviorPanelManager.ts
(LOC: 159)
Exports:
- export class BehaviorPanelManager {
Classes:
- BehaviorPanelManager

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
(LOC: 230)
Exports:
- export class Game {
Functions:
- gameLoop
Classes:
- Game

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

#### src\network\MessageHandler.ts
(LOC: 86)
Exports:
- export class MessageHandler {
Classes:
- MessageHandler

#### src\network\NotificationService.ts
(LOC: 21)
Exports:
- export class NotificationService {
Classes:
- NotificationService

#### src\network\socket copy.ts
(LOC: 305)
Exports:
- export class GameConnection {
Classes:
- GameConnection

#### src\network\socket.ts
(LOC: 135)
Exports:
- export class GameConnection {
Classes:
- GameConnection

#### src\network\types.ts
(LOC: 52)
Exports:
- export interface GameStateMessage {
- export interface GameUpdateMessage {
- export interface LLMQuery {
- export interface LLMResponse {
- export interface LLMError {
- export interface BehaviorUpdateResponse {
- export type NotificationType = 'success' | 'error' | 'info';
- export interface WebSocketCommand {

### Utility Files:

#### src\utils\debug_check.ts
(LOC: 135)
Exports:
- export class DebugManager {
Classes:
- DebugManager

#### src\utils\EventBus.ts
(LOC: 75)
Exports:
- export class EventBus {
Functions:
- return
Classes:
- EventBus

#### src\utils\templateLoader.ts
(LOC: 20)
Exports:
- export class TemplateLoader {
Classes:
- TemplateLoader

**Total TypeScript LOC:** 4249
