// ui.ts
export function setupToggleAgentDetails() {
    const button = document.getElementById('toggleAgentDetails');
    const agentDetails = document.getElementById('agentDetails');

    if (button) {
        button.addEventListener('click', function() {
            if (agentDetails && agentDetails.style.display === 'none') {
                agentDetails.style.display = 'block';
                button.textContent = 'Hide Agent Details';
            } else if (agentDetails) {
                agentDetails.style.display = 'none';
                button.textContent = 'Show Agent Details';
            }
        }
        );
    }
}

export function setupToggleCodeEditor() {
    const button = document.getElementById('toggleCodeEditor');
    const codeEditor = document.getElementById('codeEditor');

    if (button) {
        button.addEventListener('click', function() {
            if (codeEditor && codeEditor.style.display === 'none') {
                codeEditor.style.display = 'block';
                button.textContent = 'Hide Code Editor';
            } else if (codeEditor) {
                codeEditor.style.display = 'none';
                button.textContent = 'Show Code Editor';
            }
        }
        );
    }
}

export function setupToggleGameConfigButton() {
    const button = document.getElementById('toggleGameConfigButton');
    const gameConfig = document.getElementById('gameConfig');

    if (button) {
        button.addEventListener('click', function() {
            if (gameConfig && gameConfig.style.display === 'none') {
                gameConfig.style.display = 'block';
                button.textContent = 'Hide Game Config';
            } else if (gameConfig) {
                gameConfig.style.display = 'none';
                button.textContent = 'Show Game Config';
            }
        }
        );
    }
}