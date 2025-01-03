// src/ui/toggles.ts

interface ToggleConfig {
    buttonId: string;
    targetId: string;
    showText: string;
    hideText: string;
}

// Configuration for all toggleable UI elements
const toggleConfigs: ToggleConfig[] = [
    {
        buttonId: 'toggleAgentDetails',
        targetId: 'agentDetails',
        showText: 'Show Agent Details',
        hideText: 'Hide Agent Details'
    },
    {
        buttonId: 'toggleCodeEditor',
        targetId: 'codeEditor',
        showText: 'Show Code Editor',
        hideText: 'Hide Code Editor'
    },
    {
        buttonId: 'toggleGameConfigButton',
        targetId: 'gameConfig',
        showText: 'Show Game Config',
        hideText: 'Hide Game Config'
    }
];

function setupToggle(config: ToggleConfig) {
    const button = document.getElementById(config.buttonId);
    const target = document.getElementById(config.targetId);

    if (button && target) {
        // Set initial state
        const initiallyHidden = target.style.display === 'none';
        button.textContent = initiallyHidden ? config.showText : config.hideText;

        button.addEventListener('click', () => {
            const isHidden = target.style.display === 'none';
            target.style.display = isHidden ? 'block' : 'none';
            button.textContent = isHidden ? config.hideText : config.showText;
        });
    }
}

export function setupUIToggles() {
    toggleConfigs.forEach(setupToggle);
}

// Function to add new toggle buttons dynamically
export function addToggleButton(config: ToggleConfig) {
    toggleConfigs.push(config);
    setupToggle(config);
}

// Function to remove a toggle button
export function removeToggleButton(buttonId: string) {
    const index = toggleConfigs.findIndex(config => config.buttonId === buttonId);
    if (index !== -1) {
        toggleConfigs.splice(index, 1);
    }
}

// Function to update toggle button configuration
export function updateToggleConfig(buttonId: string, updates: Partial<ToggleConfig>) {
    const config = toggleConfigs.find(config => config.buttonId === buttonId);
    if (config) {
        Object.assign(config, updates);
        setupToggle(config);
    }
}