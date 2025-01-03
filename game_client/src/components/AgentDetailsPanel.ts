export function createAgentDetailsPanel() {
    const container = document.createElement('div');
    container.id = 'agentDetailsPanel';
    container.classList.add('bg-gray-800', 'rounded-lg', 'p-4');

    container.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold text-white">Agent Details</h2>
            <div class="copilot-container"></div>
        </div>
        <button id="toggleAgentDetails" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded mb-3">
            Show Agent Details
        </button>
        <div id="agentDetails" class="space-y-3"></div>
    `;
    return container;
}
