// src/managers/UserInputManager.ts
import { StateManager } from './StateManager';
import { Position } from '../types';

export class UserInputManager {
    private stateManager: StateManager;
    private canvas: HTMLCanvasElement;
    private mousePosition: Position = { x: 0, y: 0 };
    private isDragging: boolean = false;
    private dragStartPosition: Position | null = null;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        this.setupEventListeners();
    }

    private setupEventListeners() {
        // Mouse movement tracking
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Mouse click handlers
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Touch handlers for mobile with passive option
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());



        // Handle behavior control sliders
        this.setupBehaviorControls();
    }

    private getCanvasPosition(clientX: number, clientY: number): Position {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    private handleMouseMove(event: MouseEvent) {
        this.mousePosition = this.getCanvasPosition(event.clientX, event.clientY);
        
        // Update mouse position display
        const mousePositionElement = document.getElementById('mousePosition');
        if (mousePositionElement) {
            mousePositionElement.textContent = `x: ${Math.round(this.mousePosition.x)}, y: ${Math.round(this.mousePosition.y)}`;
        }

        // Handle dragging if active
        if (this.isDragging && this.dragStartPosition) {
            const selectedAgent = this.stateManager.getSelectedAgent();
            if (selectedAgent) {
                // Calculate drag delta
                const dx = this.mousePosition.x - this.dragStartPosition.x;
                const dy = this.mousePosition.y - this.dragStartPosition.y;
                
                // Update agent target position
                this.stateManager.updateAgentPosition(selectedAgent.id, {
                    x: selectedAgent.position.x + dx,
                    y: selectedAgent.position.y + dy
                });
                
                // Update drag start position for next frame
                this.dragStartPosition = this.mousePosition;
            }
        }
    }

    private handleMouseDown(event: MouseEvent) {
        // Only handle left click
        if (event.button !== 0) return;

        const clickPosition = this.getCanvasPosition(event.clientX, event.clientY);
        const agents = this.stateManager.getAgents();
        
        // Find clicked agent
        const clickedAgent = agents.find(agent => {
            const dx = agent.position.x - clickPosition.x;
            const dy = agent.position.y - clickPosition.y;
            return Math.sqrt(dx * dx + dy * dy) <= 15; // 15px click radius
        });

        if (clickedAgent) {
            this.stateManager.setSelectedAgent(clickedAgent);
            this.isDragging = true;
            this.dragStartPosition = clickPosition;
        } else {
            this.stateManager.setSelectedAgent(null);
            this.isDragging = false;
            this.dragStartPosition = null;
        }
    }

    private handleMouseUp() {
        this.isDragging = false;
        this.dragStartPosition = null;
    }

    private handleTouchStart(event: TouchEvent) {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.handleMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0
            } as MouseEvent);
        }
    }

    private handleTouchMove(event: TouchEvent) {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.handleMouseMove({
                clientX: touch.clientX,
                clientY: touch.clientY
            } as MouseEvent);
        }
    }

    private handleTouchEnd(event: TouchEvent) {
        event.preventDefault();
        this.handleMouseUp();
    }

    private handleKeyDown(event: KeyboardEvent) {
        const selectedAgent = this.stateManager.getSelectedAgent();
        
        if (!selectedAgent) return;

        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                // TODO: Implement agent deletion
                break;

            case 'Escape':
                this.stateManager.setSelectedAgent(null);
                break;

            // Add more keyboard controls as needed
        }
    }

    private setupBehaviorControls() {
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

    // Public methods for external control
    public disableInput() {
        this.isDragging = false;
        this.dragStartPosition = null;
    }



    public enableInput() {
        // Add any necessary logic for re-enabling input
    }

    public getMousePosition(): Position {
        return this.mousePosition;
    }
}