// src/services/ConfigUIRenderer.ts

import { ConfigParameterMetadata, CONFIG_SCHEMA, GameConfig } from '../types/config';

export class ConfigUIRenderer {
  private configManager: any;
  private container: HTMLElement;

  constructor(containerId: string, configManager: any) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    
    this.container = container;
    this.configManager = configManager;
  }

  public render(): void {
    // Clear existing content
    this.container.innerHTML = '';

    // Group parameters by category
    const groupedParams = this.groupParametersByCategory();

    // Create sections for each category
    for (const [category, params] of Object.entries(groupedParams)) {
      this.createCategorySection(category, params);
    }
  }

  private groupParametersByCategory(): Record<string, ConfigParameterMetadata[]> {
    return CONFIG_SCHEMA.reduce((acc, param) => {
      if (!acc[param.category]) {
        acc[param.category] = [];
      }
      acc[param.category].push(param);
      return acc;
    }, {} as Record<string, ConfigParameterMetadata[]>);
  }

  private createCategorySection(category: string, params: ConfigParameterMetadata[]): void {
    const section = document.createElement('div');
    section.className = 'border-b border-gray-700 pb-4 mb-4';

    // Add category title
    const title = document.createElement('h3');
    title.className = 'text-white font-medium mb-3';
    title.textContent = this.formatCategoryName(category);
    section.appendChild(title);

    // Create parameter grid
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-4';

    // Add parameters
    params.forEach(param => {
      const inputContainer = this.createParameterInput(param);
      grid.appendChild(inputContainer);
    });

    section.appendChild(grid);
    this.container.appendChild(section);
  }

  private createParameterInput(param: ConfigParameterMetadata): HTMLElement {
    const container = document.createElement('div');
    container.className = param.type === 'boolean' ? 'col-span-2' : '';

    if (param.type === 'boolean') {
      container.appendChild(this.createCheckboxInput(param));
    } else {
      container.appendChild(this.createNumberInput(param));
    }

    return container;
  }

  private createNumberInput(param: ConfigParameterMetadata): HTMLElement {
    const label = document.createElement('label');
    label.className = 'flex flex-col text-gray-300';

    const span = document.createElement('span');
    span.className = 'mb-1';
    span.textContent = param.label;

    const input = document.createElement('input');
    input.type = param.type === 'range' ? 'range' : 'number';
    input.className = 'bg-gray-700 text-white px-3 py-2 rounded';
    input.id = param.key;
    
    if (param.min !== undefined) input.min = param.min.toString();
    if (param.max !== undefined) input.max = param.max.toString();
    if (param.step !== undefined) input.step = param.step.toString();

    const config = this.configManager.getActiveConfig();
    if (config) {
      input.value = config.parameters[param.key].toString();
    }

    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const value = param.type === 'number' ? Number(target.value) : target.value;
      this.configManager.updateConfigParameter(param.key, value);
    });

    label.appendChild(span);
    label.appendChild(input);

    return label;
  }

  private createCheckboxInput(param: ConfigParameterMetadata): HTMLElement {
    const label = document.createElement('label');
    label.className = 'flex items-center text-gray-300';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'mr-2';
    input.id = param.key;

    const config = this.configManager.getActiveConfig();
    if (config) {
      input.checked = config.parameters[param.key] as boolean;
    }

    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.configManager.updateConfigParameter(param.key, target.checked);
    });

    const span = document.createElement('span');
    span.textContent = param.label;

    label.appendChild(input);
    label.appendChild(span);

    return label;
  }

  private formatCategoryName(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1) + ' Settings';
  }

  public update(): void {
    const config = this.configManager.getActiveConfig();
    if (!config) return;

    // Update all input values
    CONFIG_SCHEMA.forEach(param => {
      const input = document.getElementById(param.key) as HTMLInputElement;
      if (!input) return;

      if (param.type === 'boolean') {
        input.checked = config.parameters[param.key] as boolean;
      } else {
        input.value = config.parameters[param.key].toString();
      }
    });
  }
}