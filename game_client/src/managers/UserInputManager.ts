// src/managers/UserInputManager.ts
import { StateManager } from './StateManager';
import { Position } from '../types';
import { Renderer } from '../game/Renderer';

interface InputState {
    isDragging: boolean;
    dragStartPosition: Position | null;
    mousePosition: Position;
    lastTouchDistance: number | null;
    isEnabled: boolean;
}

export class UserInputManager {
    private stateManager: StateManager;
    private canvas: HTMLCanvasElement;
    private inputState: InputState;
    private renderer: Renderer | null = null;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        this.inputState = {
            isDragging: false,
            dragStartPosition: null,
            mousePosition: { x: 0, y: 0 },
            lastTouchDistance: null,
            isEnabled: true
        };

        this.setupEventListeners();
    }

    public setRenderer(renderer: Renderer) {
        this.renderer = renderer;
    }

    private setupEventListeners(): void {
        // Mouse events
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Handle window blur
        window.addEventListener('blur', this.handleWindowBlur.bind(this));

        this.setupBehaviorControls();
    }

    private getCanvasPosition(clientX: number, clientY: number): Position {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        // If renderer is not set, return canvas coordinates
        if (!this.renderer) {
            return { x: canvasX, y: canvasY };
        }
        
        return this.renderer.canvasToWorld(canvasX, canvasY);
    }

    private handleMouseMove(event: MouseEvent): void {
        if (!this.inputState.isEnabled) return;

        const worldPos = this.getCanvasPosition(event.clientX, event.clientY);
        this.inputState.mousePosition = worldPos;

        this.updateMousePositionDisplay(worldPos);
        this.handleDragging(worldPos);
    }

    private updateMousePositionDisplay(worldPos: Position): void {
        const mousePositionElement = document.getElementById('mousePosition');
        if (mousePositionElement) {
            mousePositionElement.textContent = `x: ${Math.round(worldPos.x)}, y: ${Math.round(worldPos.y)}`;
        }
    }

    private handleDragging(currentPos: Position): void {
        if (!this.inputState.isDragging || !this.inputState.dragStartPosition) return;

        const selectedAgent = this.stateManager.getSelectedAgent();
        if (!selectedAgent) return;

        const dx = currentPos.x - this.inputState.dragStartPosition.x;
        const dy = currentPos.y - this.inputState.dragStartPosition.y;

        this.stateManager.updateAgentPosition(selectedAgent.id, {
            x: selectedAgent.position.x + dx,
            y: selectedAgent.position.y + dy
        });

        this.inputState.dragStartPosition = currentPos;
    }

    private handleMouseDown(event: MouseEvent): void {
        if (!this.inputState.isEnabled || event.button !== 0) return;

        const worldPos = this.getCanvasPosition(event.clientX, event.clientY);
        this.handleAgentSelection(worldPos);
    }

    private handleAgentSelection(worldPos: Position): void {
        const agents = this.stateManager.getAgents();
        const clickedAgent = this.findClickedAgent(worldPos, agents);

        if (clickedAgent) {
            this.stateManager.setSelectedAgent(clickedAgent);
            this.inputState.isDragging = true;
            this.inputState.dragStartPosition = worldPos;
        } else {
            this.stateManager.setSelectedAgent(null);
            this.inputState.isDragging = false;
            this.inputState.dragStartPosition = null;
        }
    }

    private findClickedAgent(pos: Position, agents: any[]): any {
        const clickRadius = 15 * (this.renderer ? 1 / this.renderer.getViewport().scale : 1);
        return agents.find(agent => {
            const dx = agent.position.x - pos.x;
            const dy = agent.position.y - pos.y;
            return Math.sqrt(dx * dx + dy * dy) <= clickRadius;
        });
    }

    private handleMouseUp(): void {
        this.inputState.isDragging = false;
        this.inputState.dragStartPosition = null;
    }

    private handleWheel(event: WheelEvent): void {
        if (!this.inputState.isEnabled || !this.renderer) return;
        // Wheel handling is managed by the Renderer
    }

    private handleTouchStart(event: TouchEvent): void {
        event.preventDefault();
        if (!this.inputState.isEnabled) return;

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.handleMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0
            } as MouseEvent);
        } else if (event.touches.length === 2) {
            this.inputState.lastTouchDistance = this.getTouchDistance(event.touches);
        }
    }

    private handleTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (!this.inputState.isEnabled) return;

        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.handleMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            } as MouseEvent);
        } else if (event.touches.length === 2 && this.inputState.lastTouchDistance !== null && this.renderer) {
            const currentDistance = this.getTouchDistance(event.touches);
            const scale = currentDistance / this.inputState.lastTouchDistance;
            this.inputState.lastTouchDistance = currentDistance;
            
            const center = this.getTouchCenter(event.touches);
            this.renderer.handlePinchZoom(scale, center);
        }
    }

    private getTouchDistance(touches: TouchList): number {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private getTouchCenter(touches: TouchList): Position {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    private handleTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        this.handleMouseUp();
        this.inputState.lastTouchDistance = null;
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.inputState.isEnabled || !this.renderer) return;

        const selectedAgent = this.stateManager.getSelectedAgent();
        if (!selectedAgent) return;

        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                this.stateManager.removeAgent(selectedAgent.id);
                break;

            case 'Escape':
                this.stateManager.setSelectedAgent(null);
                break;

            case 'c':
                this.renderer.centerOnPosition(selectedAgent.position);
                break;
        }
    }

    private handleWindowBlur(): void {
        this.handleMouseUp();
    }

    private setupBehaviorControls(): void {
        const behaviorIds = [
            'cohesion', 'alignment', 'separation',
            'wander', 'avoidWalls', 'pursue', 'flee'
        ];

        behaviorIds.forEach(id => {
            const slider = document.getElementById(`${id}Weight`) as HTMLInputElement;
            const valueDisplay = document.getElementById(`${id}Value`);

            if (slider && valueDisplay) {
                slider.addEventListener('input', () => {
                    const value = parseFloat(slider.value);
                    valueDisplay.textContent = value.toFixed(1);

                    const selectedAgent = this.stateManager.getSelectedAgent();
                    if (selectedAgent) {
                        this.stateManager.updateAgentBehavior(selectedAgent.id, {
                            [id]: value
                        });
                    }
                });
            }
        });
    }

    public disableInput(): void {
        this.inputState.isEnabled = false;
        this.handleMouseUp();
    }

    public enableInput(): void {
        this.inputState.isEnabled = true;
    }

    public getMousePosition(): Position {
        return this.inputState.mousePosition;
    }
}