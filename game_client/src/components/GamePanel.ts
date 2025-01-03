
export function createGamePanel() {
    const container = document.createElement('div');
    container.id = 'gamePanel';
    container.classList.add('w-2/3');

    container.innerHTML = `
        <div class="mb-4 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold text-white">Game Simulation</h1>
                <div class="copilot-container"></div>
            </div>
            <span class="text-gray-400">
                Status: <span id="connectionStatus" class="text-yellow-500">Connecting...</span>
            </span>
        </div>
        <div class="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <canvas id="gameCanvas" class="block w-full bg-gray-700"></canvas>
        </div>
    `;
    return container;
}
