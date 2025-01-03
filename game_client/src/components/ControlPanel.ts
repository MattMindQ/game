export function createControlPanel() {
    const container = document.createElement('div');
    container.id = 'controlPanel';
    container.classList.add('w-1/3', 'space-y-4');

    container.innerHTML = `
        <div id="gameControls" class="bg-gray-800 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-lg font-bold text-white">Game Controls</h2>
                <div class="copilot-container"></div>
            </div>
            <div class="flex gap-2 mb-4">
                <button id="toggleGameButton" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex-1">Start</button>
                <button id="resetButton" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex-1">Reset</button>
            </div>
            <div class="flex gap-2">
                <button id="addRedAgent" class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded flex-1">
                    Add Red <span id="redAgentCount" class="ml-2 bg-red-800 px-2 rounded">0</span>
                </button>
                <button id="addBlueAgent" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex-1">
                    Add Blue <span id="blueAgentCount" class="ml-2 bg-blue-800 px-2 rounded">0</span>
                </button>
            </div>
        </div>
    `;
    return container;
}
