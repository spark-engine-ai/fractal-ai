const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3007;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Fractal processing functions that GPT can call
const fractalFunctions = [
  {
    name: "delegate_fractal_tasks",
    description: "Delegate complex tasks to multiple specialized agents in the fractal system",
    parameters: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              subtask: {
                type: "string",
                description: "Specific subtask to delegate to a child agent"
              },
              focus: {
                type: "string", 
                description: "The specific aspect or angle this subtask should focus on"
              }
            },
            required: ["subtask", "focus"]
          },
          description: "Array of 1-8 subtasks to delegate to child agents"
        },
        reason: {
          type: "string",
          description: "Why this task needs to be broken down into subtasks"
        }
      },
      required: ["tasks", "reason"]
    }
  }
];

// File system utilities for chat persistence
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function saveToFile(filePath, data) {
  try {
    await ensureDirectoryExists(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving to file:', error);
  }
}

async function loadFromFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

async function appendToConsoleLog(chatId, logEntry) {
  const logPath = path.join(__dirname, 'data', 'chats', chatId, 'console-logs.json');
  let logs = await loadFromFile(logPath) || [];
  logs.push({
    timestamp: new Date().toISOString(),
    ...logEntry
  });
  await saveToFile(logPath, logs);
}

async function saveMessage(chatId, message) {
  const messagesPath = path.join(__dirname, 'data', 'chats', chatId, 'messages.json');
  let messages = await loadFromFile(messagesPath) || [];
  messages.push({
    ...message,
    timestamp: new Date().toISOString()
  });
  await saveToFile(messagesPath, messages);
}

async function loadMessages(chatId) {
  const messagesPath = path.join(__dirname, 'data', 'chats', chatId, 'messages.json');
  return await loadFromFile(messagesPath) || [];
}

async function saveChatSettings(chatId, settings) {
  const settingsPath = path.join(__dirname, 'data', 'chats', chatId, 'settings.json');
  await saveToFile(settingsPath, settings);
}

async function loadChatSettings(chatId) {
  const settingsPath = path.join(__dirname, 'data', 'chats', chatId, 'settings.json');
  return await loadFromFile(settingsPath) || {
    depth: 3,
    length: 3,
    modifier: 'flat',
    functionsEnabled: false,
    quantumEnabled: false,
    quantumExecutions: 3
  };
}

async function saveChatMetadata(chatId, metadata) {
  const metadataPath = path.join(__dirname, 'data', 'chats', chatId, 'metadata.json');
  await saveToFile(metadataPath, metadata);
}

async function loadChatMetadata(chatId) {
  const metadataPath = path.join(__dirname, 'data', 'chats', chatId, 'metadata.json');
  return await loadFromFile(metadataPath);
}

async function saveProjectMetadata(projectId, metadata) {
  const metadataPath = path.join(__dirname, 'data', 'projects', projectId, 'metadata.json');
  await saveToFile(metadataPath, metadata);
}

async function loadProjectMetadata(projectId) {
  const metadataPath = path.join(__dirname, 'data', 'projects', projectId, 'metadata.json');
  return await loadFromFile(metadataPath);
}

async function saveProjectChats(projectId, chatIds) {
  const chatsPath = path.join(__dirname, 'data', 'projects', projectId, 'chats.json');
  await saveToFile(chatsPath, chatIds);
}

async function loadProjectChats(projectId) {
  const chatsPath = path.join(__dirname, 'data', 'projects', projectId, 'chats.json');
  return await loadFromFile(chatsPath) || [];
}

async function saveProjectSettings(projectId, settings) {
  const settingsPath = path.join(__dirname, 'data', 'projects', projectId, 'settings.json');
  await saveToFile(settingsPath, settings);
}

async function loadProjectSettings(projectId) {
  const settingsPath = path.join(__dirname, 'data', 'projects', projectId, 'settings.json');
  return await loadFromFile(settingsPath) || {
    quantumEnabled: false,
    quantumLevel: 1
  };
}

class FractalEngine {
  constructor() {
    this.sessions = new Map();
    this.executionTrees = new Map();
    this.executionLogs = new Map();
    this.activeExecutions = new Map(); // Track real-time execution
  }

  createSession(goal = "General AI assistance") {
    const sessionId = uuidv4();
    this.sessions.set(sessionId, { goal });
    return sessionId;
  }

  async processQuery(sessionId, query, maxDepth = 3, maxBranching = 3, modifier = 'flat', apiKey = null, forceFullDelegation = false, chatId = null) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    console.log(`Processing query with max depth: ${maxDepth}, max branching: ${maxBranching}, modifier: ${modifier}, force: ${forceFullDelegation}`);
    
    // Create execution tree with all possible nodes (not just executed ones)
    const executionTree = this.createFullTree(maxDepth, maxBranching, modifier, query);
    this.executionTrees.set(sessionId, executionTree);

    // Initialize execution tracking
    const executionTracking = {
      sessionId,
      timestamp: new Date().toISOString(),
      query,
      maxDepth,
      maxBranching,
      modifier,
      totalPossibleAgents: this.calculateTotalAgents(maxDepth, maxBranching, modifier),
      executedAgents: 0,
      agents: [],
      fractalUsed: false,
      executionPath: [], // Track which nodes actually executed
      currentlyExecuting: null
    };
    
    this.executionLogs.set(sessionId, executionTracking);
    this.activeExecutions.set(sessionId, executionTracking);

    // Use provided API key or fallback to environment
    const openaiClient = apiKey ? new OpenAI({ apiKey }) : openai;

    // Start with root GPT agent
    const response = await this.executeRootAgent(
      query, session.goal, maxDepth, maxBranching, 
      executionTree, executionTracking, openaiClient, forceFullDelegation, chatId
    );
    
    return {
      response: response,
      tree: executionTree,
      depth: maxDepth,
      length: maxBranching,
      executionLog: executionTracking.fractalUsed ? executionTracking : null,
      executedAgents: executionTracking.executedAgents,
      totalPossibleAgents: executionTracking.totalPossibleAgents
    };
  }

  createFullTree(maxDepth, maxBranching, modifier, rootQuery) {
    // Calculate the number of children for each layer based on modifier
    const layerChildCounts = this.calculateModifierChildCounts(maxDepth, maxBranching, modifier);
    
    const createNode = (layer, position, parentPath = []) => {
      const nodePath = [...parentPath, position];
      const childrenCount = layer < maxDepth - 1 ? layerChildCounts[layer + 1] : 0;
      
      return {
        id: uuidv4(),
        layer,
        position,
        path: nodePath,
        query: layer === 0 ? rootQuery : null,
        response: null,
        executed: false,
        currentlyExecuting: false,
        children: childrenCount > 0 ? 
          Array.from({ length: childrenCount }, (_, i) => 
            createNode(layer + 1, i, nodePath)
          ) : []
      };
    };

    return createNode(0, 0);
  }

  calculateTotalAgents(depth, branching, modifier = 'flat') {
    const layerCounts = this.calculateModifierLayerCounts(depth, branching, modifier);
    return layerCounts.reduce((sum, count) => sum + count, 0);
  }

  calculateModifierLayerCounts(depth, length, modifier) {
    const layerCounts = [];
    const childCounts = this.calculateModifierChildCounts(depth, length, modifier);
    
    // Calculate total agents per layer based on child counts
    for (let layer = 0; layer < depth; layer++) {
      if (layer === 0) {
        layerCounts.push(1); // Root layer always has 1 agent
      } else {
        const parentCount = layerCounts[layer - 1];
        const childrenPerParent = childCounts[layer - 1]; // Previous layer's child count
        layerCounts.push(parentCount * childrenPerParent);
      }
    }
    
    return layerCounts;
  }

  calculateModifierChildCounts(depth, length, modifier) {
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
    
    return childCounts;
  }

  async executeRootAgent(query, goal, maxDepth, maxBranching, treeNode, executionTracking, openaiClient, forceFullDelegation = false, chatId = null) {
    try {
      // Mark this node as currently executing
      treeNode.currentlyExecuting = true;
      
      // Get the modifier-specific child count for this layer (root = layer 0)
      const childCounts = this.calculateModifierChildCounts(maxDepth, maxBranching, executionTracking.modifier);
      const rootChildCount = childCounts[0]; // Layer 0 children
      executionTracking.currentlyExecuting = treeNode.path;
      
      const systemPrompt = forceFullDelegation ? 
        `You are the root agent of a fractal reasoning system. Your goal: ${goal}

🔴 FORCE DELEGATION MODE ACTIVE 🔴
You MUST use the delegate_fractal_tasks function for this query.
MANDATORY: Create exactly ${rootChildCount} specialized agents.
Do NOT respond directly - ALWAYS delegate to ${rootChildCount} agents.

Each subtask should be specific and focused on a different aspect of the problem.` :
        `You are the root agent of a fractal reasoning system. Your goal: ${goal}
            
You can either:
1. Answer simple queries directly
2. For complex queries, use the delegate_fractal_tasks function to break the task into subtasks for specialized agents

When delegating, create exactly ${rootChildCount} focused subtasks. The system has a max depth of ${maxDepth} layers.
Each subtask should be specific and focused on a different aspect of the problem.`;
      
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user", 
            content: query
          }
        ],
        functions: fractalFunctions,
        function_call: forceFullDelegation ? { name: "delegate_fractal_tasks" } : "auto",
        temperature: 0.7
      });

      const message = completion.choices[0].message;
      
      if (message.function_call && message.function_call.name === "delegate_fractal_tasks") {
        // Delegate to fractal system
        const args = JSON.parse(message.function_call.arguments);
        console.log(`AI delegating to ${args.tasks.length} specialized agents`);
        
        // Log to console if chatId available
        if (chatId) {
          await appendToConsoleLog(chatId, {
            type: 'delegation',
            message: `AI delegating to ${args.tasks.length} specialized agents`
          });
        }
        
        // Mark as fractal execution and track execution
        executionTracking.fractalUsed = true;
        executionTracking.summary = `Root agent delegated to ${args.tasks.length} specialized agents: ${args.reason}`;
        
        // Mark root node as executed
        treeNode.executed = true;
        treeNode.currentlyExecuting = false;
        executionTracking.executedAgents++;
        executionTracking.executionPath.push(treeNode.path);
        
        // Log root agent
        executionTracking.agents.push({
          layer: 0,
          position: 0,
          type: 'root',
          path: treeNode.path,
          task: { subtask: query, focus: 'Main user query' },
          response: `Delegating to ${args.tasks.length} agents: ${args.reason}`,
          delegated: true
        });
        
        const childResults = await this.executeFractalLayer(
          args.tasks, goal, 1, maxDepth, maxBranching, treeNode, executionTracking, openaiClient, chatId
        );
        
        // Synthesize results back to user
        const finalResponse = await this.synthesizeResults(childResults, query, goal, executionTracking, openaiClient);
        treeNode.response = finalResponse;
        
        return finalResponse;
      } else {
        // Direct response - mark as executed
        const directResponse = message.content;
        treeNode.executed = true;
        treeNode.currentlyExecuting = false;
        treeNode.response = directResponse;
        executionTracking.executedAgents++;
        executionTracking.executionPath.push(treeNode.path);
        
        console.log("Root agent decided not to create more agents - responding directly");
        return directResponse;
      }
      
    } catch (error) {
      console.error('Root agent error:', error);
      const errorResponse = `I encountered an error while processing your request: ${error.message}`;
      treeNode.response = errorResponse;
      return errorResponse;
    }
  }

  async executeFractalLayer(tasks, goal, currentLayer, maxDepth, maxBranching, parentNode, executionTracking, openaiClient, chatId = null) {
    console.log(`Executing layer ${currentLayer} with ${tasks.length} tasks`);
    
    // Get modifier-specific child count for this layer
    const childCounts = this.calculateModifierChildCounts(maxDepth, maxBranching, executionTracking.modifier);
    const layerChildCount = childCounts[currentLayer] || maxBranching; // fallback to maxBranching
    
    const childPromises = tasks.slice(0, layerChildCount).map(async (task, index) => {
      // Find the corresponding child node in the pre-built tree
      const childNode = parentNode.children[index];
      if (!childNode) {
        console.error(`Child node not found at layer ${currentLayer}, position ${index}`);
        return null;
      }
      
      // Update node with task information
      childNode.query = task.subtask;
      childNode.focus = task.focus;
      
      if (currentLayer >= maxDepth - 1) {
        // Leaf agent - execute directly
        const response = await this.executeLeafAgent(task, goal, childNode, executionTracking, openaiClient, chatId);
        return response;
      } else {
        // Intermediate agent - can delegate further
        const response = await this.executeIntermediateAgent(
          task, goal, currentLayer, maxDepth, maxBranching, childNode, executionTracking, openaiClient, chatId
        );
        return response;
      }
    });

    return Promise.all(childPromises);
  }

  async executeLeafAgent(task, goal, treeNode, executionTracking, openaiClient, chatId = null) {
    try {
      console.log(`Agent ${treeNode.position + 1} starting: ${task.subtask}`);
      
      // Broadcast live update
      const currentSession = this.sessions.get(executionTracking.sessionId);
      if (currentSession) {
        broadcastToSession(executionTracking.sessionId, {
          type: 'agent_start',
          agentId: treeNode.position + 1,
          layer: treeNode.layer,
          task: task.subtask,
          focus: task.focus,
          timestamp: new Date().toISOString()
        });
      }
      
      // Log to console if chatId available
      if (chatId) {
        await appendToConsoleLog(chatId, {
          type: 'agent_start',
          message: `Agent ${treeNode.position + 1} starting: ${task.subtask}`
        });
      }
      
      // Mark as currently executing
      treeNode.currentlyExecuting = true;
      executionTracking.currentlyExecuting = treeNode.path;
      
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o", 
        messages: [
          {
            role: "system",
            content: `You are a leaf agent in a fractal reasoning system. Goal: ${goal}
            
Execute this specific subtask directly and provide a focused, detailed response.
Focus: ${task.focus}

Provide concrete, actionable insights that will be valuable when synthesized with other agents' work.`
          },
          {
            role: "user",
            content: task.subtask
          }
        ],
        temperature: 0.7
      });

      const response = completion.choices[0].message.content;
      treeNode.response = response;
      
      // Mark as executed
      treeNode.executed = true;
      treeNode.currentlyExecuting = false;
      executionTracking.executedAgents++;
      executionTracking.executionPath.push(treeNode.path);
      
      console.log(`Layer ${treeNode.layer} Agent ${treeNode.position + 1} completed: ${task.subtask}`);
      
      // Broadcast completion update
      const completionSession = this.sessions.get(executionTracking.sessionId);
      if (completionSession) {
        broadcastToSession(executionTracking.sessionId, {
          type: 'agent_complete',
          agentId: treeNode.position + 1,
          layer: treeNode.layer,
          task: task.subtask,
          focus: task.focus,
          response: response.substring(0, 200) + (response.length > 200 ? '...' : ''), // Truncated response
          timestamp: new Date().toISOString()
        });
      }
      
      // Log completion if chatId available
      if (chatId) {
        await appendToConsoleLog(chatId, {
          type: 'agent_complete',
          message: `Layer ${treeNode.layer} Agent ${treeNode.position + 1} completed: ${task.subtask}`
        });
      }
      
      // Log leaf agent execution
      executionTracking.agents.push({
        layer: treeNode.layer,
        position: treeNode.position,
        type: 'leaf',
        path: treeNode.path,
        task: task,
        response: response,
        delegated: false
      });
      
      return {
        subtask: task.subtask,
        focus: task.focus,
        result: response,
        layer: treeNode.layer,
        position: treeNode.position
      };
      
    } catch (error) {
      console.error('Leaf agent error:', error);
      const errorResult = {
        subtask: task.subtask,
        focus: task.focus,
        result: `Error executing subtask: ${error.message}`,
        layer: treeNode.layer,
        position: treeNode.position
      };
      treeNode.response = errorResult.result;
      return errorResult;
    }
  }

  async executeIntermediateAgent(task, goal, currentLayer, maxDepth, maxBranching, treeNode, executionLog, openaiClient, chatId = null) {
    try {
      console.log(`Intermediate agent at layer ${currentLayer} executing: ${task.subtask}`);
      
      // Get modifier-specific child count for this layer
      const childCounts = this.calculateModifierChildCounts(maxDepth, maxBranching, executionLog.modifier);
      const layerChildCount = childCounts[currentLayer] || maxBranching; // fallback to maxBranching
      
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: `You are an intermediate agent in a fractal reasoning system at layer ${currentLayer}/${maxDepth}. Goal: ${goal}
            
You can either:
1. Handle this subtask directly if it's straightforward
2. Use delegate_fractal_tasks to break it into exactly ${layerChildCount} more specific subtasks

Focus: ${task.focus}
Current layer: ${currentLayer}, Max depth: ${maxDepth}`
          },
          {
            role: "user",
            content: task.subtask
          }
        ],
        functions: fractalFunctions,
        function_call: "auto", 
        temperature: 0.7
      });

      const message = completion.choices[0].message;
      
      if (message.function_call && message.function_call.name === "delegate_fractal_tasks") {
        // Delegate further
        const args = JSON.parse(message.function_call.arguments);
        console.log(`Intermediate agent delegating ${args.tasks.length} subtasks`);
        
        const childResults = await this.executeFractalLayer(
          args.tasks, goal, currentLayer + 1, maxDepth, maxBranching, treeNode, executionLog, openaiClient, chatId
        );
        
        // Synthesize child results  
        const synthesizedResult = await this.synthesizeResults(childResults, task.subtask, goal, executionLog, openaiClient);
        treeNode.response = synthesizedResult;
        
        // Mark intermediate agent as executed and log it
        treeNode.executed = true;
        treeNode.currentlyExecuting = false;
        executionLog.executedAgents++;
        executionLog.executionPath.push(treeNode.path);
        
        console.log(`Layer ${currentLayer} Agent ${treeNode.position + 1} (intermediate) synthesized results from ${childResults.length} children`);
        
        // Log to chat console if chatId available
        if (chatId) {
          await appendToConsoleLog(chatId, {
            type: 'agent_complete',
            message: `Layer ${currentLayer} Agent ${treeNode.position + 1} (intermediate) synthesized results from ${childResults.length} children`
          });
        }
        
        // Log intermediate agent
        executionLog.agents.push({
          layer: currentLayer,
          position: treeNode.position,
          type: 'intermediate',
          path: treeNode.path,
          task: task,
          response: synthesizedResult,
          delegated: true
        });
        
        return {
          subtask: task.subtask,
          focus: task.focus, 
          result: synthesizedResult,
          layer: currentLayer,
          position: treeNode.position
        };
      } else {
        // Direct response - decided not to create more agents
        const directResult = message.content;
        treeNode.response = directResult;
        
        // Mark intermediate agent as executed and count it
        treeNode.executed = true;
        treeNode.currentlyExecuting = false;
        executionLog.executedAgents++;
        executionLog.executionPath.push(treeNode.path);
        
        console.log(`Layer ${currentLayer} Agent ${treeNode.position + 1} (intermediate) decided not to delegate - responding directly`);
        
        // Log to chat console if chatId available
        if (chatId) {
          await appendToConsoleLog(chatId, {
            type: 'agent_complete',
            message: `Layer ${currentLayer} Agent ${treeNode.position + 1} (intermediate) decided not to delegate - responding directly`
          });
        }
        
        // Log intermediate agent that chose direct response
        executionLog.agents.push({
          layer: currentLayer,
          position: treeNode.position,
          type: 'intermediate',
          path: treeNode.path,
          task: task,
          response: directResult,
          delegated: false
        });
        
        return {
          subtask: task.subtask,
          focus: task.focus,
          result: directResult,
          layer: currentLayer,
          position: treeNode.position
        };
      }
      
    } catch (error) {
      console.error('Intermediate agent error:', error);
      const errorResult = {
        subtask: task.subtask,
        focus: task.focus,
        result: `Error in intermediate processing: ${error.message}`,
        layer: currentLayer,
        position: treeNode.position
      };
      treeNode.response = errorResult.result;
      return errorResult;
    }
  }

  async synthesizeResults(childResults, originalQuery, goal, executionLog = null, openaiClient = openai) {
    try {
      console.log(`Synthesizing ${childResults.length} results`);
      
      const resultsText = childResults
        .filter(r => r && r.result) // Filter out null/undefined results
        .map(r => 
          `Subtask: ${r.subtask || 'Unknown task'}\nFocus: ${r.focus || 'No focus specified'}\nResult: ${r.result}`
        ).join('\n\n');
      
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are synthesizing results from ${childResults.length} specialized agents. Goal: ${goal}
            
Combine their findings into a coherent, comprehensive response to the original query.
Focus on integrating insights, identifying patterns, and providing a unified answer.`
          },
          {
            role: "user", 
            content: `Original query: ${originalQuery}\n\nAgent results:\n${resultsText}\n\nSynthesize these into a comprehensive response.`
          }
        ],
        temperature: 0.6
      });

      const synthesis = completion.choices[0].message.content;
      console.log("Synthesis completed");
      return synthesis;
      
    } catch (error) {
      console.error('Synthesis error:', error);
      return `Error synthesizing results: ${error.message}. Here are the individual results:\n\n${childResults.filter(r => r && r.result).map(r => r.result).join('\n\n')}`;
    }
  }

  async synthesizeQuantumResults(quantumResults, originalQuery, apiKey = null) {
    try {
      console.log(`Synthesizing ${quantumResults.length} quantum execution results`);
      
      const openaiClient = apiKey ? new OpenAI({ apiKey }) : openai;
      
      const resultsText = quantumResults.map((result, i) => 
        `Quantum Execution ${i + 1}:\n${result.response}`
      ).join('\n\n---\n\n');
      
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are synthesizing results from ${quantumResults.length} parallel quantum executions of the same query.
            
Each execution approached the problem independently. Your task is to:
1. Identify common themes and consistent insights across all executions
2. Highlight unique perspectives that only appeared in some executions
3. Resolve any contradictions by weighing the evidence
4. Create a comprehensive, unified response that leverages the best insights from all executions

Focus on creating a richer, more nuanced answer than any single execution could provide.`
          },
          {
            role: "user", 
            content: `Original query: ${originalQuery}\n\nQuantum execution results:\n${resultsText}\n\nSynthesize these quantum results into the most comprehensive response possible.`
          }
        ],
        temperature: 0.5
      });

      const synthesis = completion.choices[0].message.content;
      console.log("Quantum synthesis completed");
      return synthesis;
      
    } catch (error) {
      console.error('Quantum synthesis error:', error);
      return `Error synthesizing quantum results: ${error.message}. Here are the individual quantum results:\n\n${quantumResults.map((r, i) => `Execution ${i + 1}: ${r.response}`).join('\n\n')}`;
    }
  }
}

const engine = new FractalEngine();

// Store active SSE connections for streaming updates
const activeConnections = new Map();

// Helper function to broadcast events to connected clients
function broadcastToSession(sessionId, eventData) {
  const connection = activeConnections.get(sessionId);
  if (connection) {
    try {
      connection.write(`data: ${JSON.stringify(eventData)}\n\n`);
    } catch (error) {
      console.error('Error broadcasting to session:', error);
      activeConnections.delete(sessionId);
    }
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server-Sent Events endpoint for streaming agent updates
app.get('/api/stream/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Store the connection
  activeConnections.set(sessionId, res);
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    sessionId: sessionId,
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Clean up on client disconnect
  req.on('close', () => {
    activeConnections.delete(sessionId);
  });
});

app.post('/api/session', (req, res) => {
  const { goal } = req.body;
  const sessionId = engine.createSession(goal);
  res.json({ sessionId });
});

app.post('/api/query', async (req, res) => {
  try {
    const { 
      sessionId, 
      query, 
      maxDepth = 3, 
      maxBranching = 3, 
      modifier = 'flat', 
      apiKey = null, 
      forceFullDelegation = false,
      chatId = null,
      quantumEnabled = false,
      quantumExecutions = 1
    } = req.body;
    
    // Save user message if chatId provided
    if (chatId) {
      await saveMessage(chatId, {
        type: 'user',
        content: query
      });
      
      // Save processing message
      await saveMessage(chatId, {
        type: 'assistant',
        content: 'Processing...'
      });
      
      // Log fractal processing start
      await appendToConsoleLog(chatId, {
        type: 'fractal_start',
        message: `Processing fractal query: ${query}`,
        settings: { maxDepth, maxBranching, modifier, forceFullDelegation, quantumEnabled, quantumExecutions }
      });
    }
    
    let result;
    
    if (quantumEnabled && quantumExecutions > 1) {
      // Quantum mode: run multiple times and synthesize
      console.log(`Running quantum execution ${quantumExecutions} times`);
      const results = [];
      
      for (let i = 0; i < quantumExecutions; i++) {
        console.log(`Quantum execution ${i + 1}/${quantumExecutions}`);
        if (chatId) {
          await appendToConsoleLog(chatId, {
            type: 'quantum_execution',
            message: `Quantum execution ${i + 1}/${quantumExecutions}`
          });
        }
        
        const quantumResult = await engine.processQuery(sessionId, query, maxDepth, maxBranching, modifier, apiKey, forceFullDelegation, chatId);
        results.push(quantumResult);
      }
      
      // Synthesize quantum results
      const finalResponse = await engine.synthesizeQuantumResults(results, query, apiKey);
      
      result = {
        response: finalResponse,
        tree: results[0].tree, // Use first tree as reference
        depth: maxDepth,
        length: maxBranching,
        executionLog: null,
        executedAgents: results.reduce((sum, r) => sum + r.executedAgents, 0),
        totalPossibleAgents: results[0].totalPossibleAgents * quantumExecutions,
        quantumResults: results.length
      };
    } else {
      // Normal execution
      result = await engine.processQuery(sessionId, query, maxDepth, maxBranching, modifier, apiKey, forceFullDelegation, chatId);
    }
    
    // Save assistant response if chatId provided
    if (chatId) {
      // Update the "Processing..." message with actual response
      const messages = await loadMessages(chatId);
      const processingMessage = messages.filter(m => m.content === 'Processing...').pop();
      if (processingMessage) {
        // Remove processing message and add actual response
        const filteredMessages = messages.filter(m => m !== processingMessage);
        filteredMessages.push({
          type: 'assistant',
          content: result.response,
          timestamp: new Date().toISOString()
        });
        
        const messagesPath = path.join(__dirname, 'data', 'chats', chatId, 'messages.json');
        await saveToFile(messagesPath, filteredMessages);
      }
      
      // Log execution completion
      await appendToConsoleLog(chatId, {
        type: 'fractal_complete',
        message: `Fractal processing completed. Executed ${result.executedAgents}/${result.totalPossibleAgents} agents.`,
        executionStats: {
          executedAgents: result.executedAgents,
          totalPossibleAgents: result.totalPossibleAgents,
          fractalUsed: result.executionLog ? result.executionLog.fractalUsed : false
        }
      });
    }
    
    res.json(result);
  } catch (error) {
    // Log error if chatId provided
    if (req.body.chatId) {
      await appendToConsoleLog(req.body.chatId, {
        type: 'error',
        message: `Error processing query: ${error.message}`
      });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// New endpoint for real-time execution status
app.get('/api/execution/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const execution = engine.activeExecutions.get(sessionId);
    
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    
    res.json({
      currentlyExecuting: execution.currentlyExecuting,
      executedAgents: execution.executedAgents,
      totalPossibleAgents: execution.totalPossibleAgents,
      executionPath: execution.executionPath
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Chat persistence endpoints
app.post('/api/chats', async (req, res) => {
  try {
    const { goal, projectId } = req.body;
    console.log('Creating chat with goal:', goal, 'and projectId:', projectId); // Debug
    const chatId = uuidv4();
    const sessionId = engine.createSession(goal);
    
    const metadata = {
      id: chatId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessionId,
      goal: goal || "General AI assistance",
      projectId: projectId || null
    };
    
    await saveChatMetadata(chatId, metadata);
    await saveChatSettings(chatId, {
      depth: 3,
      length: 3,
      modifier: 'flat',
      functionsEnabled: false,
      quantumEnabled: false,
      quantumExecutions: 3
    });
    
    // Add chat to project if projectId is provided
    if (projectId) {
      try {
        const chatIds = await loadProjectChats(projectId);
        if (!chatIds.includes(chatId)) {
          chatIds.push(chatId);
          await saveProjectChats(projectId, chatIds);
          
          // Update project timestamp
          const projectMetadata = await loadProjectMetadata(projectId);
          if (projectMetadata) {
            projectMetadata.updatedAt = new Date().toISOString();
            await saveProjectMetadata(projectId, projectMetadata);
          }
        }
      } catch (projectError) {
        console.error('Error adding chat to project:', projectError);
        // Continue anyway, chat was created successfully
      }
    }
    
    res.json({ chatId, sessionId, metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const metadata = await loadChatMetadata(chatId);
    
    if (!metadata) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const messages = await loadMessages(chatId);
    const settings = await loadChatSettings(chatId);
    
    // Load console logs and stream logs
    const consoleLogsPath = path.join(__dirname, 'data', 'chats', chatId, 'console-logs.json');
    const streamLogsPath = path.join(__dirname, 'data', 'chats', chatId, 'stream-logs.json');
    
    const consoleLogs = await loadFromFile(consoleLogsPath) || [];
    const streamLogs = await loadFromFile(streamLogsPath) || [];
    
    res.json({ metadata, messages, settings, consoleLogs, streamLogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    
    await saveMessage(chatId, message);
    
    // Update metadata timestamp
    const metadata = await loadChatMetadata(chatId);
    if (metadata) {
      metadata.updatedAt = new Date().toISOString();
      await saveChatMetadata(chatId, metadata);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await loadMessages(chatId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/chats/:chatId/settings', async (req, res) => {
  try {
    const { chatId } = req.params;
    const settings = req.body;
    
    await saveChatSettings(chatId, settings);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chats/:chatId/settings', async (req, res) => {
  try {
    const { chatId } = req.params;
    const settings = await loadChatSettings(chatId);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chats/:chatId/console-logs', async (req, res) => {
  try {
    const { chatId } = req.params;
    const logPath = path.join(__dirname, 'data', 'chats', chatId, 'console-logs.json');
    const logs = await loadFromFile(logPath) || [];
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all chats
app.get('/api/chats', async (req, res) => {
  try {
    const chatsDir = path.join(__dirname, 'data', 'chats');
    await ensureDirectoryExists(chatsDir);
    
    const chatDirs = await fs.readdir(chatsDir);
    const chats = [];
    
    for (const chatDir of chatDirs) {
      const metadata = await loadChatMetadata(chatDir);
      if (metadata) {
        chats.push(metadata);
      }
    }
    
    // Sort by updatedAt, newest first
    chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update/save chat
app.put('/api/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const chatData = req.body;
    
    // Extract different parts of chat data
    const { messages, consoleLogs, streamLogs, settings, ...metadata } = chatData;
    
    // Save metadata
    await saveChatMetadata(chatId, {
      ...metadata,
      updatedAt: new Date().toISOString()
    });
    
    // Save messages if provided
    if (messages && Array.isArray(messages)) {
      const messagesPath = path.join(__dirname, 'data', 'chats', chatId, 'messages.json');
      await saveToFile(messagesPath, messages);
    }
    
    // Save console logs if provided
    if (consoleLogs && Array.isArray(consoleLogs)) {
      const consoleLogsPath = path.join(__dirname, 'data', 'chats', chatId, 'console-logs.json');
      await saveToFile(consoleLogsPath, consoleLogs);
    }
    
    // Save stream logs if provided
    if (streamLogs && Array.isArray(streamLogs)) {
      const streamLogsPath = path.join(__dirname, 'data', 'chats', chatId, 'stream-logs.json');
      await saveToFile(streamLogsPath, streamLogs);
    }
    
    // Save settings if provided
    if (settings && typeof settings === 'object') {
      await saveChatSettings(chatId, settings);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete chat
app.delete('/api/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const chatDir = path.join(__dirname, 'data', 'chats', chatId);
    
    await fs.rmdir(chatDir, { recursive: true });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Projects API endpoints
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description = '' } = req.body;
    const projectId = uuidv4();
    
    const metadata = {
      id: projectId,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await saveProjectMetadata(projectId, metadata);
    await saveProjectChats(projectId, []);
    await saveProjectSettings(projectId, {
      quantumEnabled: false,
      quantumLevel: 1
    });
    
    res.json({ projectId, metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const projectsDir = path.join(__dirname, 'data', 'projects');
    await ensureDirectoryExists(projectsDir);
    
    const projectDirs = await fs.readdir(projectsDir);
    const projects = [];
    
    for (const projectDir of projectDirs) {
      const metadata = await loadProjectMetadata(projectDir);
      if (metadata) {
        projects.push(metadata);
      }
    }
    
    // Sort by updatedAt, newest first
    projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const metadata = await loadProjectMetadata(projectId);
    
    if (!metadata) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const chatIds = await loadProjectChats(projectId);
    const settings = await loadProjectSettings(projectId);
    
    // Load chat metadata for each chat in the project
    const chats = [];
    for (const chatId of chatIds) {
      const chatMetadata = await loadChatMetadata(chatId);
      if (chatMetadata) {
        chats.push(chatMetadata);
      }
    }
    
    res.json({ 
      metadata, 
      chats,
      settings,
      chatIds 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, settings, functions, ...otherData } = req.body;
    
    const metadata = await loadProjectMetadata(projectId);
    if (!metadata) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const updatedMetadata = {
      ...metadata,
      name: name || metadata.name,
      description: description !== undefined ? description : metadata.description,
      updatedAt: new Date().toISOString()
    };
    
    await saveProjectMetadata(projectId, updatedMetadata);
    
    // Save settings if provided
    if (settings && typeof settings === 'object') {
      await saveProjectSettings(projectId, settings);
    }
    
    // Save functions if provided (though this might be handled elsewhere)
    if (functions && Array.isArray(functions)) {
      // Functions are typically saved separately, but we can handle them here too
      // For now, we'll skip this as it might conflict with existing function management
    }
    
    res.json({ success: true, metadata: updatedMetadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/projects/:projectId/settings', async (req, res) => {
  try {
    const { projectId } = req.params;
    const settings = req.body;
    
    await saveProjectSettings(projectId, settings);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function JavaScript file management
app.post('/api/functions/script', async (req, res) => {
  try {
    const { functionId, functionName, jsCode } = req.body;
    
    if (!functionId || !functionName || !jsCode) {
      return res.status(400).json({ error: 'functionId, functionName, and jsCode are required' });
    }
    
    // Sanitize function name for filename
    const sanitizedName = functionName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    
    // Create functions directory structure
    const functionsDir = path.join(__dirname, 'functions');
    const scriptsDir = path.join(functionsDir, 'scripts');
    const functionDir = path.join(functionsDir, functionId);
    
    await ensureDirectoryExists(functionsDir);
    await ensureDirectoryExists(scriptsDir);
    await ensureDirectoryExists(functionDir);
    
    // Save JavaScript file
    const scriptPath = path.join(scriptsDir, `${sanitizedName}.js`);
    await fs.writeFile(scriptPath, jsCode);
    
    // Save function metadata
    const metadataPath = path.join(functionDir, 'metadata.json');
    const metadata = {
      id: functionId,
      name: functionName,
      scriptPath: scriptPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    res.json({ 
      success: true, 
      filepath: scriptPath,
      functionDir: functionDir
    });
  } catch (error) {
    console.error('Error saving function JavaScript:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all global functions
app.get('/api/functions/global', async (req, res) => {
  try {
    const functionsDir = path.join(__dirname, 'functions');
    const globalFunctions = [];
    
    // Check if functions directory exists
    try {
      await fs.access(functionsDir);
    } catch (error) {
      // Functions directory doesn't exist, return empty array
      return res.json([]);
    }
    
    // Read all function directories
    const entries = await fs.readdir(functionsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'scripts') {
        const functionDir = path.join(functionsDir, entry.name);
        const metadataPath = path.join(functionDir, 'metadata.json');
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          
          // Read JavaScript code if it exists
          let jsCode = null;
          if (metadata.scriptPath) {
            try {
              jsCode = await fs.readFile(metadata.scriptPath, 'utf-8');
            } catch (error) {
              console.warn(`Failed to read script for function ${metadata.name}:`, error.message);
            }
          }
          
          globalFunctions.push({
            ...metadata,
            jsCode: jsCode
          });
        } catch (error) {
          console.warn(`Failed to read metadata for function directory ${entry.name}:`, error.message);
        }
      }
    }
    
    res.json(globalFunctions);
  } catch (error) {
    console.error('Error loading global functions:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:projectId/chats/:chatId', async (req, res) => {
  try {
    const { projectId, chatId } = req.params;
    
    const chatIds = await loadProjectChats(projectId);
    if (!chatIds.includes(chatId)) {
      chatIds.push(chatId);
      await saveProjectChats(projectId, chatIds);
      
      // Update project timestamp
      const metadata = await loadProjectMetadata(projectId);
      if (metadata) {
        metadata.updatedAt = new Date().toISOString();
        await saveProjectMetadata(projectId, metadata);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:projectId/chats/:chatId', async (req, res) => {
  try {
    const { projectId, chatId } = req.params;
    
    const chatIds = await loadProjectChats(projectId);
    const updatedChatIds = chatIds.filter(id => id !== chatId);
    await saveProjectChats(projectId, updatedChatIds);
    
    // Update project timestamp
    const metadata = await loadProjectMetadata(projectId);
    if (metadata) {
      metadata.updatedAt = new Date().toISOString();
      await saveProjectMetadata(projectId, metadata);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectDir = path.join(__dirname, 'data', 'projects', projectId);
    
    await fs.rmdir(projectDir, { recursive: true });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Frontend expects this specific endpoint for loading project chats
app.get('/api/projects/:projectId/chats', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const chatIds = await loadProjectChats(projectId);
    
    // Load chat metadata for each chat in the project
    const chats = [];
    for (const chatId of chatIds) {
      const chatMetadata = await loadChatMetadata(chatId);
      if (chatMetadata) {
        chats.push(chatMetadata);
      }
    }
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Fractal Engine running on port ${PORT}`);
});

module.exports = app;