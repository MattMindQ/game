export function createDebugInfo() {
    const container = document.createElement('div');
    container.id = 'debugInfo';
    container.classList.add('bg-gray-800', 'rounded-lg', 'p-4');

    container.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold text-white">Debug</h2>
            <div class="copilot-container"></div>
        </div>
        <div class="space-y-2">
            <div class="bg-gray-700 rounded p-2">
                <p class="text-sm text-gray-400">Selected Agent:</p>
                <p id="selectedAgent" class="text-white font-mono text-sm">None</p>
            </div>
            <div class="bg-gray-700 rounded p-2">
                <p class="text-sm text-gray-400">Mouse Position:</p>
                <p id="mousePosition" class="text-white font-mono text-sm">x: 0, y: 0</p>
            </div>
        </div>
    `;
    return container;
}
