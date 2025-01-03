// src/ui/copilot/Copilot.ts

import { GameConnection } from '../../network/socket';

interface CopilotMessage {
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    conversationId: string;
}

interface CopilotContext {
    elementId: string;
    elementName: string;
    description: string;
}

interface ConversationHistory {
    id: string;
    context: CopilotContext | null;
    messages: CopilotMessage[];
    timestamp: Date;
}

export class Copilot {
    private container: HTMLElement;
    private window: HTMLElement | null = null;
    private minimizedIcon: HTMLElement | null = null;
    private chatArea: HTMLElement | null = null;
    private input: HTMLInputElement | null = null;
    private currentContext: CopilotContext | null = null;
    private messages: CopilotMessage[] = [];
    private socket: GameConnection;
    private conversationId: string;
    private editor: any | null = null;
    private isExpanded: boolean = false;
    private editorContainer: HTMLElement | null = null;
    private history: ConversationHistory[] = [];
    private historyVisible: boolean = false;

    constructor(containerId: string, socket: GameConnection) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error(`Container ${containerId} not found`);
        this.container = container;
        this.socket = socket;
        this.conversationId = crypto.randomUUID();
        
        this.initialize();
        this.setupLLMEventListeners();
        this.loadHistory();
    }

    private initialize(): void {
        this.createMainWindow();
        this.createMinimizedIcon();
        this.attachEventListeners();
        this.hide(); // Start hidden
    }

    private createMinimizedIcon(): void {
        this.minimizedIcon = document.createElement('div');
        this.minimizedIcon.className = 'fixed bottom-4 right-4 bg-gray-800 rounded-full p-3 shadow-lg cursor-pointer hover:bg-gray-700 transition-colors z-50';
        this.minimizedIcon.innerHTML = '<i class="fas fa-robot text-blue-400"></i>';
        this.container.appendChild(this.minimizedIcon);
    }

    private createMainWindow() {
        this.window = document.createElement('div');
        this.window.className = 'fixed bottom-4 right-4 w-96 bg-gray-800 rounded-lg shadow-xl transition-all duration-300 flex flex-col max-h-[calc(100vh-2rem)]';
        this.window.innerHTML = `
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900 rounded-t-lg">
                <div class="flex items-center gap-2">
                    <i class="fas fa-robot text-blue-400"></i>
                    <h3 class="text-white font-medium">Game Copilot</h3>
                </div>
                <div class="flex items-center gap-3">
                    <button class="text-gray-400 hover:text-white" id="historyButton" title="View History">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="text-gray-400 hover:text-white" id="resetButton" title="Reset Conversation">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="text-gray-400 hover:text-white" id="expandCopilot" title="Expand">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="text-gray-400 hover:text-white" id="minimizeCopilot" title="Minimize">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="text-gray-400 hover:text-white" id="closeCopilot" title="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="flex flex-1 min-h-0"> <!-- min-h-0 is crucial for nested flex containers -->
                <!-- History Sidebar (hidden by default) -->
                <div id="historySidebar" class="hidden w-64 border-r border-gray-700 bg-gray-900 flex flex-col">
                    <div class="p-3 border-b border-gray-700">
                        <h4 class="text-white font-medium">Conversation History</h4>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2 space-y-2" id="historyList">
                        <!-- History items will be inserted here -->
                    </div>
                </div>

                <!-- Main Chat and Editor Container -->
                <div class="flex-1 flex min-h-0">
                    <!-- Chat Container -->
                    <div class="flex-1 flex flex-col min-h-0">
                        <!-- Context Area -->
                        <div class="px-4 py-2 bg-gray-900 border-b border-gray-700">
                            <div class="text-xs text-gray-400">
                                Currently helping with: <span id="copilotContext" class="text-blue-400">None</span>
                            </div>
                        </div>

                        <!-- Chat Area -->
                        <div class="flex-1 overflow-y-auto p-4 space-y-4" id="copilotChatArea"></div>

                        <!-- Input Area -->
                        <div class="p-4 border-t border-gray-700 bg-gray-900">
                            <div class="flex gap-2">
                                <input 
                                    type="text" 
                                    id="copilotInput"
                                    class="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ask anything about this feature..."
                                >
                                <button id="copilotSend" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Editor Container (hidden by default) -->
                    <div id="copilotEditorContainer" class="hidden border-l border-gray-700 bg-gray-900">
                        <div class="h-full w-full" id="copilotEditor"></div>
                    </div>
                </div>
            </div>
        `;

        this.container.appendChild(this.window);
        this.chatArea = this.window.querySelector('#copilotChatArea');
        this.input = this.window.querySelector('#copilotInput');
        this.editorContainer = this.window.querySelector('#copilotEditorContainer');
    }

    private toggleExpand() {
        if (!this.window || !this.editorContainer) return;

        this.isExpanded = !this.isExpanded;
        
        if (this.isExpanded) {
            this.window.className = 'fixed inset-4 bg-gray-800 rounded-lg shadow-xl flex flex-col transition-all duration-300';
            this.editorContainer.classList.remove('hidden');
            this.editorContainer.classList.add('w-1/2');
            document.getElementById('expandCopilot')?.querySelector('i')?.classList.replace('fa-expand', 'fa-compress');
        } else {
            this.window.className = 'fixed bottom-4 right-4 w-96 bg-gray-800 rounded-lg shadow-xl flex flex-col transition-all duration-300 max-h-[calc(100vh-2rem)]';
            this.editorContainer.classList.add('hidden');
            this.editorContainer.classList.remove('w-1/2');
            document.getElementById('expandCopilot')?.querySelector('i')?.classList.replace('fa-compress', 'fa-expand');
        }

        if (this.editor) {
            this.editor.layout();
        }
    }

    private toggleHistory() {
        const historySidebar = document.getElementById('historySidebar');
        if (!historySidebar) return;

        this.historyVisible = !this.historyVisible;
        if (this.historyVisible) {
            historySidebar.classList.remove('hidden');
            this.renderHistory();
        } else {
            historySidebar.classList.add('hidden');
        }
    }

    private renderHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;

        historyList.innerHTML = '';
        this.history.forEach((conversation) => {
            const item = document.createElement('div');
            item.className = 'p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors';
            item.innerHTML = `
                <div class="text-sm text-white font-medium">${conversation.context?.elementName || 'General Conversation'}</div>
                <div class="text-xs text-gray-400">${new Date(conversation.timestamp).toLocaleString()}</div>
            `;
            item.addEventListener('click', () => this.loadConversation(conversation.id));
            historyList.appendChild(item);
        });
    }


    private loadConversation(conversationId: string) {
        const conversation = this.history.find(c => c.id === conversationId);
        if (!conversation) return;

        this.messages = [...conversation.messages];
        this.currentContext = conversation.context;
        this.conversationId = conversationId;

        if (this.chatArea) {
            this.chatArea.innerHTML = '';
            this.messages.forEach(message => this.renderMessage(message));
        }

        if (this.currentContext) {
            this.setContext(this.currentContext);
        }

        this.toggleHistory();
    }

    private resetConversation() {
        this.saveToHistory();
        this.messages = [];
        this.conversationId = crypto.randomUUID();
        if (this.chatArea) {
            this.chatArea.innerHTML = '';
        }
        if (this.input) {
            this.input.value = '';
        }
    }

    private saveHistory() {
        localStorage.setItem('copilotHistory', JSON.stringify(this.history));
    }

    private loadHistory() {
        const savedHistory = localStorage.getItem('copilotHistory');
        if (savedHistory) {
            this.history = JSON.parse(savedHistory);
        }
    }    


    private saveToHistory() {
        const conversation: ConversationHistory = {
            id: this.conversationId,
            context: this.currentContext,
            messages: [...this.messages],
            timestamp: new Date()
        };

        this.history.unshift(conversation);
        // Keep only last 50 conversations
        this.history = this.history.slice(0, 50);
        this.saveHistory();
    }



    private attachEventListeners(): void {
        // Minimize button
        document.getElementById('minimizeCopilot')?.addEventListener('click', () => {
            this.minimize();
        });

        // Close button
        document.getElementById('closeCopilot')?.addEventListener('click', () => {
            this.hide();
        });

        // Expand button
        document.getElementById('expandCopilot')?.addEventListener('click', () => {
            this.toggleExpand();
        });

        // History button
        document.getElementById('historyButton')?.addEventListener('click', () => {
            this.toggleHistory();
        });

        // Reset button
        document.getElementById('resetButton')?.addEventListener('click', () => {
            this.resetConversation();
        });

        // Minimized icon click
        this.minimizedIcon?.addEventListener('click', () => {
            this.show();
        });

        // Send button
        document.getElementById('copilotSend')?.addEventListener('click', () => {
            this.sendMessage();
        });

        // Input enter key
        this.input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }


    private async sendMessage(): Promise<void> {
        if (!this.input?.value.trim()) return;

        const message: CopilotMessage = {
            type: 'user',
            content: this.input.value,
            timestamp: new Date(),
            conversationId: this.conversationId
        };

        this.addMessage(message);
        this.input.value = '';

        // Send to LLM through WebSocket
        this.socket.sendLLMQuery(
            message.content,
            this.currentContext ? JSON.stringify(this.currentContext) : '',
            this.conversationId
        );
    }

    private setupLLMEventListeners(): void {
        // Listen for LLM responses
        document.addEventListener('llmResponse', ((event: CustomEvent) => {
            if (event.detail.conversationId === this.conversationId) {
                this.addMessage({
                    type: 'assistant',
                    content: event.detail.response,
                    timestamp: new Date(),
                    conversationId: this.conversationId
                });
            }
        }) as EventListener);

        // Listen for LLM errors
        document.addEventListener('llmError', ((event: CustomEvent) => {
            if (event.detail.conversationId === this.conversationId) {
                this.addMessage({
                    type: 'assistant',
                    content: `Error: ${event.detail.error}`,
                    timestamp: new Date(),
                    conversationId: this.conversationId
                });
            }
        }) as EventListener);
    }

    public setEditor(editor: any) {
        this.editor = editor;
        // Move the editor to our container
        if (this.editorContainer) {
            const editorElement = document.getElementById('copilotEditor');
            if (editorElement) {
                editor.layout();
            }
        }
    }

    private addMessage(message: CopilotMessage) {
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }

    private renderMessage(message: CopilotMessage) {
        if (!this.chatArea) return;

        const messageElement = document.createElement('div');
        messageElement.className = `flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`;
        
        const content = `
            ${message.type === 'assistant' ? '<div class="flex-shrink-0"><i class="fas fa-robot text-blue-400 mt-1"></i></div>' : ''}
            <div class="${message.type === 'user' ? 'bg-blue-600' : 'bg-gray-700'} rounded-lg p-3 text-white text-sm max-w-[80%]">
                ${message.content}
            </div>
            ${message.type === 'user' ? '<div class="flex-shrink-0"><i class="fas fa-user text-blue-400 mt-1"></i></div>' : ''}
        `;
        
        messageElement.innerHTML = content;
        this.chatArea.appendChild(messageElement);
    }

    private scrollToBottom() {
        if (this.chatArea) {
            this.chatArea.scrollTop = this.chatArea.scrollHeight;
        }
    }

    // Public methods
    public show(): void {
        if (this.window) {
            this.window.style.display = 'flex';
            if (this.editor) {
                this.editor.layout();
            }
        }
        if (this.minimizedIcon) {
            this.minimizedIcon.style.display = 'none';
        }
    }

    public hide(): void {
        if (this.window) this.window.style.display = 'none';
        if (this.minimizedIcon) this.minimizedIcon.style.display = 'none';
    }

    public minimize(): void {
        if (this.window) this.window.style.display = 'none';
        if (this.minimizedIcon) this.minimizedIcon.style.display = 'block';
    }

    public setContext(context: CopilotContext) {
        this.currentContext = context;
        const contextElement = document.getElementById('copilotContext');
        if (contextElement) {
            contextElement.textContent = context.elementName;
        }
    }

    // Method to create copilot trigger buttons
    public createTrigger(element: HTMLElement, context: CopilotContext): HTMLElement {
        const trigger = document.createElement('button');
        trigger.className = 'copilot-trigger text-blue-400 hover:text-blue-300 transition-colors';
        trigger.innerHTML = '<i class="fas fa-robot"></i>';
        
        trigger.addEventListener('click', () => {
            this.setContext(context);
            this.show();
        });

        return trigger;
    }
}