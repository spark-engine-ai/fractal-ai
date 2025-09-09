class FractalEngineUI {
    constructor() {
        this.sessionId = null;
        this.currentTree = null;
        this.isProcessing = false;
        this.functions = new Map(); // Store configured functions
        this.functionsEnabled = false;
        this.currentProject = null; // Current loaded project
        this.currentChat = null; // Current active chat within project
        this.projects = []; // Available projects
        this.chats = []; // Chats within current project
        this.messages = []; // Store current chat messages
        this.sessions = new Map(); // Store multiple chat sessions per project
        this.chatExecutionLogs = new Map(); // Store execution logs per chat
        this.chatStreamLogs = new Map(); // Store streaming terminal logs per chat
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateAgentCount();
        this.updateModifierPreview();
        this.loadSavedFunctions();
        
        // Show startup modal first  
        console.log('About to show startup modal...');
        setTimeout(() => {
            this.showStartupModal();
        }, 100); // Small delay to ensure DOM is ready
        
        // Using custom markdown parser
    }

    initializeElements() {
        console.log('Initializing elements...'); // Debug log
        console.log('JavaScript updated - version 1.8 - IMPROVED SESSION RECREATION'); // Cache check
        this.elements = {
            goalInput: document.getElementById('goalInput'),
            newSessionBtn: document.getElementById('newSessionBtn'), // Keep for backward compatibility
            depthSlider: document.getElementById('depthSlider'),
            lengthSlider: document.getElementById('lengthSlider'),
            depthValue: document.getElementById('depthValue'),
            lengthValue: document.getElementById('lengthValue'),
            agentCount: document.getElementById('agentCount'),
            statusDisplay: document.getElementById('statusDisplay'),
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            webSearchBtn: document.getElementById('webSearchBtn'),
            clearChatBtn: document.getElementById('clearChatBtn'),
            nodeTabBtn: document.getElementById('nodeTabBtn'),
            chatView: document.getElementById('chatView'),
            nodeView: document.getElementById('nodeView'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            nodeCanvas: document.getElementById('nodeCanvas'),
            chatTabBtn: document.getElementById('chatTabBtn'),
            consoleTabBtn: document.getElementById('consoleTabBtn'),
            functionsTabBtn: document.getElementById('functionsTabBtn'),
            consoleView: document.getElementById('consoleView'),
            functionsView: document.getElementById('functionsView'),
            consoleContent: document.getElementById('consoleContent'),
            clearConsoleBtn: document.getElementById('clearConsoleBtn'),
            consoleStreamView: document.getElementById('consoleStreamView'),
            consoleExecView: document.getElementById('consoleExecView'),
            consoleToggleStream: document.getElementById('consoleToggleStream'),
            consoleToggleExec: document.getElementById('consoleToggleExec'),
            consoleToggleStream2: document.getElementById('consoleToggleStream2'),
            consoleToggleExec2: document.getElementById('consoleToggleExec2'),
            terminalStream: document.getElementById('terminalStream'),
            terminalOutputArea: document.getElementById('terminalOutputArea'),
            terminalInput: document.getElementById('terminalInput'),
            functionsEnabled: document.getElementById('functionsEnabled'),
            functionsList: document.getElementById('functionsList'),
            addFunctionBtn: document.getElementById('addFunctionBtn'),
            exportFunctionsBtn: document.getElementById('exportFunctionsBtn'),
            importFunctionsBtn: document.getElementById('importFunctionsBtn'),
            importFunctionsFile: document.getElementById('importFunctionsFile'),
            sidebarFunctionsEnabled: document.getElementById('sidebarFunctionsEnabled'),
            functionsCount: document.getElementById('functionsCount'),
            functionsStatusIndicator: document.getElementById('functionsStatusIndicator'),
            functionsStatusText: document.getElementById('functionsStatusText'),
            functionsCountDisplay: document.getElementById('functionsCountDisplay'),
            manageFunctionsBtn: document.getElementById('manageFunctionsBtn'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            exportProjectBtn: document.getElementById('exportProjectBtn'),
            importProjectBtn: document.getElementById('importProjectBtn'),
            importProjectFile: document.getElementById('importProjectFile'),
            decompileProject: document.getElementById('decompileProject'),
            // Startup Modal elements
            startupModal: document.getElementById('startupModal'),
            mainApp: document.getElementById('mainApp'),
            newProjectName: document.getElementById('newProjectName'),
            newProjectGoal: document.getElementById('newProjectGoal'),
            createNewProjectBtn: document.getElementById('createNewProjectBtn'),
            existingProjectsList: document.getElementById('existingProjectsList'),
            importProjectBtnStartup: document.getElementById('importProjectBtnStartup'),
            importProjectFileStartup: document.getElementById('importProjectFileStartup'),
            decompileProjectStartup: document.getElementById('decompileProjectStartup'),
            // File menu elements
            fileMenuBtn: document.getElementById('fileMenuBtn'),
            fileMenuDropdown: document.getElementById('fileMenuDropdown'),
            newProjectMenuBtn: document.getElementById('newProjectMenuBtn'),
            saveProjectMenuBtn: document.getElementById('saveProjectMenuBtn'),
            exportProjectMenuBtn: document.getElementById('exportProjectMenuBtn'),
            importProjectMenuBtn: document.getElementById('importProjectMenuBtn'),
            importProjectFileMenu: document.getElementById('importProjectFileMenu'),
            // Current project title
            currentProjectTitle: document.getElementById('currentProjectTitle'),
            // Chat management
            chatsList: document.getElementById('chatsList'),
            newChatBtn: document.getElementById('newChatBtn'),
            // Quantum settings elements
            quantumEnabled: document.getElementById('quantumEnabled'),
            quantumSlider: document.getElementById('quantumSlider'),
            quantumValue: document.getElementById('quantumValue'),
            quantumSettings: document.getElementById('quantumSettings'),
            // Modifier dropdown elements
            dropdownBtn: document.getElementById('dropdownBtn'),
            dropdownMenu: document.getElementById('dropdownMenu'),
            dropdownArrow: document.getElementById('dropdownArrow'),
            selectedModifier: document.getElementById('selectedModifier'),
            modifierPreview: document.getElementById('modifierPreview'),
            // Node view elements
            nodeInfo: document.getElementById('nodeInfo'),
            nodeInfoHeader: document.getElementById('nodeInfoHeader'),
            nodeInfoContent: document.getElementById('nodeInfoContent'),
            toggleInfoBtn: document.getElementById('toggleInfoBtn'),
            // Settings menu elements
            settingsMenuBtn: document.getElementById('settingsMenuBtn'),
            settingsMenuDropdown: document.getElementById('settingsMenuDropdown'),
            preferencesMenuBtn: document.getElementById('preferencesMenuBtn'),
            aboutMenuBtn: document.getElementById('aboutMenuBtn')
        };
        
        // Debug log to check if startup modal elements exist
        console.log('Startup modal elements found:', {
            startupModal: !!this.elements.startupModal,
            createNewProjectBtn: !!this.elements.createNewProjectBtn,
            newProjectName: !!this.elements.newProjectName,
            newProjectGoal: !!this.elements.newProjectGoal
        });
    }

    setupEventListeners() {
        // Handle both old and new button IDs for compatibility
        if (this.elements.newSessionBtn) {
            this.elements.newSessionBtn.addEventListener('click', () => this.createNewChat());
        }
        if (this.elements.newChatBtn) {
            this.elements.newChatBtn.addEventListener('click', () => this.createNewChat());
        }
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.webSearchBtn.addEventListener('click', () => this.performWebSearchFromUI());
        this.elements.clearChatBtn.addEventListener('click', () => this.clearChat());
        this.elements.chatTabBtn.addEventListener('click', () => this.showTab('chat'));
        this.elements.consoleTabBtn.addEventListener('click', () => this.showTab('console'));
        this.elements.functionsTabBtn.addEventListener('click', () => this.showTab('functions'));
        this.elements.nodeTabBtn.addEventListener('click', () => this.showTab('node'));
        // Remove clearConsoleBtn listener (no longer exists)
        this.elements.consoleToggleStream.addEventListener('click', () => this.toggleConsoleView('stream'));
        this.elements.consoleToggleExec.addEventListener('click', () => this.toggleConsoleView('exec'));
        this.elements.consoleToggleStream2.addEventListener('click', () => this.toggleConsoleView('stream'));
        this.elements.consoleToggleExec2.addEventListener('click', () => this.toggleConsoleView('exec'));
        
        // Terminal input listeners
        this.elements.terminalInput.addEventListener('keydown', (e) => this.handleTerminalInput(e));
        
        // Click-to-focus for Stream tab console
        this.elements.consoleStreamView.addEventListener('click', () => {
            if (!this.elements.consoleStreamView.classList.contains('hidden') && this.elements.terminalInput) {
                this.elements.terminalInput.focus();
            }
        });
        
        // Node info toggle button
        if (this.elements.toggleInfoBtn) {
            this.elements.toggleInfoBtn.addEventListener('click', () => this.toggleInfoBox());
        }
        
        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.elements.depthSlider.addEventListener('input', (e) => {
            const newValue = parseInt(e.target.value);
            const currentValue = parseInt(this.elements.depthValue.textContent);
            const length = parseInt(this.elements.lengthSlider.value);
            
            // Check if this would exceed limit
            const newAgents = this.calculateAgents(newValue, length);
            if (newAgents > 4100 && newValue > currentValue) {
                // Prevent increasing if it would exceed limit
                e.target.value = currentValue;
                return;
            }
            
            this.elements.depthValue.textContent = e.target.value;
            this.updateAgentCount();
            this.updateModifierPreview();
            if (!this.elements.nodeView.classList.contains('hidden')) {
                this.createAgentFractal();
                this.updateDemoInfo();
            }
            // Auto-save project settings
            this.autoSaveProjectSettings();
            
            // Auto-save chat settings if we have a current chat
            this.autoSaveChatSettings();
        });

        this.elements.lengthSlider.addEventListener('input', (e) => {
            const newValue = parseInt(e.target.value);
            const currentValue = parseInt(this.elements.lengthValue.textContent);
            const depth = parseInt(this.elements.depthSlider.value);
            
            // Check if this would exceed limit
            const newAgents = this.calculateAgents(depth, newValue);
            if (newAgents > 4100 && newValue > currentValue) {
                // Prevent increasing if it would exceed limit
                e.target.value = currentValue;
                return;
            }
            
            this.elements.lengthValue.textContent = e.target.value;
            this.updateAgentCount();
            this.updateModifierPreview();
            if (!this.elements.nodeView.classList.contains('hidden')) {
                this.createAgentFractal();
                this.updateDemoInfo();
            }
            // Auto-save project settings
            this.autoSaveProjectSettings();
            
            // Auto-save chat settings if we have a current chat
            this.autoSaveChatSettings();
        });

        // Custom dropdown event listeners
        this.setupCustomDropdown();
        this.setupTooltips();
        this.setupQuantumControls();
        this.setupFunctionHandlers();
    }
    
    autoSaveProjectSettings() {
        // Debounce the save to avoid too many calls
        if (this.saveSettingsTimeout) {
            clearTimeout(this.saveSettingsTimeout);
        }
        
        this.saveSettingsTimeout = setTimeout(async () => {
            if (this.currentProject && this.currentProject.id) {
                try {
                    await this.saveCurrentProject();
                    console.log('Project settings auto-saved');
                } catch (error) {
                    console.error('Failed to auto-save project settings:', error);
                }
            }
        }, 1000); // Save 1 second after user stops changing settings
    }

    updateAgentCount() {
        const depth = parseInt(this.elements.depthSlider.value);
        const length = parseInt(this.elements.lengthSlider.value);
        const modifier = this.getCurrentModifier();
        
        const layerCounts = this.calculateModifierLayerCounts(depth, length, modifier);
        const totalAgents = layerCounts.reduce((sum, count) => sum + count, 0);
        
        this.elements.agentCount.textContent = totalAgents;
        
        // Visual indication for approaching limit
        const maxAgents = 4100;
        
        // Show warning if over 750 agents
        if (totalAgents >= 4070) {
            this.elements.agentCount.style.color = '#f59e0b'; // amber
            this.elements.agentCount.title = `Approaching limit of ${maxAgents} agents`;
        } else {
            this.elements.agentCount.style.color = '';
            this.elements.agentCount.title = '';
        }
        
        this.updateModifierPreview();
    }

    calculateAgents(depth, length) {
        const modifier = this.getCurrentModifier();
        const layerCounts = this.calculateModifierLayerCounts(depth, length, modifier);
        return layerCounts.reduce((sum, count) => sum + count, 0);
    }

    calculateModifierLayerCounts(depth, length, modifier) {
        const layerCounts = [];
        
        // Calculate children per layer (matching backend logic exactly)
        const childCounts = [];
        
        switch (modifier) {
            case 'flat':
                // Every layer has the same number of agents as the base length
                for (let layer = 0; layer < depth - 1; layer++) { // -1 because last layer has no children
                    childCounts.push(length);
                }
                childCounts.push(0); // Last layer has no children
                break;
                
            case 'subtract':
                // Starts at base length, steadily decreases to 1 (never below 1)
                for (let layer = 0; layer < depth - 1; layer++) { // -1 because last layer has no children
                    if (layer === 0) {
                        childCounts.push(length);
                    } else {
                        const childrenCount = Math.max(1, Math.round(length - ((length - 1) * layer / (depth - 2))));
                        childCounts.push(childrenCount);
                    }
                }
                childCounts.push(0); // Last layer has no children
                break;
                
            case 'add':
                // Starts small, steadily increases until final layer equals base length
                for (let layer = 0; layer < depth - 1; layer++) { // -1 because last layer has no children
                    if (layer === 0) {
                        childCounts.push(1); // Start small
                    } else {
                        const childrenCount = Math.round(1 + ((length - 1) * layer / (depth - 2)));
                        childCounts.push(childrenCount);
                    }
                }
                childCounts.push(0); // Last layer has no children
                break;
                
            case 'shrink_divided':
                // First layer = base length, each later layer = base length / layer number
                // Example: base=8, depth=6 → [8, 4, 3, 2, 2, 0] (0 for last layer)
                for (let layer = 0; layer < depth - 1; layer++) { // -1 because last layer has no children
                    if (layer === 0) {
                        childCounts.push(length);
                    } else {
                        const childrenCount = Math.max(1, Math.round(length / (layer + 1)));
                        childCounts.push(childrenCount);
                    }
                }
                childCounts.push(0); // Last layer has no children
                break;
                
            case 'grow_divided':
                // Opposite of shrink_divided: starts small, ends at base length
                // Example: base=8, depth=6 → [1, 2, 2, 3, 4, 0] (0 for last layer)
                for (let layer = 0; layer < depth - 1; layer++) { // -1 because last layer has no children
                    if (layer === depth - 2) {
                        childCounts.push(length); // Second to last layer gets base length
                    } else {
                        const reverseLayer = depth - layer - 2; // -2 to account for last layer having no children
                        const childrenCount = Math.max(1, Math.round(length / reverseLayer));
                        childCounts.push(childrenCount);
                    }
                }
                childCounts.push(0); // Last layer has no children
                break;
                
            default:
                // Fallback to flat
                for (let layer = 0; layer < depth - 1; layer++) {
                    childCounts.push(length);
                }
                childCounts.push(0);
        }
        
        // Now calculate actual layer counts based on child counts
        for (let layer = 0; layer < depth; layer++) {
            if (layer === 0) {
                layerCounts.push(1); // Root layer always has 1 node
            } else {
                const parentCount = layerCounts[layer - 1];
                const childrenPerParent = childCounts[layer - 1];
                layerCounts.push(parentCount * childrenPerParent);
            }
        }
        
        return layerCounts;
    }

    updateModifierPreview() {
        if (!this.elements.depthSlider || !this.elements.lengthSlider || !this.elements.modifierPreview) {
            return;
        }
        
        const depth = parseInt(this.elements.depthSlider.value);
        const length = parseInt(this.elements.lengthSlider.value);
        const modifier = this.getCurrentModifier();
        
        const layerCounts = this.calculateModifierLayerCounts(depth, length, modifier);
        this.elements.modifierPreview.textContent = `Pattern: [${layerCounts.join(', ')}]`;
    }

    getCurrentModifier() {
        return this.currentModifier || 'flat';
    }

    setupCustomDropdown() {
        // Check if elements exist before setting up
        if (!this.elements.dropdownBtn || !this.elements.dropdownMenu) {
            console.warn('Dropdown elements not found, skipping setup');
            return;
        }

        this.currentModifier = 'flat';
        this.isDropdownOpen = false;
        
        // Toggle dropdown
        this.elements.dropdownBtn.addEventListener('click', () => {
            this.toggleDropdown();
        });
        
        // Handle option selection
        const options = document.querySelectorAll('.dropdown-option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectModifier(option.dataset.value);
                this.closeDropdown();
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.elements.dropdownBtn.contains(e.target) && !this.elements.dropdownMenu.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }
    
    toggleDropdown() {
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    openDropdown() {
        if (!this.elements.dropdownMenu || !this.elements.dropdownArrow) return;
        this.isDropdownOpen = true;
        this.elements.dropdownMenu.classList.remove('hidden');
        this.elements.dropdownArrow.style.transform = 'rotate(180deg)';
    }
    
    closeDropdown() {
        if (!this.elements.dropdownMenu || !this.elements.dropdownArrow) return;
        this.isDropdownOpen = false;
        this.elements.dropdownMenu.classList.add('hidden');
        this.elements.dropdownArrow.style.transform = 'rotate(0deg)';
    }
    
    selectModifier(value) {
        this.currentModifier = value;
        
        const modifierData = {
            flat: { name: 'Flat', icon: this.getIconSVG('flat') },
            add: { name: 'Add', icon: this.getIconSVG('add') },
            subtract: { name: 'Subtract', icon: this.getIconSVG('subtract') },
            grow_divided: { name: 'Grow Divided', icon: this.getIconSVG('grow_divided') },
            shrink_divided: { name: 'Shrink Divided', icon: this.getIconSVG('shrink_divided') }
        };
        
        const selected = modifierData[value] || modifierData.flat;
        
        // Update button display - with null checks
        if (this.elements.dropdownBtn && this.elements.selectedModifier) {
            const svgElement = this.elements.dropdownBtn.querySelector('svg');
            if (svgElement) {
                svgElement.outerHTML = selected.icon;
            }
            this.elements.selectedModifier.textContent = selected.name;
        }
        
        // Update calculations and 3D view
        this.updateAgentCount();
        this.updateModifierPreview();
        if (!this.elements.nodeView.classList.contains('hidden')) {
            this.createAgentFractal();
            this.updateDemoInfo();
        }
        
        // Auto-save project settings
        this.autoSaveProjectSettings();
        
        // Auto-save chat settings
        this.autoSaveChatSettings();
    }
    
    getIconSVG(modifier) {
        const icons = {
            flat: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-line"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M18 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M7.5 16.5l9 -9" /></svg>',
            add: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-code-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 12h6" /><path d="M12 9v6" /><path d="M6 19a2 2 0 0 1 -2 -2v-4l-1 -1l1 -1v-4a2 2 0 0 1 2 -2" /><path d="M18 19a2 2 0 0 0 2 -2v-4l1 -1l-1 -1v-4a2 2 0 0 0 -2 -2" /></svg>',
            subtract: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-code-minus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 12h6" /><path d="M6 19a2 2 0 0 1 -2 -2v-4l-1 -1l1 -1v-4a2 2 0 0 1 2 -2" /><path d="M18 19a2 2 0 0 0 2 -2v-4l1 -1l-1 -1v-4a2 2 0 0 0 -2 -2" /></svg>',
            grow_divided: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrows-maximize"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 4l4 0l0 4" /><path d="M14 10l6 -6" /><path d="M8 20l-4 0l0 -4" /><path d="M4 20l6 -6" /><path d="M16 20l4 0l0 -4" /><path d="M14 14l6 6" /><path d="M8 4l-4 0l0 4" /><path d="M4 4l6 6" /></svg>',
            shrink_divided: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrows-minimize"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 9l4 0l0 -4" /><path d="M3 3l6 6" /><path d="M5 15l4 0l0 4" /><path d="M3 21l6 -6" /><path d="M19 9l-4 0l0 -4" /><path d="M15 9l6 -6" /><path d="M19 15l-4 0l0 4" /><path d="M15 15l6 6" /></svg>'
        };
        return icons[modifier] || icons.flat;
    }
    
    setupTooltips() {
        const infoIcons = document.querySelectorAll('.info-icon');
        
        infoIcons.forEach(icon => {
            const container = icon.parentElement;
            const tooltip = container.querySelector('.tooltip-popup');
            let hoverTimeout;
            
            icon.addEventListener('mouseenter', () => {
                hoverTimeout = setTimeout(() => {
                    tooltip.classList.remove('hidden');
                }, 1500); // 1.5 second delay
            });
            
            icon.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimeout);
                tooltip.classList.add('hidden');
            });
        });
    }

    setupQuantumControls() {
        // Check if quantum elements exist before setting up
        if (!this.elements.quantumEnabled || !this.elements.quantumSlider || !this.elements.quantumValue) {
            console.warn('Quantum control elements not found, skipping setup');
            return;
        }

        // Initialize quantum state
        this.quantumEnabled = false;
        this.quantumExecutions = 3;
        
        // Set up quantum enable/disable checkbox
        this.elements.quantumEnabled.addEventListener('change', (e) => {
            this.quantumEnabled = e.target.checked;
            this.updateQuantumSettings();
            this.autoSaveProjectSettings();
            this.autoSaveChatSettings();
        });
        
        // Set up quantum executions slider
        this.elements.quantumSlider.addEventListener('input', (e) => {
            this.quantumExecutions = parseInt(e.target.value);
            this.elements.quantumValue.textContent = this.quantumExecutions;
            this.autoSaveProjectSettings();
            this.autoSaveChatSettings();
        });
        
        // Initialize disabled state
        this.updateQuantumSettings();
    }
    
    updateQuantumSettings() {
        // Check if elements exist before updating
        if (!this.elements.quantumSlider) {
            console.warn('Quantum slider not found, skipping update');
            return;
        }

        const isEnabled = this.quantumEnabled;
        
        // Update slider enabled/disabled state
        this.elements.quantumSlider.disabled = !isEnabled;
        
        // Update visual styling for disabled state - only target the settings container, not the checkbox
        const quantumSettingsContainer = document.getElementById('quantumSettings');
        if (quantumSettingsContainer) {
            if (isEnabled) {
                quantumSettingsContainer.classList.remove('opacity-50');
                this.elements.quantumSlider.classList.remove('cursor-not-allowed');
                quantumSettingsContainer.style.pointerEvents = 'auto';
            } else {
                quantumSettingsContainer.classList.add('opacity-50');
                this.elements.quantumSlider.classList.add('cursor-not-allowed');
                quantumSettingsContainer.style.pointerEvents = 'none';
            }
        }
    }

    async createNewChat() {
        if (!this.currentProject) {
            alert('Please load or create a project first');
            return;
        }

        try {
            console.log('createNewChat called'); // Debug
            const goal = this.elements.goalInput.value || 'General AI assistance';
            console.log('Chat goal:', goal); // Debug
            this.updateStatus('Creating new chat...');
            
            console.log('Sending request to /api/chats'); // Debug
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: `Chat - ${goal}`,
                    goal: goal,
                    projectId: this.currentProject.id
                })
            });
            
            console.log('Chat response status:', response.status); // Debug
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Chat creation error:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Chat data received:', data); // Debug
            
            // Set current chat
            this.currentChat = {
                id: data.chatId || data.id,
                goal: goal,
                createdAt: data.createdAt || new Date().toISOString()
            };
            
            this.sessionId = data.sessionId;
            this.messages = []; // Clear messages for new chat
            this.updateStatus(`New chat created with goal: ${goal}`);
            
            // Add chat to local list
            this.chats.push(this.currentChat);
            
            // Update UI
            this.hideWelcomeScreen();
            this.elements.chatMessages.innerHTML = ''; // Clear any existing content
            this.elements.goalInput.value = ''; // Clear input
            this.renderChatsList(); // Refresh chat list
            this.addMessage('system', `New chat started with goal: "${goal}"`);
            
        } catch (error) {
            this.updateStatus('Error creating chat');
            console.error('Chat creation error:', error);
        }
    }

    // Create a session for the current chat (used when auto-creating sessions for message sending)
    async createSessionForCurrentChat() {
        if (!this.currentChat) {
            console.error('Cannot create session: no current chat');
            return false;
        }

        try {
            console.log('Creating session for current chat:', this.currentChat.id); // Debug
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    goal: this.currentChat.goal || 'General AI assistance'
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Session creation error:', errorText);
                return false;
            }
            
            const data = await response.json();
            console.log('Session created for chat:', data); // Debug
            this.sessionId = data.sessionId;
            
            // Update the chat's sessionId in the database
            console.log('Updating chat with new sessionId'); // Debug
            try {
                const updatePayload = {
                    id: this.currentChat.id,
                    goal: this.currentChat.goal,
                    createdAt: this.currentChat.createdAt,
                    sessionId: data.sessionId,
                    messages: this.messages || [],
                    consoleLogs: this.chatExecutionLogs.has(this.currentChat.id) ? this.chatExecutionLogs.get(this.currentChat.id) : [],
                    streamLogs: this.chatStreamLogs.has(this.currentChat.id) ? this.chatStreamLogs.get(this.currentChat.id) : []
                };
                
                const updateResponse = await fetch(`/api/chats/${this.currentChat.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatePayload)
                });
                
                if (updateResponse.ok) {
                    console.log('Chat updated with new sessionId successfully'); // Debug
                } else {
                    const errorText = await updateResponse.text();
                    console.error('Failed to update chat with new sessionId:', errorText);
                }
            } catch (updateError) {
                console.error('Error updating chat:', updateError);
                // Continue anyway, as the session was created successfully
            }
            
            return true;
            
        } catch (error) {
            console.error('Failed to create session for chat:', error);
            return false;
        }
    }

    // Keep backward compatibility (for UI buttons)
    async createNewSession() {
        return this.createNewChat();
    }

    async sendMessage(isRetry = false) {
        console.log('sendMessage called, isRetry:', isRetry); // Debug
        console.log('Current sessionId before send:', this.sessionId); // Debug
        if (this.isProcessing) return;

        const message = this.elements.chatInput.value.trim();
        console.log('Message to send:', message); // Debug
        if (!message) return;

        // Always create a fresh session for each message to avoid stale session issues
        console.log('Creating fresh session for message...'); // Debug
        const sessionCreated = await this.createSessionForCurrentChat();
        if (!sessionCreated || !this.sessionId) {
            this.addMessage('system', 'Failed to create session. Please create a new chat first.');
            return;
        }

        // Hide welcome screen when sending first message
        this.hideWelcomeScreen();

        this.elements.chatInput.value = '';
        this.addMessage('user', message);
        
        this.isProcessing = true;
        
        // Start with a simple loading message (temporary, won't be saved)
        const tempMessage = this.addTemporaryMessage('agent', 'Processing...');

        try {
            const depth = parseInt(this.elements.depthSlider.value);
            const length = parseInt(this.elements.lengthSlider.value);
            const apiKey = this.elements.apiKeyInput.value.trim() || null;

            // Show execution stats (if elements exist)
            const totalPossible = this.calculateAgents(depth, length);
            if (this.elements.totalCount) {
                this.elements.totalCount.textContent = totalPossible;
            }
            if (this.elements.executedCount) {
                this.elements.executedCount.textContent = '0';
            }
            if (this.elements.executionStats) {
                this.elements.executionStats.classList.remove('hidden');
            }

            const modifier = this.getCurrentModifier();
            const quantumEnabled = this.quantumEnabled;
            const quantumExecutions = this.quantumExecutions;
            
            // Add terminal log for query start
            this.addTerminalLog(`Processing query: "${message}"`, 'system');
            this.addTerminalLog(`Session ID: ${this.sessionId}`, 'info');
            this.addTerminalLog('Initializing fractal engine...', 'info');
            
            // Start SSE connection for live updates
            this.startAgentStreaming();
            
            console.log('Sending query with sessionId:', this.sessionId); // Debug
            const forceFullDelegation = document.getElementById('forceDelegationCheckbox')?.checked || false;
            
            console.log('Query payload:', {
                sessionId: this.sessionId,
                query: message,
                maxDepth: depth,
                maxBranching: length,
                modifier,
                forceFullDelegation,
                quantumEnabled,
                quantumExecutions
            }); // Debug
            
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    query: message,
                    maxDepth: depth,
                    maxBranching: length,
                    modifier,
                    forceFullDelegation,
                    quantumEnabled,
                    quantumExecutions,
                    apiKey
                })
            });

            const data = await response.json();
            console.log('Query response:', response.status, data); // Debug
            
            if (response.ok) {
                this.currentTree = data.tree;
                
                // Add streaming logs based on execution type
                if (data.executionLog && data.executionLog.fractalUsed) {
                    this.addTerminalLog(`Fractal execution initiated with ${data.executionLog.agents ? data.executionLog.agents.length : 0} specialized agents`, 'success');
                    
                    // Log individual agent execution
                    if (data.executionLog.agents) {
                        data.executionLog.agents.forEach((agent, index) => {
                            const taskDescription = agent.task?.subtask || agent.task?.focus || 'Unknown task';
                            this.addTerminalLog(`Agent ${index + 1}: ${taskDescription}`, 'agent');
                            this.addTerminalLog(`└── Status: ${agent.status || 'completed'}`, 'success');
                        });
                    }
                } else {
                    this.addTerminalLog('Direct AI response (no fractal delegation)', 'info');
                }
                
                this.addTerminalLog('Query processing completed successfully', 'success');
                
                // Stop live streaming
                this.stopAgentStreaming();
                
                // Remove the temporary message
                tempMessage.remove();
                
                // Check if quantum execution was used
                if (data.quantumExecutions && data.quantumExecutions.length > 0) {
                    this.addTerminalLog(`Quantum execution with ${data.quantumExecutions.length} parallel states`, 'system');
                    // Add quantum message with accordion
                    this.addQuantumMessage('agent', data.response, data.quantumExecutions);
                } else if (data.executionLog) {
                    // If fractal was used, show the fractal processing message
                    const processingBubble = this.addProcessingMessage();
                    setTimeout(() => {
                        this.updateProcessingMessage(processingBubble, data.response);
                    }, 500); // Brief delay to show fractal processing
                } else {
                    // Direct response without fractal processing
                    this.addMessage('agent', data.response);
                }
                
                // Update execution stats (if element exists)
                if (this.elements.executedCount) {
                    this.elements.executedCount.textContent = data.executedAgents || 1;
                }
                
                this.updateStatus(`Processed: ${data.executedAgents || 1} of ${data.totalPossibleAgents || totalPossible} agents executed`);
                
                // Add to console if fractal was used
                if (data.executionLog) {
                    this.addConsoleLog(data.executionLog);
                }
                
                // Only update 3D view if it's currently visible
                if (!this.elements.nodeView.classList.contains('hidden')) {
                    this.renderNodeGraph(data.tree);
                }
            } else {
                tempMessage.remove();
                console.error('Query failed with error:', data.error); // Debug
                
                // Stop live streaming
                this.stopAgentStreaming();
                
                // Add error terminal logs
                this.addTerminalLog(`Query failed: ${data.error}`, 'error');
                
                this.addMessage('agent', `Error: ${data.error}`);
                this.updateStatus('Error processing query');
            }
        } catch (error) {
            tempMessage.remove();
            console.error('Query error:', error);
            
            // Stop live streaming
            this.stopAgentStreaming();
            
            // Add network error terminal logs
            this.addTerminalLog(`Network error: ${error.message}`, 'error');
            
            this.addMessage('agent', 'Network error occurred');
            this.updateStatus('Network error');
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-bubble bg-[rgba(0,0,0,0)] ${type}`;
                messageDiv.style = `background:rgba(0,0,0,0);`

        const header = document.createElement('div');
        header.className = `font-semibold mb-2`;
        
        switch (type) {
            case 'user':
                header.textContent = 'You';
                header.className += ' text-fractal-blue';
                break;
            case 'agent':
                header.textContent = 'Fractal Engine Response';
                header.className += ' text-fractal-green';
                break;
            case 'system':
                header.textContent = 'System';
                header.className += ' text-fractal-purple';
                break;
        }
        
        const contentDiv = document.createElement('div');
        
        // Render content with custom markdown parser
        if (typeof content === 'string') {
            contentDiv.innerHTML = this.renderMarkdown(content);
        } else {
            contentDiv.textContent = JSON.stringify(content);
        }
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(contentDiv);
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // Store message in project data (exclude system messages from being saved)
        if (type === 'user' || type === 'agent') {
            this.messages.push({
                type: type === 'agent' ? 'assistant' : type,
                content: content,
                timestamp: new Date().toISOString()
            });
            
            // Auto-save chat when messages are added
            if (this.currentChat && this.currentChat.id) {
                console.log('Auto-saving chat after adding message'); // Debug
                this.saveCurrentChat().catch(error => {
                    console.error('Failed to auto-save chat:', error);
                });
            }
        }
        
        return messageDiv; // Return the element so it can be removed if needed
    }

    // Add temporary message that doesn't get saved to messages array
    addTemporaryMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-bubble bg-[rgba(0,0,0,0)] ${type}`;
        messageDiv.style = `background:rgba(0,0,0,0);`
        const header = document.createElement('div');
        header.className = `font-semibold mb-2`;
        
        switch (type) {
            case 'agent':
                header.textContent = 'Fractal Engine Response';
                header.className += ' text-fractal-green';
                break;
            case 'system':
                header.textContent = 'System';
                header.className += ' text-fractal-purple';
                break;
        }
        
        const contentDiv = document.createElement('div');
        
        // Render content with custom markdown parser
        if (typeof content === 'string') {
            contentDiv.innerHTML = this.renderMarkdown(content);
        } else {
            contentDiv.textContent = JSON.stringify(content);
        }
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(contentDiv);
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        return messageDiv; // Return the element so it can be removed
    }

    addQuantumMessage(type, content, quantumData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-bubble ${type}`;
        
        const header = document.createElement('div');
        header.className = `font-semibold mb-2`;
        
        switch (type) {
            case 'agent':
                header.textContent = 'Fractal Engine Response (Quantum States)';
                header.className += ' text-fractal-green';
                break;
            default:
                header.textContent = 'Quantum Response';
                header.className += ' text-fractal-green';
        }
        
        const contentDiv = document.createElement('div');
        
        // Render main content with custom markdown parser
        if (typeof content === 'string') {
            contentDiv.innerHTML = this.renderMarkdown(content);
        } else {
            contentDiv.textContent = JSON.stringify(content);
        }
        
        // Add quantum accordion if quantum data is provided
        if (quantumData && quantumData.length > 0) {
            const accordionDiv = this.createQuantumAccordion(quantumData);
            contentDiv.appendChild(accordionDiv);
        }
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(contentDiv);
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        // Store message in project data (same logic as addMessage)
        if (type === 'agent') {
            this.messages.push({
                type: 'assistant',
                content: content,
                timestamp: new Date().toISOString(),
                quantumData: quantumData // Include quantum data in saved message
            });
            
            // Auto-save chat when messages are added
            if (this.currentChat && this.currentChat.id) {
                console.log('Auto-saving chat after adding quantum message'); // Debug
                this.saveCurrentChat().catch(error => {
                    console.error('Failed to auto-save chat:', error);
                });
            }
        }
        
        return messageDiv;
    }

    createQuantumAccordion(quantumData) {
        const accordion = document.createElement('div');
        accordion.className = 'quantum-accordion';
        
        const header = document.createElement('div');
        header.className = 'quantum-accordion-header';
        header.innerHTML = `
            <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 12v.01" />
                    <path d="M19.071 4.929c-1.562 -1.562 -6.518 .337 -11.071 4.243c-4.554 3.906 -5.804 9.564 -4.242 11.126c1.562 1.562 6.518 -.337 11.071 -4.243c4.554 -3.906 5.804 -9.564 4.242 -11.126" />
                    <path d="M4.929 4.929c-1.562 1.562 -.337 6.518 4.243 11.071c3.906 4.554 9.564 5.804 11.126 4.242c1.562 -1.562 .337 -6.518 -4.243 -11.071c-3.906 -4.554 -9.564 -5.804 -11.126 -4.242" />
                </svg>
                <span class="text-sm font-medium">Quantum Agent Layers (${quantumData.length} executions)</span>
            </div>
            <svg class="w-4 h-4 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
        `;
        
        const content = document.createElement('div');
        content.className = 'quantum-accordion-content';
        
        // Group agents by layer across all quantum executions
        const layerMap = new Map();
        
        quantumData.forEach((execution, execIndex) => {
            if (execution.agents) {
                execution.agents.forEach(agent => {
                    if (!layerMap.has(agent.layer)) {
                        layerMap.set(agent.layer, []);
                    }
                    layerMap.get(agent.layer).push({
                        ...agent,
                        executionIndex: execIndex,
                        executionLabel: `Execution ${execIndex + 1}`
                    });
                });
            }
        });
        
        // Create layer sections
        const sortedLayers = Array.from(layerMap.keys()).sort((a, b) => a - b);
        
        sortedLayers.forEach(layer => {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'quantum-layer';
            
            const layerHeader = document.createElement('div');
            layerHeader.className = 'quantum-layer-header';
            const agentCount = layerMap.get(layer).length;
            layerHeader.innerHTML = `
                <span>Layer ${layer} (${agentCount} agents)</span>
                <svg class="w-3 h-3 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            `;
            
            const layerContent = document.createElement('div');
            layerContent.className = 'quantum-layer-content';
            
            // Add agents for this layer
            layerMap.get(layer).forEach(agent => {
                const agentDiv = document.createElement('div');
                agentDiv.className = 'quantum-agent';
                
                const agentHeader = document.createElement('div');
                agentHeader.className = 'quantum-agent-header';
                agentHeader.textContent = `${agent.executionLabel} - Agent ${agent.position}`;
                
                const agentContent = document.createElement('div');
                agentContent.className = 'quantum-agent-content';
                
                if (agent.task) {
                    agentContent.innerHTML += `<div class="mb-2"><strong>Task:</strong> ${agent.task.subtask || 'Root query'}</div>`;
                    if (agent.task.focus) {
                        agentContent.innerHTML += `<div class="mb-2"><strong>Focus:</strong> ${agent.task.focus}</div>`;
                    }
                }
                
                if (agent.response) {
                    agentContent.innerHTML += `<div><strong>Response:</strong><br>${this.renderMarkdown(agent.response)}</div>`;
                } else {
                    agentContent.innerHTML += `<div class="text-gray-500 italic">No response</div>`;
                }
                
                agentDiv.appendChild(agentHeader);
                agentDiv.appendChild(agentContent);
                layerContent.appendChild(agentDiv);
            });
            
            // Add click handler for layer toggle
            layerHeader.addEventListener('click', () => {
                layerDiv.classList.toggle('open');
                const arrow = layerHeader.querySelector('svg');
                arrow.style.transform = layerDiv.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
            
            layerDiv.appendChild(layerHeader);
            layerDiv.appendChild(layerContent);
            content.appendChild(layerDiv);
        });
        
        // Add click handler for main accordion toggle
        header.addEventListener('click', () => {
            accordion.classList.toggle('open');
            const arrow = header.querySelector('svg:last-child');
            arrow.style.transform = accordion.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
        });
        
        accordion.appendChild(header);
        accordion.appendChild(content);
        
        return accordion;
    }

    clearChat() {
        // Clear messages array
        this.messages = [];
        
        // If no session exists, show welcome screen
        if (!this.sessionId) {
            this.showWelcomeScreen();
        } else {
            // Session exists, show cleared chat message
            this.elements.chatMessages.innerHTML = `
                <div class="chat-bubble agent">
                    <div class="text-fractal-green font-semibold mb-2">Fractal Engine</div>
                    <div>Chat cleared. Ready for new conversation.</div>
                </div>
            `;
        }
    }

    showWelcomeScreen() {
        console.log('showWelcomeScreen called'); // Debug
        this.elements.chatMessages.innerHTML = `
            <div id="welcomeScreen" class="flex flex-col items-center justify-center h-full text-center">
                <div class="flex items-center align-center justify-center mb-6 gap-4">
                    <img src="./images/logo.PNG" style="transform:translateX(-7.5px)" alt="Fractal Engine Logo" width="44" height="44" class="rounded-lg shadow-lg">
                    <h1 style="font-size: 30px;" class="font-bold text-white">Fractal Engine</h1>
                </div>
                <div style="height:0.5px;opacity:0.5;background-color:white;width:20vw;margin-bottom:12px;"></div>
                <p class="text-md text-gray-300 mb-2">AI-Powered Cognitive Intelligence</p>
                <p class="text-gray-400 text-sm mb-8 max-w-md text-center w-80" style="text-align:center">Experience recursive AI reasoning through fractal agent processing. Set your parameters and create a new session to begin.</p>
            </div>
        `;
        console.log('Welcome screen HTML set'); // Debug
    }

    hideWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.remove();
        }
    }

    addProcessingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble agent';
                messageDiv.style = `background:rgba(0,0,0,0);`

        const header = document.createElement('div');
        header.className = 'font-semibold mb-2 text-fractal-green';
        header.textContent = 'Fractal Engine';
        
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="animate-spin-slow w-4 h-4 border-2 border-fractal-blue border-t-transparent rounded-full"></div>
                <span class="text-gray-400">Processing through fractal layers...</span>
            </div>
        `;
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(contentDiv);
        this.elements.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        return { messageDiv, contentDiv };
    }

    updateProcessingMessage(bubble, content, type = 'success') {
        const { contentDiv } = bubble;
        
        if (type === 'error') {
            contentDiv.innerHTML = `<div class="text-red-400">${content}</div>`;
        } else if (typeof content === 'string') {
            contentDiv.innerHTML = this.renderMarkdown(content);
        } else if (typeof content === 'string') {
            contentDiv.innerHTML = content.replace(/\n/g, '<br>');
        } else {
            contentDiv.textContent = content;
        }
        
        // Save the final AI response to messages array
        if (type === 'success' && content) {
            this.messages.push({
                type: 'assistant',
                content: content,
                timestamp: new Date().toISOString()
            });
            
            // Auto-save chat when messages are added
            if (this.currentChat && this.currentChat.id) {
                console.log('Auto-saving chat after updating processing message'); // Debug
                this.saveCurrentChat().catch(error => {
                    console.error('Failed to auto-save chat:', error);
                });
            }
        }
        
        // Scroll to bottom
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    showTab(tab) {
        // Hide all views first
        this.elements.chatView.classList.add('hidden');
        this.elements.consoleView.classList.add('hidden'); 
        this.elements.functionsView.classList.add('hidden');
        this.elements.nodeView.classList.add('hidden');
        
        // Remove all active states
        this.elements.chatTabBtn.classList.remove('active');
        this.elements.consoleTabBtn.classList.remove('active');
        this.elements.functionsTabBtn.classList.remove('active');
        this.elements.nodeTabBtn.classList.remove('active');
        
        // Stop any 3D animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Show the requested tab and update button state
        if (tab === 'chat') {
            this.elements.chatView.classList.remove('hidden');
            this.elements.chatTabBtn.classList.add('active');
            // Show welcome screen if no messages - with delay to ensure DOM is ready
            setTimeout(() => {
                if (!this.messages || this.messages.length === 0) {
                    console.log('Showing welcome screen from tab switch'); // Debug
                    this.showWelcomeScreen();
                }
            }, 50);
        } else if (tab === 'console') {
            this.elements.consoleView.classList.remove('hidden');
            this.elements.consoleTabBtn.classList.add('active');
            
            // Auto-focus the terminal input when console is shown
            setTimeout(() => {
                if (this.elements.terminalInput) {
                    this.elements.terminalInput.focus();
                }
            }, 100);
        } else if (tab === 'functions') {
            this.elements.functionsView.classList.remove('hidden');
            this.elements.functionsTabBtn.classList.add('active');
        } else if (tab === 'node') {
            this.elements.nodeView.classList.remove('hidden');
            this.elements.nodeTabBtn.classList.add('active');
            this.init3DFractal();
            if (this.currentTree) {
                this.renderNodeGraph(this.currentTree);
            } else {
                // Show demo fractal when no data is available
                this.showDemoFractal();
            }
        }
    }

    clearConsole() {
        this.elements.consoleContent.innerHTML = `
            <div class="text-gray-400 text-center py-8">
                <p>Console cleared.</p>
                <p class="text-sm mt-2">Execute a complex query to see the fractal system in action.</p>
            </div>
        `;
        // Also clear terminal stream
        if (this.elements.terminalStream) {
            this.elements.terminalStream.innerHTML = '';
        }
        // Clear streaming logs for current chat
        if (this.currentChat && this.currentChat.id && this.chatStreamLogs) {
            this.chatStreamLogs.set(this.currentChat.id, []);
            
            // Auto-save to persist cleared state
            this.saveCurrentChat().catch(error => {
                console.error('Failed to save after clearing console:', error);
            });
        }
    }

    clearStreamLogs() {
        // Clear terminal stream display
        if (this.elements.terminalStream) {
            this.elements.terminalStream.innerHTML = '';
        }
        // Clear streaming logs for current chat
        if (this.currentChat && this.currentChat.id && this.chatStreamLogs) {
            this.chatStreamLogs.set(this.currentChat.id, []);
            
            // Auto-save to persist cleared state
            this.saveCurrentChat().catch(error => {
                console.error('Failed to save after clearing stream logs:', error);
            });
        }
    }

    clearExecutionLogs() {
        // Clear execution display
        this.elements.consoleContent.innerHTML = `
            <div class="text-gray-400 text-center py-8">
                <p>Execution logs cleared.</p>
                <p class="text-sm mt-2">Execute a complex query to see the fractal system in action.</p>
            </div>
        `;
        // Clear execution logs for current chat
        if (this.currentChat && this.currentChat.id && this.chatExecutionLogs) {
            this.chatExecutionLogs.set(this.currentChat.id, []);
            
            // Auto-save to persist cleared state
            this.saveCurrentChat().catch(error => {
                console.error('Failed to save after clearing execution logs:', error);
            });
        }
    }

    toggleConsoleView(view) {
        if (view === 'stream') {
            // Show stream view, hide exec view
            this.elements.consoleStreamView.classList.remove('hidden');
            this.elements.consoleExecView.classList.add('hidden');
            
            // Update button styles for both sets
            this.elements.consoleToggleStream.classList.add('bg-green-600', 'text-white');
            this.elements.consoleToggleStream.classList.remove('bg-gray-600', 'text-gray-300');
            this.elements.consoleToggleExec.classList.remove('bg-green-600', 'text-white');
            this.elements.consoleToggleExec.classList.add('bg-gray-600', 'text-gray-300');
            
            this.elements.consoleToggleStream2.classList.add('bg-green-600', 'text-white');
            this.elements.consoleToggleStream2.classList.remove('bg-gray-600', 'text-gray-300');
            this.elements.consoleToggleExec2.classList.remove('bg-green-600', 'text-white');
            this.elements.consoleToggleExec2.classList.add('bg-gray-600', 'text-gray-300');
            
            // Focus stream input
            setTimeout(() => this.elements.terminalInput.focus(), 50);
        } else if (view === 'exec') {
            // Show exec view, hide stream view  
            this.elements.consoleExecView.classList.remove('hidden');
            this.elements.consoleStreamView.classList.add('hidden');
            
            // Update button styles for both sets
            this.elements.consoleToggleExec.classList.add('bg-green-600', 'text-white');
            this.elements.consoleToggleExec.classList.remove('bg-gray-600', 'text-gray-300');
            this.elements.consoleToggleStream.classList.remove('bg-green-600', 'text-white');
            this.elements.consoleToggleStream.classList.add('bg-gray-600', 'text-gray-300');
            
            this.elements.consoleToggleExec2.classList.add('bg-green-600', 'text-white');
            this.elements.consoleToggleExec2.classList.remove('bg-gray-600', 'text-gray-300');
            this.elements.consoleToggleStream2.classList.remove('bg-green-600', 'text-white');
            this.elements.consoleToggleStream2.classList.add('bg-gray-600', 'text-gray-300');
            
            // No input in exec view
        }
    }

    handleTerminalInput(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent line break in contenteditable
            const input = event.target;
            const command = input.textContent.trim();
            input.textContent = '';
            
            if (!command) return;
            
            // Echo the command in terminal style
            this.addTerminalLog(`$ ${command}`, 'system', false);
            
            // Parse and execute command
            this.executeTerminalCommand(command);
            
            // Keep input focused for continuous terminal usage
            setTimeout(() => input.focus(), 10);
        }
    }

    executeTerminalCommand(command) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        switch (cmd) {
            case 'help':
                this.addTerminalLog('Available commands:', 'info');
                this.addTerminalLog('  help - Show this help message', 'info');
                this.addTerminalLog('  clear - Clear console logs (stream only)', 'info');
                this.addTerminalLog('  clear -A - Clear all (console + executions)', 'info');
                this.addTerminalLog('  clear -C - Clear console logs only', 'info');
                this.addTerminalLog('  clear -E - Clear execution logs only', 'info');
                this.addTerminalLog('  stream - Switch to streaming view', 'info');
                this.addTerminalLog('  exec - Switch to execution view', 'info');
                this.addTerminalLog('  status - Show system status', 'info');
                this.addTerminalLog('  chats - List all chats in current project', 'info');
                this.addTerminalLog('  projects - List all projects', 'info');
                break;
                
            case 'clear':
                const flag = args[0];
                if (flag === '-A' || flag === '--all') {
                    // Clear all: stream logs + executions
                    this.clearStreamLogs();
                    this.clearExecutionLogs();
                    this.addTerminalLog('All console logs and executions cleared.', 'success');
                } else if (flag === '-C' || flag === '--console') {
                    // Clear console/stream logs only
                    this.clearStreamLogs();
                    this.addTerminalLog('Console logs cleared.', 'success');
                } else if (flag === '-E' || flag === '--executions') {
                    // Clear executions only
                    this.clearExecutionLogs();
                    this.addTerminalLog('Execution logs cleared.', 'success');
                } else {
                    // Default behavior - clear stream logs only
                    this.clearStreamLogs();
                    this.addTerminalLog('Console cleared.', 'success');
                }
                break;
                
            case 'stream':
                this.toggleConsoleView('stream');
                this.addTerminalLog('Switched to streaming view', 'success');
                break;
                
            case 'exec':
                this.toggleConsoleView('exec');
                this.addTerminalLog('Switched to execution view', 'success');
                break;
                
            case 'status':
                this.addTerminalLog(`Project: ${this.currentProject ? this.currentProject.name : 'None'}`, 'info');
                this.addTerminalLog(`Current Chat: ${this.currentChat ? this.currentChat.id.substring(0, 8) : 'None'}`, 'info');
                this.addTerminalLog(`Session ID: ${this.sessionId ? this.sessionId.substring(0, 8) : 'None'}`, 'info');
                this.addTerminalLog(`Messages: ${this.messages.length}`, 'info');
                break;
                
            case 'chats':
                if (this.chats && this.chats.length > 0) {
                    this.addTerminalLog(`Found ${this.chats.length} chats:`, 'info');
                    this.chats.forEach((chat, index) => {
                        const active = this.currentChat && chat.id === this.currentChat.id ? ' (active)' : '';
                        this.addTerminalLog(`  ${index + 1}. ${chat.id.substring(0, 8)}${active}`, 'info');
                    });
                } else {
                    this.addTerminalLog('No chats found in current project', 'warning');
                }
                break;
                
            case 'projects':
                if (this.projects && this.projects.length > 0) {
                    this.addTerminalLog(`Found ${this.projects.length} projects:`, 'info');
                    this.projects.forEach((project, index) => {
                        const active = this.currentProject && project.id === this.currentProject.id ? ' (active)' : '';
                        this.addTerminalLog(`  ${index + 1}. ${project.name}${active}`, 'info');
                    });
                } else {
                    this.addTerminalLog('No projects found', 'warning');
                }
                break;
                
            case 'search':
                if (args.length === 0) {
                    this.addTerminalLog('Usage: search <query> or search --deep <query>', 'error');
                    break;
                }
                
                // Check for deep search flag
                const isDeepSearch = args[0] === '--deep';
                const searchQuery = isDeepSearch ? args.slice(1).join(' ') : args.join(' ');
                
                if (!searchQuery.trim()) {
                    this.addTerminalLog('Please provide a search query', 'error');
                    break;
                }
                
                this.performWebSearch(searchQuery, isDeepSearch);
                break;
                
            default:
                this.addTerminalLog(`Unknown command: ${cmd}. Type 'help' for available commands.`, 'error');
                break;
        }
    }

    async performWebSearch(query, isDeepSearch = false) {
        this.addTerminalLog(`🔍 Searching the web: "${query}"`, 'info');
        
        if (isDeepSearch) {
            this.addTerminalLog('⚡ Using deep search mode...', 'system');
        }
        
        try {
            const searchType = isDeepSearch ? 'deep' : 'quick';
            const model = isDeepSearch ? 'gpt-5' : 'gpt-4o';
            
            const response = await fetch('/api/web-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    model: model,
                    searchType: searchType
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.addTerminalLog('✅ Web search completed', 'success');
                this.addTerminalLog(`📊 Model: ${data.model} | Type: ${data.searchType}`, 'info');
                this.addTerminalLog('📄 Results:', 'info');
                
                // Split response into lines and display with proper formatting
                const lines = data.response.split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        this.addTerminalLog(`   ${line}`, 'info', false);
                    }
                });
                
                // Store search result in chat context if available
                if (this.currentChat && this.currentChat.id) {
                    const searchResult = {
                        type: 'web_search',
                        query: query,
                        response: data.response,
                        model: data.model,
                        searchType: data.searchType,
                        timestamp: data.timestamp
                    };
                    
                    // Add to messages for context
                    this.messages.push({
                        type: 'system',
                        content: `Web search result for "${query}": ${data.response}`,
                        timestamp: data.timestamp
                    });
                    
                    // Auto-save the search context
                    this.saveCurrentChat().catch(error => {
                        console.error('Failed to save search context:', error);
                    });
                }
                
            } else {
                this.addTerminalLog(`❌ Search failed: ${data.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Web search error:', error);
            this.addTerminalLog(`❌ Search failed: ${error.message}`, 'error');
        }
    }

    async performWebSearchFromUI() {
        const query = this.elements.chatInput.value.trim();
        
        if (!query) {
            alert('Please enter a search query first');
            return;
        }

        // Add user message showing the search
        this.addMessage('user', `🔍 Web Search: ${query}`);
        
        try {
            const response = await fetch('/api/web-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    model: 'gpt-4o',
                    searchType: 'quick'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Add search results as an agent response
                this.addMessage('agent', `**🌐 Web Search Results for "${query}":**\n\n${data.response}`);
                
                // Clear the input
                this.elements.chatInput.value = '';
            } else {
                this.addMessage('agent', `❌ Search failed: ${data.error}`);
            }
            
        } catch (error) {
            console.error('Web search error:', error);
            this.addMessage('agent', `❌ Search failed: ${error.message}`);
        }
    }

    addTerminalLog(message, type = 'info', timestamp = true) {
        if (!this.elements.terminalStream) return;
        
        const time = timestamp ? new Date().toLocaleTimeString() : '';
        const typeColors = {
            'info': 'text-gray-300',
            'success': 'text-green-400',
            'warning': 'text-yellow-400', 
            'error': 'text-red-400',
            'agent': 'text-blue-400',
            'system': 'text-cyan-400'
        };
        
        const typeLabels = {
            'info': '[INFO]',
            'success': '[SUCCESS]',
            'warning': '[WARN]',
            'error': '[ERROR]',
            'agent': '[AGENT]',
            'system': '[SYSTEM]'
        };
        
        // Check for status patterns in the message and add background highlighting
        let backgroundClass = '';
        if (message.includes('[SUCCESS]')) {
            backgroundClass = 'bg-green-800 bg-opacity-30';
        } else if (message.includes('[ERROR]')) {
            backgroundClass = 'bg-red-800 bg-opacity-30';
        } else if (message.includes('[WARN]')) {
            backgroundClass = 'bg-orange-600 bg-opacity-30';
        }
        
        const logLine = document.createElement('div');
        logLine.className = `terminal-line ${typeColors[type] || 'text-gray-300'} ${backgroundClass}`;
        logLine.innerHTML = `
            <span class="text-gray-500">${time}</span>
            <span class="${typeColors[type] || 'text-gray-300'}">${typeLabels[type] || '[INFO]'}</span>
            <span class="ml-2">${message}</span>
        `;
        
        this.elements.terminalStream.appendChild(logLine);
        
        // Scroll the terminal to bottom to show the input line
        const streamView = this.elements.consoleStreamView.querySelector('.h-full.overflow-y-auto');
        if (streamView) {
            streamView.scrollTop = streamView.scrollHeight;
        }
        
        // Store streaming log for current chat
        if (this.currentChat && this.currentChat.id) {
            if (!this.chatStreamLogs) {
                this.chatStreamLogs = new Map();
            }
            if (!this.chatStreamLogs.has(this.currentChat.id)) {
                this.chatStreamLogs.set(this.currentChat.id, []);
            }
            this.chatStreamLogs.get(this.currentChat.id).push({
                message,
                type,
                timestamp: new Date().toISOString()
            });
            
            // Auto-save streaming logs
            this.saveCurrentChat().catch(error => {
                console.error('Failed to save streaming logs:', error);
            });
        }
    }

    addConsoleLog(executionLog) {
        // Store execution log for current chat
        if (this.currentChat && this.currentChat.id) {
            if (!this.chatExecutionLogs.has(this.currentChat.id)) {
                this.chatExecutionLogs.set(this.currentChat.id, []);
            }
            this.chatExecutionLogs.get(this.currentChat.id).push(executionLog);
            
            // Auto-save chat when console logs are added
            console.log('Auto-saving chat after adding console log'); // Debug
            this.saveCurrentChat().catch(error => {
                console.error('Failed to auto-save chat after console log:', error);
            });
        }
        
        // Clear the empty state message
        if (this.elements.consoleContent.querySelector('.text-center')) {
            this.elements.consoleContent.innerHTML = '';
        }
        
        // Add live status updates during execution
        // Removed fake progress box - real-time updates will come via streaming
        // if (executionLog.fractalUsed && executionLog.agents) {
        //     this.showLiveExecutionStatus(executionLog);
        // }
        
        const logEntry = document.createElement('div');
        logEntry.className = 'border border-blue-300 rounded-lg p-4 bg-gray-800 mb-4';
        
        const executionId = `execution_${Date.now()}`;
        const status = executionLog.status || 'completed';
        const statusColor = status === 'running' ? 'text-yellow-400' : status === 'completed' ? 'text-green-400' : 'text-red-400';
        const agentsText = executionLog.fractalUsed ? `${executionLog.agents.length} specialized agents` : '1 direct response';
        
        logEntry.innerHTML = `
            <!-- Main Execution Accordion -->
            <div class="execution-accordion">
                <div class="flex items-center justify-between cursor-pointer execution-header">
                    <div class="flex items-center space-x-3">
                        <span class="text-blue-400">📁</span>
                        <h3 class="font-semibold text-white">Execution ${new Date().toLocaleTimeString()}</h3>
                        <span class="text-xs px-2 py-1 rounded ${statusColor} bg-gray-700">${status.toUpperCase()}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-400">${agentsText}</span>
                        <span class="chevron text-gray-400">▶</span>
                    </div>
                </div>
                
                <div id="${executionId}" class="execution-content hidden mt-3 pl-6 border-l-2 border-blue-500">
                    <!-- Execution Info -->
                    <div class="mb-4 p-3 bg-gray-700 rounded">
                        <div class="text-sm text-gray-300 mb-2">
                            <strong>Query:</strong> ${executionLog.query || 'No query specified'}
                        </div>
                        ${executionLog.delegationReason ? `
                        <div class="text-sm text-gray-300 mb-2">
                            <strong>Delegation Reason:</strong> ${executionLog.delegationReason}
                        </div>` : ''}
                        <div class="text-xs text-gray-500">
                            Started: ${new Date(executionLog.startTime).toLocaleString()}
                            ${executionLog.completedTime ? ` | Completed: ${new Date(executionLog.completedTime).toLocaleString()}` : ''}
                        </div>
                    </div>
                    
                    <!-- Agents List -->
                    <div class="agents-container space-y-2">
                        ${this.renderAgentAccordions(executionLog)}
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for accordion functionality
        const executionHeader = logEntry.querySelector('.execution-header');
        const executionContent = logEntry.querySelector('.execution-content');
        const chevron = logEntry.querySelector('.chevron');
        
        executionHeader.addEventListener('click', () => {
            executionContent.classList.toggle('hidden');
            chevron.textContent = executionContent.classList.contains('hidden') ? '▶' : '▼';
        });
        
        // Add event listeners for agent accordions
        logEntry.querySelectorAll('.agent-header').forEach(agentHeader => {
            agentHeader.addEventListener('click', () => {
                const agentContent = agentHeader.nextElementSibling;
                const agentChevron = agentHeader.querySelector('.agent-chevron');
                agentContent.classList.toggle('hidden');
                agentChevron.textContent = agentContent.classList.contains('hidden') ? '▶' : '▼';
            });
        });
        
        this.elements.consoleContent.appendChild(logEntry);
        this.elements.consoleContent.scrollTop = this.elements.consoleContent.scrollHeight;
    }
    
    renderAgentAccordions(executionLog) {
        if (!executionLog.fractalUsed || !executionLog.agents || executionLog.agents.length === 0) {
            return `
                <div class="agent-accordion border border-gray-600 rounded p-3 bg-gray-700">
                    <div class="flex items-center space-x-2">
                        <span class="text-green-400">🤖</span>
                        <span class="text-sm font-semibold text-white">Direct Response Agent</span>
                        <span class="text-xs px-2 py-1 rounded text-green-400 bg-gray-800">COMPLETED</span>
                    </div>
                    <div class="mt-2 text-xs text-gray-400">
                        Provided direct response without delegation
                    </div>
                </div>
            `;
        }
        
        return executionLog.agents.map((agent, index) => {
            const agentId = `agent_${Date.now()}_${index}`;
            const status = agent.status || 'completed';
            const statusColor = status === 'running' ? 'text-yellow-400' : status === 'completed' ? 'text-green-400' : 'text-red-400';
            const statusBg = status === 'running' ? 'bg-yellow-900' : status === 'completed' ? 'bg-green-900' : 'bg-red-900';
            
            return `
                <div class="agent-accordion border border-gray-600 rounded">
                    <div class="agent-header cursor-pointer p-3 bg-gray-700 hover:bg-gray-600 flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="text-blue-400">🤖</span>
                            <span class="text-sm font-semibold text-white">Agent ${index + 1}: ${agent.task?.subtask || agent.task?.focus || 'Unknown task'}</span>
                            <span class="text-xs px-2 py-1 rounded ${statusColor} ${statusBg}">${status.toUpperCase()}</span>
                        </div>
                        <span class="agent-chevron text-gray-400">▶</span>
                    </div>
                    
                    <div class="agent-content hidden p-3 bg-gray-800">
                        <div class="space-y-3">
                            <div class="text-xs text-gray-400">
                                <strong>Task:</strong> ${agent.task?.subtask || agent.task?.focus || 'Unknown task'}
                            </div>
                            ${agent.startTime ? `
                            <div class="text-xs text-gray-500">
                                Started: ${new Date(agent.startTime).toLocaleString()}
                                ${agent.completedTime ? ` | Completed: ${new Date(agent.completedTime).toLocaleString()}` : ''}
                            </div>` : ''}
                            
                            ${agent.response ? `
                            <div class="border-t border-gray-600 pt-2">
                                <div class="text-xs text-gray-400 mb-1"><strong>Response:</strong></div>
                                <div class="text-sm text-gray-300 bg-gray-900 p-2 rounded max-h-32 overflow-y-auto">
                                    ${this.renderMarkdown(agent.response)}
                                </div>
                            </div>` : status === 'running' ? `
                            <div class="text-xs text-yellow-400 italic">Processing...</div>` : `
                            <div class="text-xs text-gray-500 italic">No response yet</div>`}
                            
                            ${agent.error ? `
                            <div class="text-xs text-red-400 bg-red-900 p-2 rounded">
                                <strong>Error:</strong> ${agent.error}
                            </div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    loadChatConsoleLog() {
        // Clear current console content
        this.elements.consoleContent.innerHTML = '';
        
        // Check if current chat has execution logs
        if (this.currentChat && this.currentChat.id && this.chatExecutionLogs.has(this.currentChat.id)) {
            const chatLogs = this.chatExecutionLogs.get(this.currentChat.id);
            
            // Re-render all execution logs for this chat
            chatLogs.forEach(executionLog => {
                this.renderExecutionLogToConsole(executionLog);
            });
        } else {
            // Show empty state for console
            this.showEmptyConsole();
        }
    }
    
    loadChatStreamLogs() {
        // Clear current terminal stream
        if (this.elements.terminalStream) {
            this.elements.terminalStream.innerHTML = '';
        }
        
        // Check if current chat has streaming logs
        if (this.currentChat && this.currentChat.id && this.chatStreamLogs.has(this.currentChat.id)) {
            const streamLogs = this.chatStreamLogs.get(this.currentChat.id);
            
            // Re-render all streaming logs for this chat
            streamLogs.forEach(log => {
                const time = new Date(log.timestamp).toLocaleTimeString();
                const typeColors = {
                    'info': 'text-gray-300',
                    'success': 'text-green-400',
                    'warning': 'text-yellow-400', 
                    'error': 'text-red-400',
                    'agent': 'text-blue-400',
                    'system': 'text-cyan-400'
                };
                
                const typeLabels = {
                    'info': '[INFO]',
                    'success': '[SUCCESS]',
                    'warning': '[WARN]',
                    'error': '[ERROR]',
                    'agent': '[AGENT]',
                    'system': '[SYSTEM]'
                };
                
                const logLine = document.createElement('div');
                logLine.className = `terminal-line ${typeColors[log.type] || 'text-gray-300'}`;
                logLine.innerHTML = `
                    <span class="text-gray-500">${time}</span>
                    <span class="${typeColors[log.type] || 'text-gray-300'}">${typeLabels[log.type] || '[INFO]'}</span>
                    <span class="ml-2">${log.message}</span>
                `;
                
                this.elements.terminalStream.appendChild(logLine);
            });
            
            // Scroll to bottom
            const streamView = this.elements.consoleStreamView.querySelector('.h-full.overflow-y-auto');
            if (streamView) {
                streamView.scrollTop = streamView.scrollHeight;
            }
        }
    }
    
    // Unified method to display all logs in chronological order
    rebuildConsoleSequence() {
        if (!this.currentChat || !this.currentChat.id) return;
        
        // Clear current stream
        if (this.elements.terminalStream) {
            this.elements.terminalStream.innerHTML = '';
        }
        
        // Get all logs for current chat
        const streamLogs = this.chatStreamLogs.has(this.currentChat.id) ? this.chatStreamLogs.get(this.currentChat.id) : [];
        const execLogs = this.chatExecutionLogs.has(this.currentChat.id) ? this.chatExecutionLogs.get(this.currentChat.id) : [];
        
        // Combine and sort all logs by timestamp
        const allLogs = [];
        
        // Add stream logs
        streamLogs.forEach(log => {
            allLogs.push({
                type: 'stream',
                timestamp: log.timestamp,
                data: log
            });
        });
        
        // Add execution logs (each creates multiple entries)
        execLogs.forEach(execLog => {
            // Add main execution start
            allLogs.push({
                type: 'exec_start',
                timestamp: execLog.startTime || new Date().toISOString(),
                data: execLog
            });
            
            // Add agent executions
            if (execLog.agents) {
                execLog.agents.forEach((agent, index) => {
                    allLogs.push({
                        type: 'agent',
                        timestamp: agent.startTime || execLog.startTime || new Date().toISOString(),
                        data: { ...agent, index: index + 1 }
                    });
                });
            }
            
            // Add execution completion
            allLogs.push({
                type: 'exec_complete',
                timestamp: execLog.completedTime || new Date().toISOString(),
                data: execLog
            });
        });
        
        // Sort by timestamp
        allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Render all logs in chronological order
        allLogs.forEach(logEntry => {
            this.renderLogEntry(logEntry);
        });
        
        // Scroll to bottom to show the input line
        const streamView = this.elements.consoleStreamView.querySelector('.h-full.overflow-y-auto');
        if (streamView) {
            streamView.scrollTop = streamView.scrollHeight;
        }
    }
    
    renderLogEntry(logEntry) {
        const { type, data } = logEntry;
        
        switch (type) {
            case 'stream':
                // Render stream log
                this.renderStreamLogEntry(data);
                break;
            case 'exec_start':
                // Render execution start
                this.addTerminalLog(`Fractal execution initiated: "${data.query}"`, 'system', false);
                if (data.fractalUsed) {
                    this.addTerminalLog(`Delegating to ${data.agents ? data.agents.length : 0} specialized agents`, 'success', false);
                }
                break;
            case 'agent':
                // Render agent execution
                const agentDescription = data.focus || data.subtask || 'Unknown task';
                this.addTerminalLog(`Agent ${data.index}: ${agentDescription}`, 'agent', false);
                this.addTerminalLog(`└── Status: ${data.status || 'completed'}`, 'success', false);
                break;
            case 'exec_complete':
                // Render execution completion
                this.addTerminalLog('Execution completed successfully', 'success', false);
                break;
        }
    }
    
    renderStreamLogEntry(data) {
        const time = new Date(data.timestamp).toLocaleTimeString();
        const typeColors = {
            'info': 'text-gray-300',
            'success': 'text-green-400',
            'warning': 'text-yellow-400', 
            'error': 'text-red-400',
            'agent': 'text-blue-400',
            'system': 'text-cyan-400'
        };
        
        const typeLabels = {
            'info': '[INFO]',
            'success': '[SUCCESS]',
            'warning': '[WARN]',
            'error': '[ERROR]',
            'agent': '[AGENT]',
            'system': '[SYSTEM]'
        };
        
        const logLine = document.createElement('div');
        logLine.className = `terminal-line ${typeColors[data.type] || 'text-gray-300'}`;
        logLine.innerHTML = `
            <span class="text-gray-500">${time}</span>
            <span class="${typeColors[data.type] || 'text-gray-300'}">${typeLabels[data.type] || '[INFO]'}</span>
            <span class="ml-2">${data.message}</span>
        `;
        
        this.elements.terminalStream.appendChild(logLine);
    }
    
    renderExecutionLogToConsole(executionLog) {
        // This is the same as the rendering part of addConsoleLog, but without storing
        const logEntry = document.createElement('div');
        logEntry.className = 'border border-blue-300 rounded-lg p-4 bg-gray-800 mb-4';
        
        const executionId = `execution_${Date.now()}_${Math.random()}`;
        const status = executionLog.status || 'completed';
        const statusColor = status === 'running' ? 'text-yellow-400' : status === 'completed' ? 'text-green-400' : 'text-red-400';
        const agentsText = executionLog.fractalUsed ? `${executionLog.agents.length} specialized agents` : '1 direct response';
        
        logEntry.innerHTML = `
            <!-- Main Execution Accordion -->
            <div class="execution-accordion">
                <div class="flex items-center justify-between cursor-pointer execution-header">
                    <div class="flex items-center space-x-3">
                        <span class="text-blue-400">📁</span>
                        <h3 class="font-semibold text-white">Execution ${new Date(executionLog.startTime).toLocaleTimeString()}</h3>
                        <span class="text-xs px-2 py-1 rounded ${statusColor} bg-gray-700">${status.toUpperCase()}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-400">${agentsText}</span>
                        <span class="chevron text-gray-400">▶</span>
                    </div>
                </div>
                
                <div id="${executionId}" class="execution-content hidden mt-3 pl-6 border-l-2 border-blue-500">
                    <!-- Execution Info -->
                    <div class="mb-4 p-3 bg-gray-700 rounded">
                        <div class="text-sm text-gray-300 mb-2">
                            <strong>Query:</strong> ${executionLog.query || 'No query specified'}
                        </div>
                        ${executionLog.delegationReason ? `
                        <div class="text-sm text-gray-300 mb-2">
                            <strong>Delegation Reason:</strong> ${executionLog.delegationReason}
                        </div>` : ''}
                        <div class="text-xs text-gray-500">
                            Started: ${new Date(executionLog.startTime).toLocaleString()}
                            ${executionLog.completedTime ? ` | Completed: ${new Date(executionLog.completedTime).toLocaleString()}` : ''}
                        </div>
                    </div>
                    
                    <!-- Agents List -->
                    <div class="agents-container space-y-2">
                        ${this.renderAgentAccordions(executionLog)}
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for accordion functionality
        const executionHeader = logEntry.querySelector('.execution-header');
        const executionContent = logEntry.querySelector('.execution-content');
        const chevron = logEntry.querySelector('.chevron');
        
        executionHeader.addEventListener('click', () => {
            executionContent.classList.toggle('hidden');
            chevron.textContent = executionContent.classList.contains('hidden') ? '▶' : '▼';
        });
        
        // Add event listeners for agent accordions
        logEntry.querySelectorAll('.agent-header').forEach(agentHeader => {
            agentHeader.addEventListener('click', () => {
                const agentContent = agentHeader.nextElementSibling;
                const agentChevron = agentHeader.querySelector('.agent-chevron');
                agentContent.classList.toggle('hidden');
                agentChevron.textContent = agentContent.classList.contains('hidden') ? '▶' : '▼';
            });
        });
        
        this.elements.consoleContent.appendChild(logEntry);
    }
    
    showEmptyConsole() {
        this.elements.consoleContent.innerHTML = `
            <div class="text-center py-8">
                <div class="text-gray-400 text-sm mb-2">🔍 No execution logs yet</div>
                <p class="text-xs text-gray-500">Send a message to see fractal agent executions here</p>
            </div>
        `;
    }
    
    showLiveExecutionStatus(executionLog) {
        // Create a live status container that appears before the full log
        const statusContainer = document.createElement('div');
        statusContainer.className = 'live-execution-status border border-yellow-400 rounded-lg p-3 bg-yellow-900 bg-opacity-20 mb-4';
        statusContainer.innerHTML = `
            <div class="flex items-center space-x-2 mb-3">
                <div class="animate-spin text-yellow-400">⚡</div>
                <h3 class="font-semibold text-yellow-400">Live Execution Status</h3>
                <div class="text-xs text-yellow-300">Processing agents...</div>
            </div>
            <div class="space-y-2" id="live-status-agents">
                ${executionLog.agents.map((agent, index) => {
                    const status = agent.status || 'pending';
                    const statusIcon = status === 'running' ? '🔄' : status === 'completed' ? '✅' : '⏳';
                    const statusColor = status === 'running' ? 'text-blue-400' : status === 'completed' ? 'text-green-400' : 'text-gray-400';
                    
                    return `
                        <div class="flex items-center justify-between text-xs" id="agent-status-${index}">
                            <div class="flex items-center space-x-2">
                                <span>${statusIcon}</span>
                                <span class="text-white">Agent ${index + 1}: ${agent.focus}</span>
                            </div>
                            <span class="${statusColor} font-medium">${status.toUpperCase()}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="mt-2 text-xs text-yellow-300">
                Completed: ${executionLog.agents.filter(a => a.status === 'completed').length}/${executionLog.agents.length} agents
            </div>
        `;
        
        this.elements.consoleContent.appendChild(statusContainer);
        this.elements.consoleContent.scrollTop = this.elements.consoleContent.scrollHeight;
        
        // Simulate live updates (in a real implementation, this would be via WebSockets or polling)
        this.simulateLiveAgentUpdates(statusContainer, executionLog);
    }
    
    simulateLiveAgentUpdates(statusContainer, executionLog) {
        let currentAgent = 0;
        
        const updateAgentStatus = () => {
            if (currentAgent < executionLog.agents.length) {
                const agent = executionLog.agents[currentAgent];
                const statusElement = statusContainer.querySelector(`#agent-status-${currentAgent}`);
                
                if (statusElement) {
                    // Update to running
                    statusElement.innerHTML = `
                        <div class="flex items-center space-x-2">
                            <span class="animate-pulse">🔄</span>
                            <span class="text-white">Agent ${currentAgent + 1}: ${agent.task?.subtask || agent.task?.focus || 'Unknown task'}</span>
                        </div>
                        <span class="text-blue-400 font-medium">RUNNING</span>
                    `;
                    
                    // After a delay, mark as completed
                    setTimeout(() => {
                        if (agent.status === 'completed') {
                            statusElement.innerHTML = `
                                <div class="flex items-center space-x-2">
                                    <span>✅</span>
                                    <span class="text-white">Agent ${currentAgent + 1}: ${agent.task?.subtask || agent.task?.focus || 'Unknown task'}</span>
                                </div>
                                <span class="text-green-400 font-medium">COMPLETED</span>
                            `;
                            
                            // Update progress counter
                            const progressElement = statusContainer.querySelector('.mt-2');
                            if (progressElement) {
                                const completed = currentAgent + 1;
                                progressElement.innerHTML = `
                                    <div class="text-xs text-yellow-300">
                                        Completed: ${completed}/${executionLog.agents.length} agents
                                    </div>
                                `;
                            }
                        }
                        
                        currentAgent++;
                        if (currentAgent < executionLog.agents.length) {
                            setTimeout(updateAgentStatus, 500);
                        } else {
                            // All agents completed, remove live status after a delay
                            setTimeout(() => {
                                statusContainer.classList.add('opacity-50');
                                statusContainer.classList.add('scale-95');
                                setTimeout(() => {
                                    statusContainer.remove();
                                }, 1000);
                            }, 2000);
                        }
                    }, Math.random() * 2000 + 1000); // Random delay 1-3 seconds per agent
                }
            }
        };
        
        // Start the first agent after a brief delay
        setTimeout(updateAgentStatus, 500);
    }

    renderExecutionDetails(log) {
        if (!log.agents) return '<p class="text-gray-400">No detailed logs available</p>';
        
        return log.agents.map(agent => {
            const taskHtml = agent.task ? `
                <div class="bg-fractal-dark p-2 rounded-md text-xs mb-2" style="margin-bottom:6px;">
                    <strong>Task:</strong> ${agent.task.subtask || 'Root query'}<br>
                    ${agent.task.focus ? `<strong>Focus:</strong> ${agent.task.focus}` : ''}
                </div>
            ` : '';
            
            let responseHtml = '<em class="text-gray-500">No response</em>';
            if (agent.response) {
                responseHtml = this.renderMarkdown(agent.response);
            }
                
            return `
                <div class="border-1 border-b-2 border-[#c2e2f8] p-3 pl-6 mb-6 m-4">
                    <div class="text-sm font-semibold mb-1">
                        Layer ${agent.layer} - Agent ${agent.position + 1} 
                        <span class="text-xs text-gray-400">(${agent.type || 'unknown'})</span>
                    </div>
                    ${taskHtml}
                    <div class="text-sm text-gray-300 bg-gray-800 p-2 rounded">
                        ${responseHtml}
                    </div>
                </div>
            `;
        }).join('');
    }


    renderNodeGraph(tree) {
        if (!this.scene) {
            this.init3DFractal();
        }
        
        // Only create new fractal if we don't have one or if it's a different structure
        if (!this.fractalGroup || this.needsNewFractal(tree)) {
            this.create3DFractal(tree);
        } else {
            // Just update the existing fractal with new execution states
            this.updateFractalStates(tree);
        }
        
        this.updateNodeInfo(tree);
    }

    needsNewFractal(tree) {
        if (!this.fractalGroup || !this.lastTreeStructure) return true;
        
        // Check if structure changed (depth, branching factor)
        const currentStructure = this.getTreeStructure(tree);
        const lastStructure = this.lastTreeStructure;
        
        return currentStructure.depth !== lastStructure.depth || 
               currentStructure.maxBranching !== lastStructure.maxBranching;
    }

    getTreeStructure(tree) {
        const getMaxDepth = (node) => {
            if (!node.children || node.children.length === 0) return node.layer;
            return Math.max(...node.children.map(child => getMaxDepth(child)));
        };
        
        const getMaxBranching = (node) => {
            let maxBranching = node.children ? node.children.length : 0;
            if (node.children) {
                for (const child of node.children) {
                    maxBranching = Math.max(maxBranching, getMaxBranching(child));
                }
            }
            return maxBranching;
        };
        
        return {
            depth: getMaxDepth(tree) + 1,
            maxBranching: getMaxBranching(tree)
        };
    }

    updateFractalStates(tree) {
        // Recursively update node states without recreating geometry
        this.updateNodeState(tree);
    }

    updateNodeState(node) {
        const sphere = this.nodeObjects.get(node.id);
        if (sphere) {
            // Update material based on execution state
            let nodeColor, opacity;
            if (node.executed) {
                nodeColor = 0x00ff00; // Bright green for executed
                opacity = 1.0;
                // Remove from execution animations if it was animating
                this.executionAnimations.delete(node.id);
                sphere.scale.setScalar(1.0); // Reset scale
            } else if (node.currentlyExecuting) {
                nodeColor = 0xffffff; // White for currently executing
                opacity = 1.0;
                // Add to execution animations
                this.executionAnimations.set(node.id, {
                    sphere: sphere,
                    originalScale: 1.0,
                    time: 0
                });
            } else {
                nodeColor = node.layer === 0 ? 0x8b5cf6 : this.getLayerColor(node.layer);
                opacity = 0.3; // Dim for unexecuted
            }
            
            sphere.material.color.setHex(nodeColor);
            sphere.material.opacity = opacity;
            sphere.material.emissive.setHex(node.currentlyExecuting ? 0x333333 : 0x000000);
        }
        
        // Recursively update children
        if (node.children) {
            node.children.forEach(child => this.updateNodeState(child));
        }
    }

    showDemoFractal() {
        if (!this.scene) {
            this.init3DFractal();
        }
        
        this.createAgentFractal();
        this.updateDemoInfo();
    }

    createAgentFractal() {
        if (this.fractalGroup) {
            this.scene.remove(this.fractalGroup);
        }
        
        this.fractalGroup = new THREE.Group();
        
        const depth = parseInt(this.elements.depthSlider.value);
        const length = parseInt(this.elements.lengthSlider.value);
        const modifier = this.getCurrentModifier();
        
        // Get layer counts based on modifier
        const layerCounts = this.calculateModifierLayerCounts(depth, length, modifier);
        
        // Create center node
        const centerGeometry = new THREE.SphereGeometry(0.15, 8, 6);
        const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
        const centerNode = new THREE.Mesh(centerGeometry, centerMaterial);
        this.fractalGroup.add(centerNode);
        
        // Create fractal branches layer by layer using modifier pattern
        const nodePositions = [{ pos: new THREE.Vector3(0, 0, 0), layer: 0 }];
        
        for (let layer = 1; layer < depth; layer++) {
            const parentNodes = nodePositions.filter(n => n.layer === layer - 1);
            const radius = layer * 1.5;
            
            // Calculate agents per parent node for this layer
            const totalAgentsThisLayer = layerCounts[layer];
            const agentsPerParent = Math.ceil(totalAgentsThisLayer / parentNodes.length);
            
            parentNodes.forEach((parent, parentIndex) => {
                const startIndex = parentIndex * agentsPerParent;
                const endIndex = Math.min(startIndex + agentsPerParent, totalAgentsThisLayer);
                const numChildrenForThisParent = endIndex - startIndex;
                
                for (let i = 0; i < numChildrenForThisParent; i++) {
                    // Distribute nodes evenly around parent
                    const angle = (i / Math.max(1, numChildrenForThisParent)) * 2 * Math.PI;
                    const phi = (Math.random() - 0.5) * Math.PI * 0.6; // Random elevation
                    
                    const x = parent.pos.x + radius * Math.cos(phi) * Math.cos(angle);
                    const y = parent.pos.y + radius * Math.cos(phi) * Math.sin(angle);
                    const z = parent.pos.z + radius * Math.sin(phi);
                    
                    const childPos = new THREE.Vector3(x, y, z);
                    
                    // Create node
                    const nodeGeometry = new THREE.SphereGeometry(0.08, 6, 4);
                    const hue = (layer - 1) / Math.max(1, depth - 2);
                    const nodeColor = new THREE.Color().setHSL(hue * 0.8, 0.7, 0.6);
                    const nodeMaterial = new THREE.MeshBasicMaterial({ color: nodeColor });
                    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
                    node.position.copy(childPos);
                    this.fractalGroup.add(node);
                    
                    // Create connection line to parent
                    const lineGeometry = new THREE.BufferGeometry();
                    const linePoints = [parent.pos.clone(), childPos.clone()];
                    lineGeometry.setFromPoints(linePoints);
                    const lineMaterial = new THREE.LineBasicMaterial({ 
                        color: nodeColor,
                        opacity: 0.4,
                        transparent: true
                    });
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    this.fractalGroup.add(line);
                    
                    // Store for next layer
                    nodePositions.push({ pos: childPos, layer: layer });
                }
            });
        }
        
        // Ensure the fractal group is centered
        this.fractalGroup.position.set(0, 0, 0);
        this.scene.add(this.fractalGroup);
        
        // Auto-rotate the fractal
        if (!this.animationId) {
            this.animateFractal();
        }
    }

    animateFractal() {
        if (this.fractalGroup) {
            // Slow down rotation by 80% (multiply by 0.2)
            this.fractalGroup.rotation.y += 0.001;
            this.fractalGroup.rotation.x += 0.0004;
        }
        
        this.renderer.render(this.scene, this.camera);
        this.animationId = requestAnimationFrame(() => this.animateFractal());
    }

    updateDemoInfo() {
        const totalAgents = this.elements.agentCount.textContent;
        const depth = this.elements.depthValue.textContent;
        const length = this.elements.lengthValue.textContent;
        const modifier = this.getCurrentModifier();
        const layerCounts = this.calculateModifierLayerCounts(parseInt(depth), parseInt(length), modifier);
        
        this.elements.nodeInfoContent.innerHTML = `
            <p class="text-sm text-gray-400 mb-3">Total Agents: <span class="text-white font-semibold">${totalAgents}</span></p>
            <p class="text-sm text-gray-400 mb-2">Depth: <span class="text-white">${depth}</span> | Length: <span class="text-white">${length}</span></p>
            <p class="text-sm text-gray-400 mb-3">Modifier: <span class="text-white">${this.elements.selectedModifier.textContent}</span></p>
            <p class="text-sm text-gray-400 mb-3">Layer Pattern: <span class="text-white">[${layerCounts.join(', ')}]</span></p>
            <div class="text-sm text-gray-400 mb-3">
                <p class="mb-2">🎮 Controls:</p>
                <p class="text-xs text-gray-500 mb-1">• Click & drag to rotate</p>
                <p class="text-xs text-gray-500 mb-1">• Scroll to zoom</p>
                <p class="text-xs text-gray-500 mb-3">• Auto-rotate when idle</p>
            </div>
            <p class="text-sm text-fractal-blue">💡 Send a message to see real fractal processing!</p>
        `;
    }

    toggleInfoBox() {
        const content = this.elements.nodeInfoContent;
        const btn = this.elements.toggleInfoBtn;

        if (content && btn) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                btn.textContent = '▾'; // small down triangle
            } else {
                content.style.display = 'none';
                btn.textContent = '\u00A0▸'; // small right triangle
            }
        }
    }

    init3DFractal() {
        if (this.scene) return; // Already initialized
        
        try {
            if (typeof THREE === 'undefined') {
                console.error('Three.js not loaded');
                this.showThreeJsError();
                return;
            }
            
            if (!this.elements.nodeCanvas) {
                console.error('Node canvas element not found');
                this.showThreeJsError();
                return;
            }
            
            const container = this.elements.nodeCanvas.parentElement;
            const canvas = this.elements.nodeCanvas;
            
            if (!container) {
                console.error('Canvas container not found');
                this.showThreeJsError();
                return;
            }
            
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        
            this.renderer.setSize(container.offsetWidth, container.offsetHeight);
            this.renderer.setClearColor(0x0f0f0f);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.renderer && this.camera) {
                this.camera.aspect = container.offsetWidth / container.offsetHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(container.offsetWidth, container.offsetHeight);
            }
        });
        
        this.camera.position.set(5, 5, 15);
        this.camera.lookAt(0, 0, 0);
        
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
        
        this.setupFractalControls();
        
        this.animate();
        
            window.addEventListener('resize', () => {
                const container = this.elements.nodeCanvas.parentElement;
                if (container && this.renderer && this.camera) {
                    this.camera.aspect = container.offsetWidth / container.offsetHeight;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(container.offsetWidth, container.offsetHeight);
                }
            });
        } catch (error) {
            console.error('Error initializing 3D fractal:', error);
            this.showThreeJsError();
        }
    }

    showThreeJsError() {
        this.elements.nodeInfoContent.innerHTML = `
            <h3 class="font-semibold mb-2 text-red-400">3D View Error</h3>
            <p class="text-sm text-gray-400 mb-2">Unable to initialize 3D graphics</p>
            <p class="text-xs text-gray-500 mb-2">Three.js may not be loaded properly</p>
            <p class="text-xs text-fractal-blue">Please check the browser console for details</p>
        `;
    }

    setupFractalControls() {
        const canvas = this.renderer.domElement;
        this.isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let rotation = { x: 0, y: 0 };
        
        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            rotation.x += deltaMove.y * 0.01;
            rotation.y += deltaMove.x * 0.01;
            
            if (this.fractalGroup) {
                this.fractalGroup.rotation.x = rotation.x;
                this.fractalGroup.rotation.y = rotation.y;
            }
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoom = e.deltaY * 0.001;
            this.camera.position.z += zoom;
            this.camera.position.z = Math.max(2, Math.min(50, this.camera.position.z));
        });
    }

    create3DFractal(tree) {
        if (this.fractalGroup) {
            this.scene.remove(this.fractalGroup);
        }
        
        this.fractalGroup = new THREE.Group();
        this.nodeObjects = new Map();
        this.executionAnimations = new Map();
        
        // Store the tree structure for comparison
        this.lastTreeStructure = this.getTreeStructure(tree);
        
        this.createFractalNode(tree, new THREE.Vector3(0, 0, 0), 1.0);
        
        this.scene.add(this.fractalGroup);
        
        // Start execution animation if needed
        this.animateExecution();
    }

    createFractalNode(node, position, scale) {
        const geometry = new THREE.SphereGeometry(0.3 * scale, 16, 16);
        
        // Determine node color and state
        let nodeColor, opacity;
        if (node.executed) {
            nodeColor = 0x00ff00; // Bright green for executed
            opacity = 1.0;
        } else if (node.currentlyExecuting) {
            nodeColor = 0xffffff; // White for currently executing
            opacity = 1.0;
        } else {
            nodeColor = node.layer === 0 ? 0x8b5cf6 : this.getLayerColor(node.layer);
            opacity = 0.3; // Dim for unexecuted
        }
        
        const material = new THREE.MeshPhongMaterial({
            color: nodeColor,
            transparent: true,
            opacity: opacity,
            emissive: node.currentlyExecuting ? 0x333333 : 0x000000
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        sphere.userData = { node: node }; // Store node reference
        
        this.fractalGroup.add(sphere);
        this.nodeObjects.set(node.id, sphere);
        
        // Add pulsing animation for currently executing nodes
        if (node.currentlyExecuting) {
            this.executionAnimations.set(node.id, {
                sphere: sphere,
                originalScale: scale,
                time: 0
            });
        }
        
        if (node.children && node.children.length > 0) {
            const radius = 2.0 * scale;
            const angleStep = (Math.PI * 2) / node.children.length;
            
            node.children.forEach((child, index) => {
                const angle = angleStep * index;
                const layerOffset = (node.layer + 1) * 0.3;
                
                const childPosition = new THREE.Vector3(
                    position.x + radius * Math.cos(angle),
                    position.y + radius * Math.sin(angle) * Math.cos(layerOffset),
                    position.z + radius * Math.sin(angle) * Math.sin(layerOffset)
                );
                
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([position, childPosition]);
                const lineMaterial = new THREE.LineBasicMaterial({ 
                    color: 0x4b5563,
                    transparent: true,
                    opacity: 0.6
                });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                this.fractalGroup.add(line);
                
                this.createFractalNode(child, childPosition, scale * 0.7);
            });
        }
    }

    animateExecution() {
        // Animate currently executing nodes
        this.executionAnimations.forEach((animation, nodeId) => {
            animation.time += 0.05;
            const pulseFactor = 1 + 0.3 * Math.sin(animation.time * 4);
            animation.sphere.scale.setScalar(pulseFactor);
            
            // Update glow effect
            animation.sphere.material.emissive.setHex(
                Math.sin(animation.time * 3) > 0 ? 0x666666 : 0x333333
            );
        });
    }

    getLayerColor(layer) {
        const colors = [0x8b5cf6, 0x3b82f6, 0x10b981, 0xf59e0b, 0xef4444, 0xec4899];
        return colors[layer % colors.length];
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.fractalGroup && !this.isDragging) {
            this.fractalGroup.rotation.y += 0.005;
        }
        
        // Update execution animations
        this.animateExecution();
        
        this.renderer.render(this.scene, this.camera);
    }

    updateNodeInfo(tree) {
        const totalNodes = this.countNodes(tree);
        const maxDepth = this.getMaxDepth(tree);
        
        this.elements.nodeInfoContent.innerHTML = `
            <h3 class="font-semibold mb-2">3D Fractal Tree</h3>
            <p class="text-sm text-gray-400 mb-2">Total Agents: ${totalNodes}</p>
            <p class="text-sm text-gray-400 mb-2">Max Depth: ${maxDepth}</p>
            <p class="text-sm text-gray-400 mb-2">🎮 Controls:</p>
            <p class="text-xs text-gray-500 mb-1">• Click & drag to rotate</p>
            <p class="text-xs text-gray-500 mb-1">• Scroll to zoom</p>
            <p class="text-xs text-gray-500 mb-2">• Auto-rotate when idle</p>
            <p class="text-sm text-gray-400">🎨 Colors by layer:</p>
            <p class="text-xs text-gray-500">Purple→Blue→Green→Orange→Red→Pink</p>
        `;
    }

    countNodes(node) {
        let count = 1;
        if (node.children) {
            node.children.forEach(child => {
                count += this.countNodes(child);
            });
        }
        return count;
    }

    getMaxDepth(node) {
        if (!node.children || node.children.length === 0) {
            return node.layer;
        }
        return Math.max(...node.children.map(child => this.getMaxDepth(child)));
    }

    setupFunctionHandlers() {
        // Functions enable/disable toggle (main functions tab)
        this.elements.functionsEnabled.addEventListener('change', (e) => {
            this.functionsEnabled = e.target.checked;
            this.elements.sidebarFunctionsEnabled.checked = e.target.checked; // Sync with sidebar
            this.updateFunctionStatusIndicators();
            this.saveFunctionSettings();
            this.updateSidebarFunctionStatus();
            this.autoSaveProjectSettings(); // Auto-save to project
        });

        // Sidebar functions enable/disable toggle
        this.elements.sidebarFunctionsEnabled.addEventListener('change', (e) => {
            this.functionsEnabled = e.target.checked;
            this.elements.functionsEnabled.checked = e.target.checked; // Sync with main tab
            this.updateFunctionStatusIndicators();
            this.saveFunctionSettings();
            this.updateSidebarFunctionStatus();
            this.autoSaveProjectSettings(); // Auto-save to project
        });

        // Manage functions button
        this.elements.manageFunctionsBtn.addEventListener('click', () => {
            this.showTab('functions');
        });

        // Add function button
        this.elements.addFunctionBtn.addEventListener('click', () => this.showFunctionEditor());

        // Function templates
        document.querySelectorAll('.function-template').forEach(template => {
            template.addEventListener('click', () => {
                const templateType = template.dataset.template;
                this.addFunctionFromTemplate(templateType);
            });
        });

        // Export/Import functions
        this.elements.exportFunctionsBtn.addEventListener('click', () => this.exportFunctions());
        this.elements.importFunctionsBtn.addEventListener('click', () => this.elements.importFunctionsFile.click());
        this.elements.importFunctionsFile.addEventListener('change', (e) => this.importFunctions(e));
        
        // Export/Import projects
        this.elements.exportProjectBtn.addEventListener('click', () => this.exportProject());
        this.elements.importProjectBtn.addEventListener('click', () => this.elements.importProjectFile.click());
        this.elements.importProjectFile.addEventListener('change', (e) => this.importProject(e));
        
        // Project management (removed - now handled by File menu)
        
        // Startup Modal event listeners
        if (this.elements.createNewProjectBtn) {
            console.log('Setting up createNewProjectBtn event listener'); // Debug log
            this.elements.createNewProjectBtn.addEventListener('click', (e) => {
                console.log('Create project button clicked'); // Debug log
                e.preventDefault();
                e.stopPropagation();
                try {
                    this.createProjectFromModal();
                } catch (error) {
                    console.error('Error in createProjectFromModal:', error);
                    alert('Error creating project: ' + error.message);
                }
            });
        } else {
            console.error('createNewProjectBtn element not found');
        }
        this.elements.importProjectBtnStartup.addEventListener('click', () => this.elements.importProjectFileStartup.click());
        this.elements.importProjectFileStartup.addEventListener('change', (e) => this.importProjectFromStartup(e));
        
        // File Menu event listeners
        this.elements.fileMenuBtn.addEventListener('click', () => this.toggleFileMenu());
        this.elements.newProjectMenuBtn.addEventListener('click', () => this.showStartupModal());
        this.elements.saveProjectMenuBtn.addEventListener('click', () => this.saveCurrentProject());
        this.elements.exportProjectMenuBtn.addEventListener('click', () => this.exportProject());
        this.elements.importProjectMenuBtn.addEventListener('click', () => this.elements.importProjectFileMenu.click());
        this.elements.importProjectFileMenu.addEventListener('change', (e) => this.importProject(e));
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            // Close project dropdown
            if (!this.elements.projectDropdownBtn?.contains(e.target) && !this.elements.projectDropdownMenu?.contains(e.target)) {
                this.elements.projectDropdownMenu?.classList.add('hidden');
                if (this.elements.projectDropdownArrow) this.elements.projectDropdownArrow.style.transform = '';
            }
            
            // Close file menu dropdown
            if (!this.elements.fileMenuBtn.contains(e.target) && !this.elements.fileMenuDropdown.contains(e.target)) {
                this.elements.fileMenuDropdown.classList.add('hidden');
            }
        });
    }

    async loadSavedFunctions() {
        try {
            // Load local functions first
            const savedFunctions = localStorage.getItem('fractal_functions');
            const functionsEnabled = localStorage.getItem('fractal_functions_enabled');
            
            if (savedFunctions) {
                const functionsData = JSON.parse(savedFunctions);
                functionsData.forEach(func => this.functions.set(func.id, func));
            }

            // Load global functions from server
            await this.loadGlobalFunctions();

            if (functionsEnabled !== null) {
                this.functionsEnabled = functionsEnabled === 'true';
                this.elements.functionsEnabled.checked = this.functionsEnabled;
                this.elements.sidebarFunctionsEnabled.checked = this.functionsEnabled;
            }

            this.renderFunctionsList();
            this.updateFunctionStatusIndicators();
            this.updateSidebarFunctionStatus();
        } catch (error) {
            console.error('Error loading saved functions:', error);
        }
    }

    async loadGlobalFunctions() {
        try {
            const response = await fetch('/api/functions/global');
            if (response.ok) {
                const globalFunctions = await response.json();
                
                for (const globalFunc of globalFunctions) {
                    // Check if we already have this function locally
                    if (!this.functions.has(globalFunc.id)) {
                        // Add as a global function, initially disabled for this project
                        const functionData = {
                            ...globalFunc,
                            isGlobal: true,
                            enabled: false, // Project-level toggle starts as disabled
                            projectToggleState: this.getProjectFunctionToggleState(globalFunc.id)
                        };
                        
                        // Apply project-level toggle state if it exists
                        if (functionData.projectToggleState !== null) {
                            functionData.enabled = functionData.projectToggleState;
                        }
                        
                        this.functions.set(globalFunc.id, functionData);
                    } else {
                        // Update existing function with global data but preserve local settings
                        const existingFunc = this.functions.get(globalFunc.id);
                        const updatedFunc = {
                            ...globalFunc,
                            enabled: existingFunc.enabled,
                            isGlobal: true,
                            projectToggleState: existingFunc.projectToggleState || existingFunc.enabled
                        };
                        this.functions.set(globalFunc.id, updatedFunc);
                    }
                }
                
                console.log(`Loaded ${globalFunctions.length} global functions`);
            }
        } catch (error) {
            console.warn('Failed to load global functions:', error);
        }
    }

    getProjectFunctionToggleState(functionId) {
        if (!this.currentProject || !this.currentProject.id) return null;
        
        try {
            const projectFunctionStates = localStorage.getItem(`project_${this.currentProject.id}_function_states`);
            if (projectFunctionStates) {
                const states = JSON.parse(projectFunctionStates);
                return states[functionId] !== undefined ? states[functionId] : null;
            }
        } catch (error) {
            console.warn('Failed to load project function states:', error);
        }
        return null;
    }

    saveProjectFunctionToggleState(functionId, enabled) {
        if (!this.currentProject || !this.currentProject.id) return;
        
        try {
            const key = `project_${this.currentProject.id}_function_states`;
            let states = {};
            
            const existing = localStorage.getItem(key);
            if (existing) {
                states = JSON.parse(existing);
            }
            
            states[functionId] = enabled;
            localStorage.setItem(key, JSON.stringify(states));
        } catch (error) {
            console.error('Failed to save project function state:', error);
        }
    }

    saveFunctionSettings() {
        try {
            const functionsArray = Array.from(this.functions.values());
            localStorage.setItem('fractal_functions', JSON.stringify(functionsArray));
            localStorage.setItem('fractal_functions_enabled', this.functionsEnabled.toString());
            this.updateFunctionStatusIndicators();
        } catch (error) {
            console.error('Error saving functions:', error);
        }
    }

    updateFunctionStatusIndicators() {
        if (this.elements.functionsStatusIndicator && this.elements.functionsStatusText) {
            if (this.functionsEnabled) {
                this.elements.functionsStatusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
                this.elements.functionsStatusText.textContent = 'Functions Enabled';
            } else {
                this.elements.functionsStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
                this.elements.functionsStatusText.textContent = 'Functions Disabled';
            }
        }

        if (this.elements.functionsCountDisplay) {
            this.elements.functionsCountDisplay.textContent = this.functions.size.toString();
        }
    }

    renderFunctionsList() {
        if (this.functions.size === 0) {
            this.elements.functionsList.innerHTML = `
                <div class="text-center p-8 border-2 border-dashed border-gray-600 rounded-lg" style="padding:20px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto mb-4 text-gray-500">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    </svg>
                    <p class="text-gray-400 font-medium mb-2">No custom functions configured</p>
                    <p class="text-sm text-gray-500">Click "Add Function" to create your first custom function</p>
                </div>
            `;
            this.updateFunctionStatusIndicators();
            return;
        }

        this.elements.functionsList.innerHTML = '';
        
        this.functions.forEach((func, id) => {
            const functionCard = document.createElement('div');
            functionCard.className = 'function-card p-4 bg-fractal-dark border border-gray-600 rounded-lg hover:border-gray-400 transition-colors cursor-pointer';
            
            const indicatorClasses = func.enabled ? 'bg-green-500 border-green-300' : 'bg-red-500 border-red-300';
            console.log(`Rendering function ${func.name} - enabled: ${func.enabled}, classes: ${indicatorClasses}`);
            
            functionCard.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <input type="checkbox" ${func.enabled ? 'checked' : ''} class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" readonly>
                            <div class="absolute inset-0 pointer-events-none">
                                ${func.enabled ? 
                                    '<svg class="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : 
                                    ''
                                }
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <h5 class="font-semibold">${func.name}</h5>
                            <div class="flex items-center gap-1">
                                ${func.isGlobal ? 
                                    '<span class="text-xs px-2 py-0.5 bg-purple-600 text-purple-100 rounded-full">GLOBAL</span>' : 
                                    '<span class="text-xs px-2 py-0.5 bg-blue-600 text-blue-100 rounded-full">LOCAL</span>'
                                }
                                ${func.jsCode ? 
                                    '<span class="text-xs px-2 py-0.5 bg-yellow-600 text-yellow-100 rounded-full">JS</span>' : 
                                    ''
                                }
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${!func.isGlobal ? `
                        <button class="edit-function w-7 h-7 rounded-md bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors" data-id="${id}" onclick="event.stopPropagation()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="delete-function w-7 h-7 rounded-md bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors" data-id="${id}" onclick="event.stopPropagation()">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
                <p class="text-sm text-gray-400 mb-2">${func.description}</p>
                <div class="text-xs text-gray-500">
                    <span class="inline-block bg-gray-700 px-2 py-1 rounded mr-2 mb-1">Type: ${func.type.replace('_', ' ')}</span>
                    ${func.parameters ? `<span class="inline-block bg-gray-700 px-2 py-1 rounded mr-2 mb-1">${Object.keys(func.parameters.properties || {}).length} parameters</span>` : ''}
                    <span class="inline-block bg-gray-700 px-2 py-1 rounded mr-2 mb-1">Updated: ${new Date(func.updatedAt).toLocaleDateString()}</span>
                </div>
            `;

            // Make whole card clickable to toggle
            functionCard.addEventListener('click', () => this.toggleFunction(id));
            
            // Add event listeners for buttons (only for local functions)
            const editButton = functionCard.querySelector('.edit-function');
            const deleteButton = functionCard.querySelector('.delete-function');
            
            if (editButton) {
                editButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editFunction(id);
                });
            }
            
            if (deleteButton) {
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteFunction(id);
                });
            }

            this.elements.functionsList.appendChild(functionCard);
        });
        
        this.updateFunctionStatusIndicators();
    }


    showFunctionEditor(functionId = null) {
        const existingFunction = functionId ? this.functions.get(functionId) : null;
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-fractal-gray p-6 rounded-lg border border-gray-600 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 class="text-lg font-semibold mb-6 flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flex-shrink-0">
                        <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z"></path>
                        <path d="M12 22V12"></path>
                        <path d="M22 8.5L12 12L2 8.5"></path>
                    </svg>
                    <span>${existingFunction ? 'Edit Function' : 'Add New Function'}</span>
                </h3>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Basic Information -->
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Function Name</label>
                            <input type="text" id="funcName" class="w-full p-3 bg-fractal-dark border border-gray-500 rounded text-white" 
                                   value="${existingFunction?.name || ''}" placeholder="e.g., web_search">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Description</label>
                            <textarea id="funcDescription" class="w-full p-3 bg-fractal-dark border border-gray-500 rounded text-white h-24 resize-none" 
                                      placeholder="Describe what this function does">${existingFunction?.description || ''}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Function Type</label>
                            <select id="funcType" class="w-full p-3 bg-fractal-dark border border-gray-500 rounded text-white">
                                <option value="web_search" ${existingFunction?.type === 'web_search' ? 'selected' : ''}>Web Search</option>
                                <option value="file_operations" ${existingFunction?.type === 'file_operations' ? 'selected' : ''}>File Operations</option>
                                <option value="calculations" ${existingFunction?.type === 'calculations' ? 'selected' : ''}>Mathematical Calculations</option>
                                <option value="api_calls" ${existingFunction?.type === 'api_calls' ? 'selected' : ''}>API Integration</option>
                                <option value="custom" ${existingFunction?.type === 'custom' ? 'selected' : ''}>Custom</option>
                            </select>
                        </div>
                        
                        <div class="flex items-center gap-3 p-3 bg-fractal-dark rounded-lg">
                            <input type="checkbox" id="funcEnabled" ${existingFunction?.enabled !== false ? 'checked' : ''} class="w-4 h-4 text-fractal-blue bg-fractal-dark border-gray-500 rounded focus:ring-fractal-blue">
                            <label for="funcEnabled" class="text-sm font-medium">Enable this function</label>
                        </div>
                        
                        <div class="flex items-center gap-3 p-3 bg-fractal-dark rounded-lg">
                            <input type="checkbox" id="hasJavaScript" ${existingFunction?.jsCode ? 'checked' : ''} class="w-4 h-4 text-fractal-blue bg-fractal-dark border-gray-500 rounded focus:ring-fractal-blue">
                            <label for="hasJavaScript" class="text-sm font-medium">Include JavaScript execution code</label>
                        </div>
                    </div>
                    
                    <!-- Parameters & Code -->
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Parameters (JSON Schema)</label>
                            <textarea id="funcParameters" class="w-full p-3 bg-fractal-dark border border-gray-500 rounded text-white h-32 font-mono text-sm resize-none" 
                                      placeholder='{"type": "object", "properties": {"query": {"type": "string", "description": "Search query"}}}'>${existingFunction?.parameters ? JSON.stringify(existingFunction.parameters, null, 2) : ''}</textarea>
                        </div>
                        
                        <div id="jsCodeSection" class="${existingFunction?.jsCode ? '' : 'hidden'}">
                            <label class="block text-sm font-medium mb-2 flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="flex-shrink-0">
                                    <polyline points="16 18 22 12 16 6"></polyline>
                                    <polyline points="8 6 2 12 8 18"></polyline>
                                </svg>
                                JavaScript Code (Optional)
                            </label>
                            <textarea id="funcJsCode" class="w-full p-3 bg-fractal-dark border border-gray-500 rounded text-white h-40 font-mono text-sm resize-none" 
                                      placeholder="// Function execution code
function executeFunction(parameters) {
  // Your JavaScript code here
  // Return result or throw error
  return { success: true, result: 'Hello World' };
}">${existingFunction?.jsCode || ''}</textarea>
                            <p class="text-xs text-gray-400 mt-2">This code will be saved to /functions/scripts/${existingFunction?.name || 'function'}.js and can be executed by the AI agent.</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-600">
                    <button id="cancelFunc" class="btn-secondary px-6 py-2">Cancel</button>
                    <button id="saveFunc" class="btn-secondary bg-blue-600 hover:bg-blue-700 px-6 py-2">Save Function</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('#cancelFunc').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#saveFunc').addEventListener('click', () => {
            this.saveFunction(functionId, modal);
        });

        // Toggle JavaScript code section
        modal.querySelector('#hasJavaScript').addEventListener('change', (e) => {
            const jsCodeSection = modal.querySelector('#jsCodeSection');
            if (e.target.checked) {
                jsCodeSection.classList.remove('hidden');
            } else {
                jsCodeSection.classList.add('hidden');
            }
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    saveFunction(functionId, modal) {
        try {
            const name = modal.querySelector('#funcName').value.trim();
            const description = modal.querySelector('#funcDescription').value.trim();
            const type = modal.querySelector('#funcType').value;
            const parametersText = modal.querySelector('#funcParameters').value.trim();
            const enabled = modal.querySelector('#funcEnabled').checked;
            const hasJavaScript = modal.querySelector('#hasJavaScript').checked;
            const jsCode = hasJavaScript ? modal.querySelector('#funcJsCode').value.trim() : null;

            if (!name || !description) {
                alert('Name and description are required');
                return;
            }

            let parameters = null;
            if (parametersText) {
                try {
                    parameters = JSON.parse(parametersText);
                } catch (e) {
                    alert('Invalid JSON in parameters field');
                    return;
                }
            }

            const id = functionId || this.generateFunctionId();
            const functionData = {
                id,
                name,
                description,
                type,
                parameters,
                enabled,
                jsCode: jsCode || null,
                createdAt: functionId ? this.functions.get(functionId).createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save JavaScript file if code is provided
            if (jsCode) {
                this.saveFunctionJavaScript(id, name, jsCode).catch(error => {
                    console.error('Failed to save JavaScript file:', error);
                });
            }

            this.functions.set(id, functionData);
            this.saveFunctionSettings();
            this.renderFunctionsList();
            this.updateSidebarFunctionStatus();
            this.autoSaveProjectSettings(); // Auto-save to project
            
            document.body.removeChild(modal);
        } catch (error) {
            console.error('Error saving function:', error);
            alert('Error saving function: ' + error.message);
        }
    }

    generateFunctionId() {
        return 'func_' + Math.random().toString(36).substr(2, 9);
    }

    async saveFunctionJavaScript(functionId, functionName, jsCode) {
        try {
            const response = await fetch('/api/functions/script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    functionId,
                    functionName,
                    jsCode
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to save JavaScript file: ${response.status}`);
            }

            const result = await response.json();
            console.log('JavaScript file saved successfully:', result.filepath);
            return result;
        } catch (error) {
            console.error('Error saving JavaScript file:', error);
            throw error;
        }
    }

    toggleFunction(id) {
        const func = this.functions.get(id);
        if (func) {
            console.log(`Toggling function ${func.name} from ${func.enabled} to ${!func.enabled}`);
            func.enabled = !func.enabled;
            func.updatedAt = new Date().toISOString();
            
            // Save project-level toggle state for global functions
            if (func.isGlobal) {
                func.projectToggleState = func.enabled;
                this.saveProjectFunctionToggleState(id, func.enabled);
            }
            
            this.saveFunctionSettings();
            this.renderFunctionsList();
            this.updateSidebarFunctionStatus();
            this.autoSaveProjectSettings(); // Auto-save to project
            console.log(`Function ${func.name} is now ${func.enabled ? 'enabled' : 'disabled'}`);
        }
    }

    editFunction(id) {
        this.showFunctionEditor(id);
    }

    deleteFunction(id) {
        if (confirm('Are you sure you want to delete this function?')) {
            this.functions.delete(id);
            this.saveFunctionSettings();
            this.renderFunctionsList();
            this.updateSidebarFunctionStatus();
            this.autoSaveProjectSettings(); // Auto-save to project
        }
    }

    addFunctionFromTemplate(templateType) {
        // Check for existing function with same name to prevent duplicates
        const existingFunction = Array.from(this.functions.values()).find(func => func.type === templateType);
        if (existingFunction) {
            alert(`A ${templateType.replace('_', ' ')} function already exists. Each function type can only be added once.`);
            return;
        }

        const templates = {
            web_search: {
                name: 'web_search',
                description: 'Search the web for current information and return relevant results',
                type: 'web_search',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'The search query to execute'
                        },
                        num_results: {
                            type: 'number',
                            description: 'Number of results to return (default: 5)',
                            default: 5
                        }
                    },
                    required: ['query']
                }
            },
            file_operations: {
                name: 'file_operations',
                description: 'Read, write, and manipulate files on the system',
                type: 'file_operations',
                parameters: {
                    type: 'object',
                    properties: {
                        operation: {
                            type: 'string',
                            enum: ['read', 'write', 'append', 'delete', 'list'],
                            description: 'The file operation to perform'
                        },
                        path: {
                            type: 'string',
                            description: 'The file or directory path'
                        },
                        content: {
                            type: 'string',
                            description: 'Content to write (for write/append operations)'
                        }
                    },
                    required: ['operation', 'path']
                }
            },
            calculations: {
                name: 'mathematical_calculator',
                description: 'Perform complex mathematical calculations and data analysis',
                type: 'calculations',
                parameters: {
                    type: 'object',
                    properties: {
                        expression: {
                            type: 'string',
                            description: 'Mathematical expression to evaluate'
                        },
                        type: {
                            type: 'string',
                            enum: ['basic', 'statistical', 'algebraic', 'calculus'],
                            description: 'Type of calculation'
                        }
                    },
                    required: ['expression']
                }
            },
            api_calls: {
                name: 'api_integration',
                description: 'Make calls to external APIs and process responses',
                type: 'api_calls',
                parameters: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'API endpoint URL'
                        },
                        method: {
                            type: 'string',
                            enum: ['GET', 'POST', 'PUT', 'DELETE'],
                            description: 'HTTP method'
                        },
                        headers: {
                            type: 'object',
                            description: 'Request headers'
                        },
                        data: {
                            type: 'object',
                            description: 'Request payload'
                        }
                    },
                    required: ['url', 'method']
                }
            }
        };

        const template = templates[templateType];
        if (template) {
            const id = this.generateFunctionId();
            const functionData = {
                ...template,
                id,
                enabled: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.functions.set(id, functionData);
            this.saveFunctionSettings();
            this.renderFunctionsList();
            this.updateSidebarFunctionStatus();
            this.autoSaveProjectSettings(); // Auto-save to project
        }
    }

    updateSidebarFunctionStatus() {
        const enabledCount = Array.from(this.functions.values()).filter(func => func.enabled).length;
        const totalCount = this.functions.size;
        
        if (totalCount === 0) {
            this.elements.functionsCount.textContent = 'No functions configured';
            // Remove any existing function list
            const existingList = document.getElementById('sidebarFunctionsList');
            if (existingList) {
                existingList.remove();
            }
        } else {
            this.elements.functionsCount.textContent = `${enabledCount}/${totalCount} functions enabled`;
            this.renderSidebarFunctionsList();
        }
    }

    renderSidebarFunctionsList() {
        // Remove existing list if it exists
        const existingList = document.getElementById('sidebarFunctionsList');
        if (existingList) {
            existingList.remove();
        }

        // Create new function list for sidebar
        const functionsStatusDiv = document.getElementById('functionsStatus');
        const functionsList = document.createElement('div');
        functionsList.id = 'sidebarFunctionsList';
        functionsList.className = 'space-y-2 mt-3';

        this.functions.forEach((func, id) => {
            const functionItem = document.createElement('div');
            functionItem.className = 'flex items-center justify-between p-2 bg-fractal-dark/30 rounded border border-gray-600/30 hover:border-gray-500/50 transition-colors cursor-pointer';
            
            functionItem.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <input type="checkbox" ${func.enabled ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1" readonly>
                        <div class="absolute inset-0 pointer-events-none">
                            ${func.enabled ? 
                                '<svg class="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : 
                                ''
                            }
                        </div>
                    </div>
                    <span class="text-xs font-medium text-gray-300">${func.name}</span>
                </div>
                <div class="text-xs px-2 py-1 rounded ${func.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}">${func.enabled ? 'ON' : 'OFF'}</div>
            `;

            // Make the whole item clickable to toggle
            functionItem.addEventListener('click', () => {
                this.toggleFunction(id);
            });

            functionsList.appendChild(functionItem);
        });

        // Insert the functions list after the functionsCount div
        const countDiv = functionsStatusDiv.querySelector('div');
        if (countDiv) {
            countDiv.parentNode.insertBefore(functionsList, countDiv.nextSibling);
        } else {
            functionsStatusDiv.appendChild(functionsList);
        }
    }

    async exportFunctions() {
        const functionsData = {
            version: '1.0',
            exported_at: new Date().toISOString(),
            functions: Array.from(this.functions.values()),
            settings: {
                functionsEnabled: this.functionsEnabled
            }
        };

        // Save to server as well
        try {
            await Promise.all(
                functionsData.functions.map(func => 
                    fetch('/api/functions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(func)
                    })
                )
            );
        } catch (error) {
            console.warn('Failed to sync functions to server:', error);
        }

        const blob = new Blob([JSON.stringify(functionsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fractal_functions_${new Date().toISOString().split('T')[0]}.func`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importFunctions(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.functions) {
                    const importedFunctions = [];
                    
                    for (const func of data.functions) {
                        func.id = this.generateFunctionId(); // Generate new IDs to avoid conflicts
                        func.updatedAt = new Date().toISOString();
                        this.functions.set(func.id, func);
                        importedFunctions.push(func);
                    }

                    // Sync to server
                    try {
                        await Promise.all(
                            importedFunctions.map(func => 
                                fetch('/api/functions', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(func)
                                })
                            )
                        );
                    } catch (error) {
                        console.warn('Failed to sync imported functions to server:', error);
                    }

                    if (data.settings && data.settings.functionsEnabled !== undefined) {
                        this.functionsEnabled = data.settings.functionsEnabled;
                        this.elements.functionsEnabled.checked = this.functionsEnabled;
                    }

                    this.saveFunctionSettings();
                    this.renderFunctionsList();
                    this.updateSidebarFunctionStatus();
                    this.updateFunctionCounts();
                    alert(`Successfully imported ${data.functions.length} functions`);
                } else {
                    alert('Invalid function configuration file');
                }
            } catch (error) {
                console.error('Error importing functions:', error);
                alert('Error importing functions: ' + error.message);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    renderMarkdown(text) {
        if (!text) return '';
        
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Basic markdown formatting that works
        
        // Code blocks first (before other processing)
        html = html.replace(/```([^`]*?)```/g, '<pre style="background:#2d3748;color:#68d391;padding:8px;border-radius:4px;margin:8px 0;overflow-x:auto;">$1</pre>');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code style="background:#4a5568;color:#63b3ed;padding:2px 4px;border-radius:3px;">$1</code>');
        
        // Headers (process from most specific to least specific to avoid conflicts)
        html = html.replace(/^#### (.+)$/gm, '<h4 style="font-size:14px;font-weight:bold;color:#f7fafc;margin:6px 0 3px;">$1</h4>');
        html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:bold;color:#f7fafc;margin:8px 0 4px;">$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:bold;color:#f7fafc;margin:10px 0 5px;">$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:bold;color:#f7fafc;margin:12px 0 6px;">$1</h1>');
        
        // Bold
        html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong style="font-weight:bold;">$1</strong>');
        
        // Italic  
        html = html.replace(/\*([^\*]+)\*/g, '<em style="font-style:italic;">$1</em>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#4299e1;text-decoration:underline;" target="_blank">$1</a>');
        
        // Lists
        html = html.replace(/^- (.+)$/gm, '• $1');
        html = html.replace(/^\* (.+)$/gm, '• $1');
        
        // Line breaks
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }

    updateStatus(message) {
        if (this.elements.statusDisplay) {
            this.elements.statusDisplay.textContent = message;
        }
        console.log('Status:', message);
    }

    showLoading(show) {
        this.elements.loadingOverlay.classList.toggle('hidden', !show);
    }

    // Project Management Methods
    async createNewProject() {
        const projectName = prompt('Enter project name:');
        if (!projectName || !projectName.trim()) return;
        
        const projectId = Date.now().toString();
        const newProject = {
            id: projectId,
            name: projectName.trim(),
            createdAt: new Date().toISOString(),
            messages: [],
            functions: Array.from(this.functions.values())
        };
        
        // Save current project first
        await this.saveCurrentProject();
        
        // Switch to new project
        this.currentProject = newProject;
        this.messages = [];
        this.clearChat();
        this.updateProjectUI();
        this.updateProjectInfo(`Created new project: ${projectName}`);
        
        // Load available projects
        await this.loadProjects();
    }

    async toggleProjectDropdown() {
        const isHidden = this.elements.projectDropdownMenu.classList.contains('hidden');
        
        if (isHidden) {
            await this.loadProjects();
            this.elements.projectDropdownMenu.classList.remove('hidden');
            this.elements.projectDropdownArrow.style.transform = 'rotate(180deg)';
        } else {
            this.elements.projectDropdownMenu.classList.add('hidden');
            this.elements.projectDropdownArrow.style.transform = '';
        }
    }

    async loadProjects() {
        try {
            console.log('Loading projects from /api/projects'); // Debug
            const response = await fetch('/api/projects');
            const data = await response.json();
            
            console.log('Loaded projects:', data); // Debug
            this.projects = data || [];
            this.renderProjectsList();
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.updateProjectInfo('Failed to load projects');
        }
    }

    renderProjectsList() {
        const projectList = this.elements.projectList;
        
        if (this.projects.length === 0) {
            projectList.innerHTML = '<div class="px-3 py-2 text-xs text-gray-400">No saved projects</div>';
            return;
        }
        
        projectList.innerHTML = this.projects.map(project => `
            <button class="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center justify-between ${project.id === this.currentProject.id ? 'bg-fractal-blue' : ''}" 
                    data-project-id="${project.id}" onclick="window.fractalEngine.switchToProject('${project.id}')">
                <div>
                    <div class="font-medium">${this.escapeHtml(project.name)}</div>
                    <div class="text-xs text-gray-400">${new Date(project.createdAt).toLocaleDateString()}</div>
                </div>
                ${project.id === this.currentProject.id ? '<span class="text-xs text-fractal-blue">✓</span>' : ''}
            </button>
        `).join('');
    }

    async switchToProject(projectId) {
        if (projectId === this.currentProject.id) {
            this.elements.projectDropdownMenu.classList.add('hidden');
            return;
        }
        
        try {
            // Save current project first
            await this.saveCurrentProject();
            
            // Load the selected project
            const response = await fetch(`/api/chats/${projectId}`);
            const projectData = await response.json();
            
            this.currentProject = {
                id: projectId,
                name: projectData.name,
                createdAt: projectData.createdAt
            };
            
            // Load project data
            this.messages = projectData.messages || [];
            if (projectData.functions) {
                this.functions.clear();
                projectData.functions.forEach(func => this.functions.set(func.id, func));
                this.renderFunctionsList();
                this.updateFunctionCounts();
            }
            
            // Update UI
            this.clearChat();
            this.loadMessagesIntoUI();
            this.updateProjectUI();
            this.elements.projectDropdownMenu.classList.add('hidden');
            this.updateProjectInfo(`Loaded project: ${projectData.name}`);
            
        } catch (error) {
            console.error('Failed to switch project:', error);
            this.updateProjectInfo('Failed to load project');
        }
    }

    loadMessagesIntoUI() {
        console.log('loadMessagesIntoUI called, messages count:', this.messages.length); // Debug
        console.log('chatMessages element:', this.elements.chatMessages); // Debug
        
        this.elements.chatMessages.innerHTML = '';
        this.messages.forEach((message, index) => {
            console.log(`Loading message ${index}:`, message); // Debug
            if (message.type === 'user') {
                this.displayUserMessage(message.content);
            } else if (message.type === 'assistant') {
                this.displayAssistantMessage(message.content);
            }
        });
        
        // Ensure welcome screen is hidden if there are messages
        if (this.messages.length > 0) {
            console.log('Hiding welcome screen due to messages'); // Debug
            this.hideWelcomeScreen();
        } else {
            console.log('Showing welcome screen - no messages'); // Debug
            this.showWelcomeScreen();
        }
    }

    displayUserMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble user';
                messageDiv.style = `background:rgba(24, 26, 31, 0.5);`

        const header = document.createElement('div');
        header.className = 'font-semibold mb-2 text-fractal-blue';
        header.textContent = 'You';
        
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = this.renderMarkdown(content);
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(contentDiv);
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        return messageDiv;
    }

    displayAssistantMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-bubble agent';
                messageDiv.style = `background:rgba(0,0,0,0);`

        const header = document.createElement('div');
        header.className = 'font-semibold mb-2 text-fractal-green';
        header.textContent = 'Fractal Engine Response';
        
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = this.renderMarkdown(content);
        
        messageDiv.appendChild(header);
        messageDiv.appendChild(contentDiv);
        
        this.elements.chatMessages.appendChild(messageDiv);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        
        return messageDiv;
    }

    getCurrentChatSettings() {
        return {
            depth: this.elements.depthSlider ? parseInt(this.elements.depthSlider.value) : 3,
            length: this.elements.lengthSlider ? parseInt(this.elements.lengthSlider.value) : 3,
            modifier: this.getCurrentModifier(),
            functionsEnabled: this.elements.functionsEnabled ? this.elements.functionsEnabled.checked : false,
            quantumEnabled: this.quantumEnabled || false,
            quantumExecutions: this.quantumExecutions || 3
        };
    }

    // Debounced auto-save for chat settings to avoid too many API calls
    autoSaveChatSettings() {
        if (this.chatSettingsSaveTimeout) {
            clearTimeout(this.chatSettingsSaveTimeout);
        }
        
        this.chatSettingsSaveTimeout = setTimeout(async () => {
            if (this.currentChat && this.currentChat.id) {
                try {
                    await this.saveCurrentChat();
                    console.log('Auto-saved chat settings'); // Debug
                } catch (error) {
                    console.error('Failed to auto-save chat settings:', error);
                }
            }
        }, 1000); // Save after 1 second of no changes
    }

    startAgentStreaming() {
        if (!this.sessionId) return;
        
        // Close existing connection if any
        if (this.eventSource) {
            this.eventSource.close();
        }
        
        // Start new SSE connection
        this.eventSource = new EventSource(`/api/stream/${this.sessionId}`);
        
        this.eventSource.onopen = () => {
            console.log('Agent streaming connected');
            this.addTerminalLog('🔗 Live agent updates connected', 'success');
        };
        
        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleAgentStreamEvent(data);
            } catch (error) {
                console.error('Error parsing SSE data:', error);
            }
        };
        
        this.eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
            this.addTerminalLog('❌ Live updates connection lost', 'error');
        };
    }

    handleAgentStreamEvent(data) {
        switch (data.type) {
            case 'connected':
                console.log('SSE connected to session:', data.sessionId);
                break;
                
            case 'agent_start':
                this.addTerminalLog(`🚀 Layer ${data.layer} Agent ${data.agentId} started: ${data.task}`, 'agent');
                break;
                
            case 'agent_complete':
                this.addTerminalLog(`✅ Layer ${data.layer} Agent ${data.agentId} completed: ${data.task}`, 'success');
                if (data.response) {
                    this.addTerminalLog(`   └── ${data.response}`, 'info');
                }
                break;
                
            default:
                console.log('Unknown SSE event:', data);
        }
    }

    stopAgentStreaming() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.addTerminalLog('🔌 Live agent updates disconnected', 'warning');
        }
    }

    async saveCurrentChat() {
        if (!this.currentChat || !this.currentChat.id) return;
        
        try {
            const chatData = {
                id: this.currentChat.id,
                goal: this.currentChat.goal,
                createdAt: this.currentChat.createdAt,
                messages: this.messages,
                sessionId: this.sessionId,
                settings: this.getCurrentChatSettings(),
                consoleLogs: this.chatExecutionLogs.has(this.currentChat.id) ? this.chatExecutionLogs.get(this.currentChat.id) : [],
                streamLogs: this.chatStreamLogs.has(this.currentChat.id) ? this.chatStreamLogs.get(this.currentChat.id) : []
            };
            
            console.log('Saving chat:', chatData); // Debug
            
            const response = await fetch(`/api/chats/${this.currentChat.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chatData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save chat: ${response.status} - ${errorText}`);
            }
            
            console.log('Chat saved successfully'); // Debug
        } catch (error) {
            console.error('Failed to save chat:', error);
            throw error; // Re-throw to handle in calling function
        }
    }

    async saveCurrentProject() {
        if (!this.currentProject || !this.currentProject.id) return;
        
        try {
            // Save current chat first
            if (this.currentChat) {
                await this.saveCurrentChat();
            }
            
            const projectData = {
                id: this.currentProject.id,
                name: this.currentProject.name,
                createdAt: this.currentProject.createdAt || new Date().toISOString(),
                functions: Array.from(this.functions.values()),
                settings: {
                    depth: this.elements.depthSlider ? parseInt(this.elements.depthSlider.value) : 3,
                    length: this.elements.lengthSlider ? parseInt(this.elements.lengthSlider.value) : 3,
                    modifier: this.getCurrentModifier(),
                    functionsEnabled: (this.elements.functionsEnabled && this.elements.functionsEnabled.checked) || false,
                    quantumEnabled: (this.elements.quantumEnabled && this.elements.quantumEnabled.checked) || false,
                    quantumExecutions: this.quantumExecutions || 3
                }
            };
            
            const response = await fetch(`/api/projects/${this.currentProject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });
            
            if (!response.ok) throw new Error('Failed to save project');
            
            this.updateProjectInfo('Project saved successfully');
        } catch (error) {
            console.error('Failed to save project:', error);
            this.updateProjectInfo('Failed to save project');
        }
    }

    async deleteCurrentProject() {
        if (!this.currentProject.id || this.currentProject.id === 'default') {
            this.updateProjectInfo('Cannot delete default project');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete "${this.currentProject.name}"?`)) return;
        
        try {
            const response = await fetch(`/api/chats/${this.currentProject.id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete project');
            
            // Switch back to default project
            this.currentProject = { id: 'default', name: 'Default Chat' };
            this.messages = [];
            this.clearChat();
            this.updateProjectUI();
            this.updateProjectInfo('Project deleted');
            
            // Reload projects list
            await this.loadProjects();
        } catch (error) {
            console.error('Failed to delete project:', error);
            this.updateProjectInfo('Failed to delete project');
        }
    }

    updateProjectUI() {
        this.elements.currentProjectName.textContent = this.currentProject.name;
        this.elements.selectedProject.textContent = this.currentProject.name;
    }

    updateProjectInfo(message) {
        if (this.elements.projectInfo) {
            this.elements.projectInfo.textContent = message;
            setTimeout(() => {
                if (this.elements.projectInfo) {
                    this.elements.projectInfo.textContent = 'Ready to manage projects';
                }
            }, 3000);
        }
        console.log('Project Info:', message); // Log to console as backup
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Project Export/Import Methods
    async exportProject() {
        const projectName = prompt('Enter project name for export:', `${this.currentProject.name}_Export`);
        if (!projectName || !projectName.trim()) return;
        
        try {
            // Save current project first
            await this.saveCurrentProject();
            
            // Prepare export data
            const exportData = {
                name: projectName.trim(),
                chatIds: [this.currentProject.id],
                includeAllFunctions: true
            };
            
            const response = await fetch('/api/export-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exportData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Download the exported project file
                const downloadUrl = result.downloadUrl;
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = result.file;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                alert(`Project exported successfully as ${result.file}`);
            } else {
                throw new Error('Failed to export project');
            }
        } catch (error) {
            console.error('Failed to export project:', error);
            alert('Failed to export project: ' + error.message);
        }
    }

    async importProject(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const decompile = this.elements.decompileProject.checked;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                
                if (!projectData || !projectData.chats) {
                    alert('Invalid project file format');
                    return;
                }
                
                const response = await fetch('/api/import-project', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectData, decompile })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const { chatsImported, functionsImported, errors } = result.results;
                    
                    let message = `Successfully imported:\n- ${chatsImported} chat project(s)\n- ${functionsImported} function(s)`;
                    
                    if (errors.length > 0) {
                        message += `\n\nWarnings:\n${errors.join('\n')}`;
                    }
                    
                    alert(message);
                    
                    // Reload projects and functions
                    await this.loadProjects();
                    await this.loadServerFunctions();
                    this.renderFunctionsList();
                    this.updateFunctionCounts();
                } else {
                    throw new Error('Failed to import project');
                }
            } catch (error) {
                console.error('Error importing project:', error);
                alert('Error importing project: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        // Reset file input
        event.target.value = '';
    }

    async loadServerFunctions() {
        try {
            const response = await fetch('/api/functions');
            const serverFunctions = await response.json();
            
            // Merge server functions with local functions (server takes precedence)
            serverFunctions.forEach(func => {
                this.functions.set(func.id, func);
            });
            
        } catch (error) {
            console.warn('Failed to load functions from server:', error);
        }
    }

    // Startup Modal Methods
    async showStartupModal() {
        this.elements.startupModal.style.display = 'flex';
        this.elements.mainApp.style.display = 'none';
        await this.loadExistingProjects();
    }

    hideStartupModal() {
        console.log('hideStartupModal called'); // Debug
        console.log('startupModal element:', this.elements.startupModal); // Debug
        console.log('mainApp element:', this.elements.mainApp); // Debug
        
        if (this.elements.startupModal) {
            this.elements.startupModal.style.display = 'none';
            console.log('Startup modal hidden'); // Debug
        }
        
        if (this.elements.mainApp) {
            this.elements.mainApp.style.display = 'flex';
            console.log('Main app shown'); // Debug
        }
        
        this.showTab('chat');
        console.log('Chat tab activated'); // Debug
        
        // Show welcome screen if no messages exist - with slight delay to ensure everything is loaded
        setTimeout(() => {
            if (!this.messages || this.messages.length === 0) {
                console.log('Showing welcome screen after modal close'); // Debug
                this.showWelcomeScreen();
            }
        }, 100);
    }

    async loadExistingProjects() {
        try {
            console.log('Loading existing projects for startup modal'); // Debug
            const response = await fetch('/api/projects');
            const data = await response.json();
            console.log('Startup modal projects loaded:', data); // Debug
            this.projects = data || [];
            this.renderStartupProjectsList();
        } catch (error) {
            console.error('Failed to load existing projects:', error);
            this.elements.existingProjectsList.innerHTML = '<div class="text-sm text-red-400 text-center py-4">Failed to load projects</div>';
        }
    }

    renderStartupProjectsList() {
        if (this.projects.length === 0) {
            this.elements.existingProjectsList.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">No projects found</div>';
            return;
        }

        this.elements.existingProjectsList.innerHTML = this.projects.map(project => `
            <div class="project-item p-2 bg-fractal-dark border border-gray-600 rounded cursor-pointer hover:border-fractal-blue hover:bg-gray-700 transition-colors" data-project-id="${project.id}">
                <div class="text-sm text-white font-medium">${this.escapeHtml(project.name)}</div>
                <div class="text-xs text-gray-400 mt-1">${new Date(project.createdAt).toLocaleDateString()}</div>
            </div>
        `).join('');

        // Add click listeners to load projects directly
        this.elements.existingProjectsList.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', async () => {
                const projectId = item.dataset.projectId;
                await this.loadProjectById(projectId);
            });
        });
    }

    async loadProjectById(projectId) {
        try {
            console.log('Loading project ID:', projectId); // Debug
            
            // Load project data from projects API
            const response = await fetch(`/api/projects/${projectId}`);
            console.log('Load project response status:', response.status); // Debug
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Load project error:', errorText);
                throw new Error(`Failed to load project: ${response.status} ${errorText}`);
            }
            
            const projectData = await response.json();
            console.log('Loaded project data:', projectData); // Debug

            // Set current project
            this.currentProject = {
                id: projectId,
                name: projectData.metadata.name,
                createdAt: projectData.metadata.createdAt,
                settings: projectData.settings || {}
            };

            // Clear current chat and messages
            this.currentChat = null;
            this.messages = [];
            this.sessionId = null;

            // Load project functions if available
            if (projectData.functions) {
                this.functions.clear();
                projectData.functions.forEach(func => this.functions.set(func.id, func));
                this.renderFunctionsList();
                this.updateSidebarFunctionStatus();
            }

            // Apply project settings
            if (projectData.settings) {
                // Apply fractal settings
                if (this.elements.depthSlider && projectData.settings.depth !== undefined) {
                    this.elements.depthSlider.value = projectData.settings.depth;
                    this.elements.depthValue.textContent = projectData.settings.depth;
                }
                if (this.elements.lengthSlider && projectData.settings.length !== undefined) {
                    this.elements.lengthSlider.value = projectData.settings.length;
                    this.elements.lengthValue.textContent = projectData.settings.length;
                }
                
                // Apply modifier setting
                if (projectData.settings.modifier) {
                    this.selectModifier(projectData.settings.modifier);
                }
                
                // Apply quantum settings
                if (this.elements.quantumEnabled && typeof projectData.settings.quantumEnabled === 'boolean') {
                    this.elements.quantumEnabled.checked = projectData.settings.quantumEnabled;
                    this.quantumEnabled = projectData.settings.quantumEnabled;
                }
                if (this.elements.quantumSlider && projectData.settings.quantumExecutions !== undefined) {
                    this.elements.quantumSlider.value = projectData.settings.quantumExecutions;
                    this.quantumExecutions = projectData.settings.quantumExecutions;
                    if (this.elements.quantumValue) {
                        this.elements.quantumValue.textContent = projectData.settings.quantumExecutions;
                    }
                }
                
                // Apply functions setting
                if (this.elements.functionsEnabled && typeof projectData.settings.functionsEnabled === 'boolean') {
                    this.elements.functionsEnabled.checked = projectData.settings.functionsEnabled;
                    this.functionsEnabled = projectData.settings.functionsEnabled;
                }
                
                // Update UI elements
                this.updateAgentCount();
                this.updateModifierPreview();
                this.updateQuantumSettings();
            }

            // Load chats for this project
            await this.loadProjectChats();

            // If there are chats, automatically select the first one
            if (this.chats && this.chats.length > 0) {
                console.log('Auto-selecting first chat:', this.chats[0].id); // Debug
                await this.switchToChat(this.chats[0].id);
            }

            // Hide modal and update UI
            this.hideStartupModal();
            this.updateProjectTitle();
            
            if (!this.currentChat) {
                this.showWelcomeScreen(); // Show welcome screen if no chat is selected
            }
            
            console.log('Project loaded successfully'); // Debug

        } catch (error) {
            console.error('Failed to load project:', error);
            alert('Failed to load project: ' + error.message);
        }
    }

    async createProjectFromModal() {
        console.log('=== createProjectFromModal called ==='); // Debug log
        
        const nameElement = document.getElementById('newProjectName');
        const goalElement = document.getElementById('newProjectGoal');
        
        if (!nameElement || !goalElement) {
            console.error('Project form elements not found');
            return;
        }
        
        const name = nameElement.value.trim();
        const goal = goalElement.value.trim();
        
        console.log('Project name:', name, 'Goal:', goal); // Debug log
        
        if (!name) {
            alert('Please enter a project name');
            return;
        }

        try {
            console.log('Sending request to /api/projects...'); // Debug
            // Create project first
            const projectResponse = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    description: goal || 'General assistance'
                })
            });

            console.log('Project response status:', projectResponse.status); // Debug
            
            if (!projectResponse.ok) {
                const errorText = await projectResponse.text();
                console.error('Project creation error:', errorText);
                throw new Error(`Server responded with ${projectResponse.status}: ${errorText}`);
            }
            
            const projectData = await projectResponse.json();
            console.log('Project created:', projectData); // Debug

            // Set current project
            this.currentProject = {
                id: projectData.id,
                name: name,
                createdAt: projectData.createdAt
            };

            // If goal is provided, create initial chat
            let chatData = null;
            if (goal) {
                console.log('Creating initial chat...'); // Debug
                const chatResponse = await fetch('/api/chats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: `Chat - ${goal}`,
                        goal: goal,
                        projectId: projectData.id
                    })
                });

                if (chatResponse.ok) {
                    chatData = await chatResponse.json();
                    console.log('Initial chat created:', chatData); // Debug

                    this.currentChat = {
                        id: chatData.chatId,
                        goal: goal,
                        createdAt: chatData.createdAt
                    };

                    this.sessionId = chatData.sessionId;
                }
            }

            this.messages = [];

            // Clear form
            nameElement.value = '';
            goalElement.value = '';

            // Load project chats
            await this.loadProjectChats();

            // Set goal input if provided
            if (goal && this.elements.goalInput) {
                this.elements.goalInput.value = goal;
            }

            console.log('About to hide startup modal and show main UI'); // Debug
            this.hideStartupModal();
            this.updateProjectTitle();
            
            // Force show the main application
            const mainApp = document.querySelector('.min-h-screen.bg-fractal-dark');
            if (mainApp) {
                mainApp.style.display = 'block';
                console.log('Main app made visible'); // Debug
            }
            
            if (chatData) {
                this.showWelcomeScreen(); // Show welcome until messages are sent
                console.log('Showing welcome screen with chat'); // Debug
            } else {
                this.showWelcomeScreen(); // Show welcome until a chat is created
                console.log('Showing welcome screen without chat'); // Debug
            }
            
            console.log('Project created successfully:', this.currentProject);
            console.log('UI should now be visible'); // Debug
            
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project: ' + error.message);
        }
    }

    async loadSelectedProject() {
        const selectedItem = this.elements.existingProjectsList.querySelector('.project-item.border-blue-500');
        if (!selectedItem) {
            alert('Please select a project to load');
            return;
        }

        const projectId = selectedItem.dataset.projectId;
        try {
            const response = await fetch(`/api/chats/${projectId}`);
            const projectData = await response.json();

            this.currentProject = {
                id: projectId,
                name: projectData.name,
                createdAt: projectData.createdAt,
                goal: projectData.goal
            };

            // Load project data
            this.messages = projectData.messages || [];
            if (projectData.functions) {
                this.functions.clear();
                projectData.functions.forEach(func => this.functions.set(func.id, func));
                this.renderFunctionsList();
                this.updateFunctionCounts();
            }

            // Set goal if available
            if (projectData.goal) {
                this.elements.goalInput.value = projectData.goal;
            }

            // Load messages and hide modal
            this.hideStartupModal();
            this.loadMessagesIntoUI();
            this.updateProjectTitle();

        } catch (error) {
            console.error('Failed to load project:', error);
            alert('Failed to load project: ' + error.message);
        }
    }

    async importProjectFromStartup(event) {
        const file = event.target.files[0];
        if (!file) return;

        const decompile = this.elements.decompileProjectStartup.checked;
        
        // Use the existing import project logic
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                
                if (!projectData || !projectData.chats) {
                    alert('Invalid project file format');
                    return;
                }
                
                const response = await fetch('/api/import-project', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectData, decompile })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const { chatsImported, functionsImported, errors } = result.results;
                    
                    let message = `Successfully imported:\n- ${chatsImported} chat project(s)\n- ${functionsImported} function(s)`;
                    
                    if (errors.length > 0) {
                        message += `\n\nWarnings:\n${errors.join('\n')}`;
                    }
                    
                    alert(message);
                    
                    // Reload projects list
                    await this.loadExistingProjects();
                } else {
                    throw new Error('Failed to import project');
                }
            } catch (error) {
                console.error('Error importing project:', error);
                alert('Error importing project: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    }

    // File Menu Methods
    toggleFileMenu() {
        this.elements.fileMenuDropdown.classList.toggle('hidden');
    }

    updateProjectTitle() {
        if (this.elements.currentProjectTitle) {
            this.elements.currentProjectTitle.textContent = this.currentProject.name;
        }
    }


    async loadProjectChats() {
        if (!this.currentProject) {
            this.elements.chatsList.innerHTML = '<div class="text-xs text-gray-500 p-2 text-center">No project loaded</div>';
            return;
        }

        try {
            console.log('Loading chats for project:', this.currentProject.id); // Debug
            const response = await fetch(`/api/projects/${this.currentProject.id}/chats`);
            
            if (!response.ok) {
                throw new Error(`Failed to load chats: ${response.status}`);
            }
            
            const chats = await response.json();
            console.log('Loaded chats:', chats); // Debug
            this.chats = chats;
            this.renderChatsList();
            
        } catch (error) {
            console.error('Failed to load project chats:', error);
            this.elements.chatsList.innerHTML = '<div class="text-xs text-red-500 p-2 text-center">Failed to load chats</div>';
        }
    }

    renderChatsList() {
        if (this.chats.length === 0) {
            this.elements.chatsList.innerHTML = '<div class="text-xs text-gray-500 p-2 text-center">No chats in project</div>';
            return;
        }

        const chatsHTML = this.chats.map(chat => `
            <div class="chat-item p-2 bg-fractal-dark rounded text-xs cursor-pointer hover:bg-gray-700 ${chat.id === (this.currentChat && this.currentChat.id) ? 'border border-fractal-blue' : 'border border-transparent'}" 
                 data-chat-id="${chat.id}">
                <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-white truncate">${chat.goal || 'Untitled Chat'}</div>
                        <div class="text-gray-400 text-xs mt-1">
                            ${new Date(chat.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <button class="delete-chat-btn ml-2 text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-600" 
                            data-chat-id="${chat.id}" title="Delete Chat">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
        
        this.elements.chatsList.innerHTML = chatsHTML;
        
        // Add click listeners
        this.elements.chatsList.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't switch chat if clicking delete button
                if (e.target.closest('.delete-chat-btn')) {
                    return;
                }
                const chatId = item.dataset.chatId;
                this.switchToChat(chatId);
            });
        });
        
        // Add delete button listeners
        this.elements.chatsList.querySelectorAll('.delete-chat-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent chat selection
                const chatId = button.dataset.chatId;
                this.deleteChat(chatId);
            });
        });
    }

    async switchToChat(chatId) {
        try {
            console.log('Switching to chat:', chatId); // Debug
            
            // Save current chat if exists
            if (this.currentChat && this.messages.length > 0) {
                await this.saveCurrentChat();
            }
            
            // Load the selected chat
            const response = await fetch(`/api/chats/${chatId}`);
            if (!response.ok) {
                throw new Error(`Failed to load chat: ${response.status}`);
            }
            
            const chatData = await response.json();
            console.log('Loaded chat data:', chatData); // Debug
            
            // Set current chat
            this.currentChat = {
                id: chatId,
                goal: chatData.metadata.goal,
                createdAt: chatData.metadata.createdAt
            };
            
            // Set session ID and messages
            this.sessionId = chatData.metadata.sessionId;
            this.messages = chatData.messages || [];
            
            // Load console logs from saved chat data
            if (chatData.consoleLogs && Array.isArray(chatData.consoleLogs)) {
                this.chatExecutionLogs.set(chatId, chatData.consoleLogs);
            } else if (!this.chatExecutionLogs.has(chatId)) {
                this.chatExecutionLogs.set(chatId, []);
            }
            
            // Load streaming logs from saved chat data
            if (chatData.streamLogs && Array.isArray(chatData.streamLogs)) {
                this.chatStreamLogs.set(chatId, chatData.streamLogs);
            } else if (!this.chatStreamLogs.has(chatId)) {
                this.chatStreamLogs.set(chatId, []);
            }
            
            // Update UI
            this.loadMessagesIntoUI();
            this.renderChatsList(); // Refresh to show active chat
            
            // Load chat-specific console logs
            this.loadChatConsoleLog();
            
            // Load chat-specific stream logs
            this.loadChatStreamLogs();
            
            // Rebuild unified console sequence (combines streaming and execution logs chronologically)
            this.rebuildConsoleSequence();
            
            // Set goal input if available
            if (chatData.metadata.goal && this.elements.goalInput) {
                this.elements.goalInput.value = chatData.metadata.goal;
            }
            
            // Load and apply chat settings
            if (chatData.settings) {
                if (this.elements.depthSlider && chatData.settings.depth !== undefined) {
                    this.elements.depthSlider.value = chatData.settings.depth;
                    this.elements.depthValue.textContent = chatData.settings.depth;
                }
                if (this.elements.lengthSlider && chatData.settings.length !== undefined) {
                    this.elements.lengthSlider.value = chatData.settings.length;
                    this.elements.lengthValue.textContent = chatData.settings.length;
                }
                if (this.elements.quantumEnabled && typeof chatData.settings.quantumEnabled === 'boolean') {
                    this.elements.quantumEnabled.checked = chatData.settings.quantumEnabled;
                    this.quantumEnabled = chatData.settings.quantumEnabled;
                }
                if (this.elements.quantumSlider && chatData.settings.quantumExecutions !== undefined) {
                    this.elements.quantumSlider.value = chatData.settings.quantumExecutions;
                    this.elements.quantumValue.textContent = chatData.settings.quantumExecutions;
                    this.quantumExecutions = chatData.settings.quantumExecutions;
                }
                
                // Update modifier if available
                if (chatData.settings.modifier) {
                    const modifierRadio = document.querySelector(`input[name="modifier"][value="${chatData.settings.modifier}"]`);
                    if (modifierRadio) {
                        modifierRadio.checked = true;
                    }
                }
                
                // Update agent count and modifier preview
                this.updateAgentCount();
                this.updateModifierPreview();
                this.updateQuantumSettings();
            }
            
            console.log('Switched to chat successfully, messages loaded:', this.messages.length); // Debug
            
        } catch (error) {
            console.error('Failed to switch chat:', error);
            alert('Failed to load chat: ' + error.message);
        }
    }
    
    async deleteChat(chatId) {
        try {
            // Show confirmation dialog
            const chatToDelete = this.chats.find(chat => chat.id === chatId);
            const chatName = chatToDelete ? (chatToDelete.goal || 'Untitled Chat') : 'this chat';
            
            if (!confirm(`Are you sure you want to delete "${chatName}"? This action cannot be undone.`)) {
                return;
            }
            
            // Send delete request to server
            const response = await fetch(`/api/chats/${chatId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`Failed to delete chat: ${response.status}`);
            }
            
            // Remove from local arrays
            this.chats = this.chats.filter(chat => chat.id !== chatId);
            
            // Remove execution logs for this chat
            if (this.chatExecutionLogs.has(chatId)) {
                this.chatExecutionLogs.delete(chatId);
            }
            
            // If we deleted the current chat, switch to another or clear
            if (this.currentChat && this.currentChat.id === chatId) {
                if (this.chats.length > 0) {
                    // Switch to the first available chat
                    await this.switchToChat(this.chats[0].id);
                } else {
                    // No chats left, clear current chat
                    this.currentChat = null;
                    this.messages = [];
                    this.sessionId = null;
                    this.loadMessagesIntoUI();
                    this.loadChatConsoleLog();
                    this.showWelcomeScreen();
                }
            }
            
            // Refresh the chat list
            this.renderChatsList();
            
            console.log(`Chat ${chatId} deleted successfully`);
            
        } catch (error) {
            console.error('Failed to delete chat:', error);
            alert('Failed to delete chat: ' + error.message);
        }
    }

    renderSessionsList() {
        if (this.sessions.size === 0) {
            if (this.elements.sessionsList) {
                this.elements.sessionsList.innerHTML = '<div class="text-xs text-gray-500 p-2 text-center">No active sessions</div>';
            }
            return;
        }

        this.elements.sessionsList.innerHTML = Array.from(this.sessions.values()).map(session => `
            <div class="session-item p-2 bg-fractal-dark rounded text-xs cursor-pointer hover:bg-gray-700 ${session.id === this.sessionId ? 'border border-fractal-blue' : 'border border-transparent'}" 
                 data-session-id="${session.id}">
                <div class="font-medium truncate">${this.escapeHtml(session.goal)}</div>
                <div class="text-gray-400">${new Date(session.createdAt).toLocaleTimeString()}</div>
            </div>
        `).join('');

        // Add click listeners
        this.elements.sessionsList.querySelectorAll('.session-item').forEach(item => {
            item.addEventListener('click', () => {
                const sessionId = item.dataset.sessionId;
                this.switchSession(sessionId);
            });
        });
    }

    switchSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Save current session messages
        if (this.sessionId && this.sessions.has(this.sessionId)) {
            this.sessions.get(this.sessionId).messages = [...this.messages];
        }

        // Switch to new session
        this.sessionId = sessionId;
        this.messages = [...session.messages];
        this.loadMessagesIntoUI();
        this.renderSessionsList();
    }
}

// Removed copy function to fix layout issues

document.addEventListener('DOMContentLoaded', () => {
    window.fractalEngine = new FractalEngineUI();
});