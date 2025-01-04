// src/utils/templateLoader.ts
export class TemplateLoader {
    static async loadPartials(): Promise<void> {
        const partials = document.querySelectorAll('[data-partial]');
        
        const loadPromises = Array.from(partials).map(async partial => {
            const partialName = partial.getAttribute('data-partial');
            try {
                const response = await fetch(`/src/templates/partials/${partialName}.html`);
                const html = await response.text();
                partial.innerHTML = html;
            } catch (error) {
                console.error(`Failed to load partial: ${partialName}`, error);
                throw error; // Rethrow to handle in the main initialization
            }
        });

        await Promise.all(loadPromises);
    }
}