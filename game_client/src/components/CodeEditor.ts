export function createCodeEditor() {
    const container = document.createElement('div');
    container.id = 'codeEditorContainer';
    container.classList.add('bg-gray-800', 'rounded-lg', 'shadow-xl', 'overflow-hidden', 'mt-4');

    container.innerHTML = `
        <div class="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 class="text-xl font-bold text-white">Custom Behavior</h2>
            <div class="flex items-center gap-3">
                <div class="copilot-container"></div>
                <button id="toggleCodeEditor" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">Show Editor</button>
                <button id="applyCode" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Apply Changes</button>
            </div>
        </div>
        <div id="codeEditor" class="h-64"></div>
    `;
    return container;
}
