class FractalEngineUI {
    constructor() {
        this.sessionId = null;
        this.currentTree = null;
        this.isProcessing = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateAgentCount();
        
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
            clearConsoleBtn: document.getElementById('clearConsoleBtn')
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
            if (!this.elements.nodeView.classList.contains('hidden')) {
                this.createAgentFractal();
            }
        });
    }

    updateAgentCount() {
        const depth = parseInt(this.elements.depthSlider.value);
        const length = parseInt(this.elements.lengthSlider.value);
        
        let totalAgents = 0;
        for (let layer = 0; layer < depth; layer++) {
            totalAgents += Math.pow(length, layer);
        }
        
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
    }

    calculateAgents(depth, length) {
        let totalAgents = 0;
        for (let layer = 0; layer < depth; layer++) {
            totalAgents += Math.pow(length, layer);
        }
        return totalAgents;
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

            const response = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    query: message,
                    depth,
                    length
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
                
                this.updateStatus(`Processed with ${data.depth} layers, ${data.length} agents per layer`);
                
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
                    Layers: ${executionLog.maxDepth} | Branching: ${executionLog.maxBranching} | Total Agents: ${executionLog.totalAgents || 'Unknown'}
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
        this.create3DFractal(tree);
        this.updateNodeInfo(tree);
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
        
        // Create center node
        const centerGeometry = new THREE.SphereGeometry(0.15, 8, 6);
        const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
        const centerNode = new THREE.Mesh(centerGeometry, centerMaterial);
        this.fractalGroup.add(centerNode);
        
        // Create fractal branches layer by layer
        const nodePositions = [{ pos: new THREE.Vector3(0, 0, 0), layer: 0 }];
        
        for (let layer = 1; layer < depth; layer++) {
            const parentNodes = nodePositions.filter(n => n.layer === layer - 1);
            const radius = layer * 1.5;
            
            parentNodes.forEach(parent => {
                for (let i = 0; i < length; i++) {
                    // Distribute nodes evenly around parent
                    const angle = (i / length) * 2 * Math.PI;
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
        
        this.createFractalNode(tree, new THREE.Vector3(0, 0, 0), 1.0);
        
        this.scene.add(this.fractalGroup);
    }

    createFractalNode(node, position, scale) {
        const geometry = new THREE.SphereGeometry(0.3 * scale, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: node.layer === 0 ? 0x8b5cf6 : this.getLayerColor(node.layer),
            transparent: true,
            opacity: 0.8
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        
        this.fractalGroup.add(sphere);
        this.nodeObjects.set(node.id, sphere);
        
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

    getLayerColor(layer) {
        const colors = [0x8b5cf6, 0x3b82f6, 0x10b981, 0xf59e0b, 0xef4444, 0xec4899];
        return colors[layer % colors.length];
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.fractalGroup && !this.isDragging) {
            this.fractalGroup.rotation.y += 0.005;
        }
        
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
        
        // Headers
        html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:bold;color:#f7fafc;margin:12px 0 6px;">$1</h1>');
        html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:bold;color:#f7fafc;margin:10px 0 5px;">$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:16px;font-weight:bold;color:#f7fafc;margin:8px 0 4px;">$1</h3>');
        
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