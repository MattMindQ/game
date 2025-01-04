// src/editor/setup.ts
import { DEFAULT_BEHAVIOR_CODE } from './constants';

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
