class FractalEngineUI {
    constructor() {
        this.sessionId = null;
        this.currentTree = null;
        this.isProcessing = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateAgentCount();
        this.updateModifierPreview();
        
        // Initialize with chat tab active
        this.showTab('chat');
        
        // Using custom markdown parser
    }

    initializeElements() {
        this.elements = {
            goalInput: document.getElementById('goalInput'),
            newSessionBtn: document.getElementById('newSessionBtn'),
            depthSlider: document.getElementById('depthSlider'),
            lengthSlider: document.getElementById('lengthSlider'),
            depthValue: document.getElementById('depthValue'),
            lengthValue: document.getElementById('lengthValue'),
            agentCount: document.getElementById('agentCount'),
            statusDisplay: document.getElementById('statusDisplay'),
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            clearChatBtn: document.getElementById('clearChatBtn'),
            toggleViewBtn: document.getElementById('toggleViewBtn'),
            chatView: document.getElementById('chatView'),
            nodeView: document.getElementById('nodeView'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            nodeCanvas: document.getElementById('nodeCanvas'),
            nodeInfo: document.getElementById('nodeInfo'),
            nodeInfoHeader: document.getElementById('nodeInfoHeader'),
            nodeInfoContent: document.getElementById('nodeInfoContent'),
            toggleInfoBtn: document.getElementById('toggleInfoBtn'),
            chatTabBtn: document.getElementById('chatTabBtn'),
            consoleTabBtn: document.getElementById('consoleTabBtn'),
            consoleView: document.getElementById('consoleView'),
            consoleContent: document.getElementById('consoleContent'),
            clearConsoleBtn: document.getElementById('clearConsoleBtn'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            executionStats: document.getElementById('executionStats'),
            executedCount: document.getElementById('executedCount'),
            totalCount: document.getElementById('totalCount'),
            modifierPreview: document.getElementById('modifierPreview'),
            dropdownBtn: document.getElementById('dropdownBtn'),
            dropdownMenu: document.getElementById('dropdownMenu'),
            dropdownArrow: document.getElementById('dropdownArrow'),
            selectedModifier: document.getElementById('selectedModifier')
        };
    }

    setupEventListeners() {
        this.elements.newSessionBtn.addEventListener('click', () => this.createNewSession());
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.clearChatBtn.addEventListener('click', () => this.clearChat());
        this.elements.toggleViewBtn.addEventListener('click', () => {
            if (this.elements.toggleViewBtn.textContent === 'Back') {
                this.showTab('chat');
            } else {
                this.toggleView();
            }
        });
        this.elements.toggleInfoBtn.addEventListener('click', () => this.toggleInfoBox());
        this.elements.chatTabBtn.addEventListener('click', () => this.showTab('chat'));
        this.elements.consoleTabBtn.addEventListener('click', () => this.showTab('console'));
        this.elements.clearConsoleBtn.addEventListener('click', () => this.clearConsole());
        
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
            }
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
            }
        });

        // Custom dropdown event listeners
        this.setupCustomDropdown();
        this.setupTooltips();
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
        
        switch (modifier) {
            case 'flat':
                for (let layer = 0; layer < depth; layer++) {
                    layerCounts.push(Math.pow(length, layer));
                }
                break;
                
            case 'subtract':
                // Starts at base length, decreases each layer to 1
                for (let layer = 0; layer < depth; layer++) {
                    if (layer === 0) {
                        layerCounts.push(1); // Root layer
                    } else {
                        const agentsInLayer = Math.max(1, Math.round(length - ((length - 1) * (layer - 1) / (depth - 2))));
                        const parentCount = layerCounts[layer - 1];
                        layerCounts.push(parentCount * agentsInLayer);
                    }
                }
                break;
                
            case 'add':
                // Starts small, increases to base length in final layer
                for (let layer = 0; layer < depth; layer++) {
                    if (layer === 0) {
                        layerCounts.push(1); // Root layer
                    } else {
                        const agentsInLayer = Math.max(1, Math.round(1 + ((length - 1) * (layer - 1) / (depth - 2))));
                        const parentCount = layerCounts[layer - 1];
                        layerCounts.push(parentCount * agentsInLayer);
                    }
                }
                break;
                
            case 'shrink_divided':
                // First layer = base length, each layer = base / layer number
                for (let layer = 0; layer < depth; layer++) {
                    if (layer === 0) {
                        layerCounts.push(1); // Root layer
                    } else {
                        const agentsInLayer = Math.max(1, Math.round(length / layer));
                        const parentCount = layerCounts[layer - 1];
                        layerCounts.push(parentCount * agentsInLayer);
                    }
                }
                break;
                
            case 'grow_divided':
                // Opposite of shrink_divided, ending at base length
                for (let layer = 0; layer < depth; layer++) {
                    if (layer === 0) {
                        layerCounts.push(1); // Root layer
                    } else {
                        const reverseLayer = depth - layer;
                        const agentsInLayer = layer === depth - 1 ? length : Math.max(1, Math.round(length / reverseLayer));
                        const parentCount = layerCounts[layer - 1];
                        layerCounts.push(parentCount * agentsInLayer);
                    }
                }
                break;
                
            default:
                // Fallback to flat
                for (let layer = 0; layer < depth; layer++) {
                    layerCounts.push(Math.pow(length, layer));
                }
        }
        
        return layerCounts;
    }

    updateModifierPreview() {
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
        this.isDropdownOpen = true;
        this.elements.dropdownMenu.classList.remove('hidden');
        this.elements.dropdownArrow.style.transform = 'rotate(180deg)';
    }
    
    closeDropdown() {
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
        
        // Update button display
        this.elements.dropdownBtn.querySelector('svg').outerHTML = selected.icon;
        this.elements.selectedModifier.textContent = selected.name;
        
        // Update calculations and 3D view
        this.updateAgentCount();
        this.updateModifierPreview();
        if (!this.elements.nodeView.classList.contains('hidden')) {
            this.createAgentFractal();
        }
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

    async createNewSession() {
        try {
            const goal = this.elements.goalInput.value || 'General AI assistance';
            this.updateStatus('Creating new session...');
            
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal })
            });
            
            const data = await response.json();
            this.sessionId = data.sessionId;
            this.updateStatus(`Session created with goal: ${goal}`);
            this.hideWelcomeScreen();
            this.elements.chatMessages.innerHTML = ''; // Clear any existing content
            
            this.addMessage('system', `New session started with goal: "${goal}"`);
        } catch (error) {
            this.updateStatus('Error creating session');
            console.error('Session creation error:', error);
        }
    }

    async sendMessage() {
        if (this.isProcessing || !this.sessionId) {
            if (!this.sessionId) {
                this.addMessage('system', 'Please create a new session first.');
            }
            return;
        }

        const message = this.elements.chatInput.value.trim();
        if (!message) return;

        this.elements.chatInput.value = '';
        this.addMessage('user', message);
        
        this.isProcessing = true;
        
        // Start with a simple loading message
        const tempMessage = this.addMessage('agent', 'Processing...');

        try {
            const depth = parseInt(this.elements.depthSlider.value);
            const length = parseInt(this.elements.lengthSlider.value);
            const apiKey = this.elements.apiKeyInput.value.trim() || null;

            // Show execution stats
            const totalPossible = this.calculateAgents(depth, length);
            this.elements.totalCount.textContent = totalPossible;
            this.elements.executedCount.textContent = '0';
            this.elements.executionStats.classList.remove('hidden');

            const modifier = this.getCurrentModifier();
            
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    query: message,
                    depth,
                    length,
                    modifier,
                    apiKey
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.currentTree = data.tree;
                
                // Remove the temporary message
                tempMessage.remove();
                
                // If fractal was used, show the fractal processing message
                if (data.executionLog) {
                    const processingBubble = this.addProcessingMessage();
                    setTimeout(() => {
                        this.updateProcessingMessage(processingBubble, data.response);
                    }, 500); // Brief delay to show fractal processing
                } else {
                    // Direct response without fractal processing
                    this.addMessage('agent', data.response);
                }
                
                // Update execution stats
                this.elements.executedCount.textContent = data.executedAgents || 1;
                
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
                this.addMessage('agent', `Error: ${data.error}`);
                this.updateStatus('Error processing query');
            }
        } catch (error) {
            tempMessage.remove();
            this.addMessage('agent', 'Network error occurred');
            this.updateStatus('Network error');
            console.error('Query error:', error);
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-bubble ${type}`;
        
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
        
        return messageDiv; // Return the element so it can be removed if needed
    }

    clearChat() {
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
        
        // Scroll to bottom
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    showTab(tab) {
        // Hide all views first
        this.elements.chatView.classList.add('hidden');
        this.elements.consoleView.classList.add('hidden'); 
        this.elements.nodeView.classList.add('hidden');
        
        // Remove all active states
        this.elements.chatTabBtn.classList.remove('active');
        this.elements.consoleTabBtn.classList.remove('active');
        
        // Stop any 3D animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Show the requested tab and update button state
        if (tab === 'chat') {
            this.elements.chatView.classList.remove('hidden');
            this.elements.chatTabBtn.classList.add('active');
            this.elements.toggleViewBtn.textContent = '3D View';
        } else if (tab === 'console') {
            this.elements.consoleView.classList.remove('hidden');
            this.elements.consoleTabBtn.classList.add('active');
            this.elements.toggleViewBtn.textContent = '3D View';
        }
    }

    clearConsole() {
        this.elements.consoleContent.innerHTML = `
            <div class="text-gray-400 text-center py-8">
                <p>Console cleared.</p>
                <p class="text-sm mt-2">Execute a complex query to see the fractal system in action.</p>
            </div>
        `;
    }

    addConsoleLog(executionLog) {
        // Clear the empty state message
        if (this.elements.consoleContent.querySelector('.text-center')) {
            this.elements.consoleContent.innerHTML = '';
        }
        
        const logEntry = document.createElement('div');
        logEntry.className = 'border border-gray-600 rounded-lg p-4 bg-fractal-gray';
        
        logEntry.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold text-fractal-green">Fractal Execution ${new Date().toLocaleTimeString()}</h3>
                <button class="text-xs text-gray-400 hover:text-white toggle-details">Show Details</button>
            </div>
            
            <div class="summary mb-3">
                <p class="text-sm text-gray-300">${executionLog.summary || 'Fractal processing completed'}</p>
                <div class="text-xs text-gray-500 mt-1">
                    Max Layers: ${executionLog.maxDepth} | Max Branching: ${executionLog.maxBranching} | 
                    Executed: ${executionLog.executedAgents || 0} / ${executionLog.totalPossibleAgents || 0} agents
                </div>
            </div>
            
            <div class="details hidden">
                <div class="space-y-3 max-h-96 overflow-y-auto">
                    ${this.renderExecutionDetails(executionLog)}
                </div>
            </div>
        `;
        
        // Add toggle functionality
        const toggleBtn = logEntry.querySelector('.toggle-details');
        const details = logEntry.querySelector('.details');
        
        toggleBtn.addEventListener('click', () => {
            details.classList.toggle('hidden');
            toggleBtn.textContent = details.classList.contains('hidden') ? 'Show Details' : 'Hide Details';
        });
        
        this.elements.consoleContent.appendChild(logEntry);
        this.elements.consoleContent.scrollTop = this.elements.consoleContent.scrollHeight;
    }

    renderExecutionDetails(log) {
        if (!log.agents) return '<p class="text-gray-400">No detailed logs available</p>';
        
        return log.agents.map(agent => {
            const taskHtml = agent.task ? `
                <div class="bg-fractal-dark p-2 rounded text-xs mb-2">
                    <strong>Task:</strong> ${agent.task.subtask || 'Root query'}<br>
                    ${agent.task.focus ? `<strong>Focus:</strong> ${agent.task.focus}` : ''}
                </div>
            ` : '';
            
            let responseHtml = '<em class="text-gray-500">No response</em>';
            if (agent.response) {
                responseHtml = this.renderMarkdown(agent.response);
            }
                
            return `
                <div class="border-l-2 border-fractal-blue pl-3 mb-3">
                    <div class="text-sm font-semibold mb-1">
                        Layer ${agent.layer} - Agent ${agent.position} 
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

    toggleView() {
        // Hide all views first
        this.elements.chatView.classList.add('hidden');
        this.elements.consoleView.classList.add('hidden');
        this.elements.nodeView.classList.add('hidden');
        
        // Remove all tab active states
        this.elements.chatTabBtn.classList.remove('active');
        this.elements.consoleTabBtn.classList.remove('active');
        
        // Stop any animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Show 3D view
        this.elements.nodeView.classList.remove('hidden');
        this.elements.toggleViewBtn.textContent = 'Back';
        
        this.init3DFractal();
        
        if (this.currentTree) {
            this.renderNodeGraph(this.currentTree);
        } else {
            // Show agent fractal when no data is available
            this.showDemoFractal();
        }
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
        
        this.elements.nodeInfoContent.innerHTML = `
            <p class="text-sm text-gray-400 mb-3">Total Agents: <span class="text-white font-semibold">${totalAgents}</span></p>
            <p class="text-sm text-gray-400 mb-4">Depth: <span class="text-white">${depth}</span> | Length: <span class="text-white">${length}</span></p>
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

    if (content.style.display === 'none') {
        content.style.display = 'block';
        btn.textContent = '▾'; // small down triangle
    } else {
        content.style.display = 'none';
        btn.textContent = '\u00A0▸'; // small right triangle
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
            
            const container = this.elements.nodeCanvas.parentElement;
            const canvas = this.elements.nodeCanvas;
            
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
        this.elements.nodeInfo.innerHTML = `
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
        
        this.elements.nodeInfo.innerHTML = `
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
        this.elements.statusDisplay.textContent = message;
    }

    showLoading(show) {
        this.elements.loadingOverlay.classList.toggle('hidden', !show);
    }
}

// Removed copy function to fix layout issues

document.addEventListener('DOMContentLoaded', () => {
    window.fractalEngine = new FractalEngineUI();
});