export function createBehaviorListPanel() {
    const container = document.createElement('div');
    container.id = 'behaviorListPanel';
    container.classList.add('bg-gray-800', 'rounded-lg', 'p-4');

    container.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold text-white">Behavior List</h2>
            <div class="copilot-container"></div>
        </div>
        <div id="behaviorList" class="space-y-3"></div>
    `;
    return container;
}
