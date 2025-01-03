// src/ui/copilot/setup.ts
import { Copilot } from './Copilot';
import { GameConnection } from '../../network/socket';
import { StateManager } from '../../managers/StateManager';

interface CopilotSetupConfig {
    connection: GameConnection;
    stateManager: StateManager;
    editor?: any;
}

const COPILOT_CONTEXTS = [
    {
        elementId: 'gameControls',
        elementName: 'Game Controls',
        description: 'Control panel for managing the game simulation'
    },
    {
        elementId: 'agentDetails',
        elementName: 'Agent Details',
        description: 'Detailed information about the selected agent'
    },
    {
        elementId: 'gameCanvas',
        elementName: 'Game View',
        description: 'Main game visualization area showing agents and their behaviors'
    },
    {
        elementId: 'behaviorControls',
        elementName: 'Behavior Settings',
        description: 'Controls for adjusting agent behavior parameters'
    },
    {
        elementId: 'displayOptions',
        elementName: 'Display Settings',
        description: 'Visual settings and display options for the simulation'
    },
    {
        elementId: 'debugInfo',
        elementName: 'Debug Panel',
        description: 'Debug information and current simulation state'
    },
    {
        elementId: 'codeEditor',
        elementName: 'Behavior Editor',
        description: 'Create and modify agent behaviors with AI assistance'
    }
];

export function setupCopilot({ connection, stateManager, editor }: CopilotSetupConfig): Copilot {
    // Initialize copilot
    const copilot = new Copilot('app', connection);

    // Setup editor integration if provided
    if (editor) {
        copilot.setEditor(editor);
    }

    // Setup copilot triggers for all defined contexts
    COPILOT_CONTEXTS.forEach(context => {
        const element = document.getElementById(context.elementId);
        if (element) {
            const trigger = copilot.createTrigger(element, context);
            const container = element.querySelector('.copilot-container') || element;
            container.appendChild(trigger);
        }
    });

    // Setup state subscriptions
    setupStateSubscriptions(copilot, stateManager);

    return copilot;
}

function setupStateSubscriptions(copilot: Copilot, stateManager: StateManager) {
    // Subscribe to agent selection changes
    stateManager.subscribe('selectedAgent', (agent) => {
        if (agent) {
            copilot.setContext({
                elementId: 'agentDetails',
                elementName: `Agent ${agent.id.slice(0, 6)}`,
                description: `Selected ${agent.team} team agent with current behavior: ${agent.currentBehavior}`
            });
        }
    });

    // Subscribe to game state changes
    stateManager.subscribe('gameState', (state) => {
        if (state.isRunning) {
            copilot.setContext({
                elementId: 'gameControls',
                elementName: 'Game Controls',
                description: 'Game is running. Monitor and control the simulation.'
            });
        }
    });

    // Subscribe to custom behavior changes
    stateManager.subscribe('customBehavior', (behavior) => {
        if (behavior) {
            copilot.setContext({
                elementId: 'codeEditor',
                elementName: 'Behavior Editor',
                description: `Editing custom behavior: ${behavior.name}`
            });
        }
    });
}