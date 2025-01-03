// src/editor/setup.ts
import { DEFAULT_BEHAVIOR_CODE } from '../main';

export async function setupMonacoEditor() {
    try {
        // Wait for Monaco to be available
        await new Promise(resolve => {
            if (window.monaco) {
                resolve(true);
            } else {
                window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' } });
                window.require(['vs/editor/editor.main'], resolve);
            }
        });

        // Create editor
        const editor = monaco.editor.create(document.getElementById('codeEditor')!, {
            value: DEFAULT_BEHAVIOR_CODE,
            language: 'python',
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 4,
            insertSpaces: true,
            folding: true,
            renderLineHighlight: 'line',
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false
            }
        });

        return editor;
    } catch (error) {
        console.error('Failed to setup Monaco editor:', error);
        throw error;
    }
}
export const DEFAULT_BEHAVIOR_CODE = `# Agent behavior function
def update(agent, nearby_agents):
    """
    Custom behavior update function.
    
    Parameters:
    - agent: Current agent state containing:
        - position: {x, y}
        - team: 'red' or 'blue'
        - health: current health value
        - target_id: ID of current target if any
    - nearby_agents: List of nearby agents with same properties
    
    Returns:
    - dict: Behavior weights between 0 and 1
    """
    # Example: Aggressive behavior
    weights = {
        'cohesion': 0.3,    # Stay somewhat close to teammates
        'alignment': 0.4,    # Follow team movement
        'separation': 0.8,   # Keep distance when too close
        'wander': 0.2,      # Low random movement
        'avoidWalls': 0.9,  # Strong wall avoidance
        'pursue': 0.9,      # High pursuit of enemies
        'flee': 0.3         # Low fleeing tendency
    }
    
    # Adjust weights based on health
    if agent['health'] < 30:
        weights['flee'] = 0.9       # Flee when health is low
        weights['pursue'] = 0.1     # Stop pursuing
        weights['cohesion'] = 0.9   # Stay close to team
    
    return weights
`;